import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import {
  FieldValue,
  getFirestore,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
  type QueryDocumentSnapshot,
  type WriteBatch,
} from 'firebase-admin/firestore';

type CleanupProgress = Record<string, number>;

type ClientDeletionJob = {
  id: string;
  clientId: string;
  clientName: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  deletionEffectiveAt: unknown;
  deletionScheduledAt?: unknown;
  deletionRequestedBy?: string | null;
  deletionReason?: string | null;
  progress?: CleanupProgress;
  errors?: string[];
};

type DeletionProcessResult = {
  processed: number;
  completed: number;
  failed: number;
  remainingDue: number;
  jobs: ClientDeletionJob[];
};

type ArchivedDocument = {
  id: string;
  originalId: string;
  originalPath: string;
  data: Record<string, unknown>;
};

type ArchiveGroup =
  | 'lguRequests'
  | 'lguAdmins'
  | 'adminInvitations'
  | 'residents'
  | 'statuses'
  | 'evacuationCenters'
  | 'announcements'
  | 'contacts'
  | 'notifications'
  | 'clientBoundaries'
  | 'clientChangeRequests';

const ARCHIVE_GROUPS: ArchiveGroup[] = [
  'lguRequests',
  'lguAdmins',
  'adminInvitations',
  'residents',
  'statuses',
  'evacuationCenters',
  'announcements',
  'contacts',
  'notifications',
  'clientBoundaries',
  'clientChangeRequests',
];

const MAX_BATCH_WRITES = 450;
const DEFAULT_MAX_DUE_JOBS = 5;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return jsonResponse(null, 204);
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  const startedAt = performance.now();

  try {
    const db = initializeFirebase();
    const auth = initializeFirebaseAuth();
    const result = await processDueDeletionJobs(db, auth);

    await createOperationLog(db, {
      action: 'client_deletion.edge_process_due_jobs',
      actionLabel: 'Processed due client deletions from Supabase',
      targetType: 'client_deletion_job',
      actorUid: 'supabase_client_deletion_scheduler',
      actorRole: 'system',
      message: `Processed ${result.processed} due client deletion job(s).`,
      after: summarizeDeletionProcessResult(result),
    });

    return jsonResponse({
      success: true,
      ...result,
      responseTimeMs: Math.round(performance.now() - startedAt),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown client deletion processing error',
        responseTimeMs: Math.round(performance.now() - startedAt),
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

function initializeFirebase(): Firestore {
  if (firestoreInstance) return firestoreInstance;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    firestoreInstance = getFirestore(existingApps[0]);
    return firestoreInstance;
  }

  const serviceAccount = getServiceAccount();
  const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });

  firestoreInstance = getFirestore(app);
  firestoreInstance.settings({ ignoreUndefinedProperties: true });
  return firestoreInstance;
}

function initializeFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  const app = getApps()[0] ?? initializeApp({ credential: cert(getServiceAccount()) });
  authInstance = getAuth(app);
  return authInstance;
}

function getServiceAccount(): ServiceAccount {
  const rawSecret = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON') ?? Deno.env.get('FIREBASE_ADMIN_CREDENTIALS');
  if (!rawSecret) {
    throw new Error('Firebase credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON.');
  }

  const raw = rawSecret.trim();
  const cleaned = raw.startsWith('{') ? raw : atob(raw);
  const parsed = JSON.parse(cleaned.replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim());
  const serviceAccount = {
    projectId: parsed.projectId ?? parsed.project_id,
    clientEmail: parsed.clientEmail ?? parsed.client_email,
    privateKey: parsed.privateKey ?? parsed.private_key,
  };
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebase service account JSON is missing project_id, client_email, or private_key.');
  }
  return serviceAccount;
}

function getMaxDueJobs(): number {
  const configured = Number(Deno.env.get('CLIENT_DELETION_MAX_JOBS'));
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_MAX_DUE_JOBS;
}

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }

  const seconds = (value as { seconds?: number; _seconds?: number }).seconds ?? (value as { _seconds?: number })._seconds;
  return typeof seconds === 'number' ? seconds * 1000 : 0;
}

function serializeJob(id: string, data: Record<string, unknown>): ClientDeletionJob {
  const status = ['scheduled', 'running', 'completed', 'failed', 'cancelled'].includes(String(data.status))
    ? (data.status as ClientDeletionJob['status'])
    : 'scheduled';

  return {
    id,
    clientId: typeof data.clientId === 'string' && data.clientId.trim() ? data.clientId.trim() : id,
    clientName:
      typeof data.clientName === 'string' && data.clientName.trim()
        ? data.clientName.trim()
        : typeof data.clientId === 'string'
          ? data.clientId
          : id,
    status,
    deletionEffectiveAt: data.deletionEffectiveAt,
    deletionScheduledAt: data.deletionScheduledAt,
    deletionRequestedBy: typeof data.deletionRequestedBy === 'string' ? data.deletionRequestedBy : null,
    deletionReason: typeof data.deletionReason === 'string' ? data.deletionReason : null,
    progress: isRecord(data.progress) ? (data.progress as CleanupProgress) : {},
    errors: Array.isArray(data.errors) ? data.errors.map(String) : [],
  };
}

async function processDueDeletionJobs(
  db: Firestore,
  auth: Auth
): Promise<DeletionProcessResult> {
  const snapshot = await db.collection('clientDeletionJobs').where('status', 'in', ['scheduled', 'running', 'failed']).get();
  const allDueJobs = snapshot.docs
    .map(doc => serializeJob(doc.id, doc.data() as Record<string, unknown>))
    .filter(job => toMillis(job.deletionEffectiveAt) <= Date.now());
  const maxJobs = getMaxDueJobs();
  const dueJobs = allDueJobs.slice(0, maxJobs);

  const results: ClientDeletionJob[] = [];
  let completed = 0;
  let failed = 0;

  for (const job of dueJobs) {
    try {
      await db.collection('clientDeletionJobs').doc(job.id).set(
        {
          status: 'running',
          startedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      const progress = await cleanupClient(db, auth, job);
      await db.collection('clientDeletionJobs').doc(job.id).set(
        {
          status: 'completed',
          progress,
          completedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      completed++;
    } catch (error) {
      failed++;
      await db.collection('clientDeletionJobs').doc(job.id).set(
        {
          status: 'failed',
          errors: FieldValue.arrayUnion(error instanceof Error ? error.message : 'Unknown deletion cleanup error'),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const updated = await db.collection('clientDeletionJobs').doc(job.id).get();
    if (updated.exists) {
      results.push(serializeJob(updated.id, updated.data() as Record<string, unknown>));
    }
  }

  return {
    processed: dueJobs.length,
    completed,
    failed,
    remainingDue: Math.max(allDueJobs.length - dueJobs.length, 0),
    jobs: results,
  };
}

function summarizeDeletionProcessResult(result: DeletionProcessResult): Record<string, unknown> {
  return {
    processed: result.processed,
    completed: result.completed,
    failed: result.failed,
    remainingDue: result.remainingDue,
    jobs: result.jobs.map(job => ({
      id: job.id,
      clientId: job.clientId,
      clientName: job.clientName,
      status: job.status,
      progress: job.progress ?? {},
      errorsCount: job.errors?.length ?? 0,
      latestError: job.errors?.[0] ?? null,
    })),
  };
}

async function cleanupClient(db: Firestore, auth: Auth, job: ClientDeletionJob): Promise<CleanupProgress> {
  const clientRef = db.collection('clients').doc(job.clientId);
  const clientSnap = await clientRef.get();

  if (!clientSnap.exists) {
    const archiveSnap = await db.collection('clientArchives').doc(job.clientId).get();
    if (archiveSnap.exists) {
      return { clientArchive: 1, clientRecord: 0 };
    }
    throw new Error('Client not found');
  }

  await clientRef.set(
    {
      status: 'deleting',
      deletionStatus: 'running',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const clientData = { id: clientSnap.id, ...(clientSnap.data() ?? {}) };
  const progress: CleanupProgress = {};
  progress.clientArchive = await archiveClientSnapshot(db, clientSnap, job);
  progress.statuses = await deleteStatuses(db, job.clientId);
  progress.residents = await deleteResidents(db, auth, job.clientId);
  progress.evacuationCenters = await deleteCollectionWhere(db, 'centers', job.clientId);
  progress.announcements = await deleteCollectionWhere(db, 'announcements', job.clientId);
  progress.notifications = await deleteCollectionWhere(db, 'notifications', job.clientId);
  progress.clientChangeRequests = await deleteCollectionWhere(db, 'clientChangeRequests', job.clientId);
  progress.contacts = await deleteOptionalDoc(db, 'contacts', job.clientId);
  progress.clientBoundaries = await deleteOptionalDoc(db, 'clientBoundaries', job.clientId);
  progress.lguAdmins = await deleteLguAdmins(db, auth, job.clientId);
  progress.adminInvitations = await deleteCollectionWhere(db, 'adminInvitations', job.clientId);

  await clientRef.delete();
  progress.clientRecord = 1;
  await updateArchiveCleanupProgress(db, job.clientId, progress, clientData);
  return progress;
}

async function archiveClientSnapshot(db: Firestore, clientSnap: DocumentSnapshot, job: ClientDeletionJob): Promise<number> {
  const archiveRef = db.collection('clientArchives').doc(clientSnap.id);
  const existingArchive = await archiveRef.get();

  if (existingArchive.exists && existingArchive.data()?.status === 'archived') {
    return 1;
  }

  const client = { id: clientSnap.id, ...(clientSnap.data() ?? {}) };
  const collections = await buildArchiveCollections(db, clientSnap.id, client);
  const counts = await writeArchiveDocuments(db, archiveRef, collections);
  const request = collections.lguRequests[0]?.data ?? null;

  await archiveRef.set(
    {
      archiveVersion: 1,
      status: 'archived',
      clientId: clientSnap.id,
      clientName: getString(client.name) || getString(client.municipalityName) || clientSnap.id,
      provinceName: getString(client.provinceName) || null,
      municipalityName: getString(client.municipalityName) || null,
      client,
      request,
      counts,
      deletionReason: job.deletionReason ?? null,
      deletionRequestedBy: job.deletionRequestedBy ?? null,
      deletionScheduledAt: job.deletionScheduledAt,
      deletionEffectiveAt: job.deletionEffectiveAt,
      deletion: {
        reason: job.deletionReason ?? null,
        requestedBy: job.deletionRequestedBy ?? null,
        scheduledAt: job.deletionScheduledAt,
        effectiveAt: job.deletionEffectiveAt,
      },
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress ?? {},
        errors: job.errors ?? [],
      },
      archivedBy: 'supabase_client_deletion_scheduler',
      archivedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return 1;
}

async function buildArchiveCollections(
  db: Firestore,
  clientId: string,
  client: Record<string, unknown>
): Promise<Record<ArchiveGroup, ArchivedDocument[]>> {
  const [
    lguRequests,
    lguAdmins,
    adminInvitations,
    residents,
    statuses,
    evacuationCenters,
    announcements,
    contacts,
    notifications,
    clientBoundaries,
    clientChangeRequests,
  ] = await Promise.all([
    readLguRequests(db, clientId, getString(client.requestId)),
    readCollectionWhere(db, 'admin', clientId),
    readCollectionWhere(db, 'adminInvitations', clientId),
    readCollectionWhere(db, 'users', clientId),
    db.collectionGroup('statuses').where('clientId', '==', clientId).get().then(snapshot => snapshot.docs.map(toArchivedDocument)),
    readCollectionWhere(db, 'centers', clientId),
    readCollectionWhere(db, 'announcements', clientId),
    readOptionalDoc(db, 'contacts', clientId),
    readCollectionWhere(db, 'notifications', clientId),
    readOptionalDoc(db, 'clientBoundaries', clientId),
    readCollectionWhere(db, 'clientChangeRequests', clientId),
  ]);

  return {
    lguRequests,
    lguAdmins,
    adminInvitations,
    residents,
    statuses,
    evacuationCenters,
    announcements,
    contacts,
    notifications,
    clientBoundaries,
    clientChangeRequests,
  };
}

async function readCollectionWhere(
  db: Firestore,
  collectionName: string,
  clientId: string
): Promise<ArchivedDocument[]> {
  const snapshot = await db.collection(collectionName).where('clientId', '==', clientId).get();
  return snapshot.docs.map(toArchivedDocument);
}

async function readOptionalDoc(db: Firestore, collectionName: string, documentId: string): Promise<ArchivedDocument[]> {
  const snap = await db.collection(collectionName).doc(documentId).get();
  return snap.exists ? [toArchivedDocument(snap)] : [];
}

async function readLguRequests(db: Firestore, clientId: string, requestId?: string): Promise<ArchivedDocument[]> {
  const docs = new Map<string, ArchivedDocument>();

  if (requestId) {
    const snap = await db.collection('lguRequests').doc(requestId).get();
    if (snap.exists) {
      const archived = toArchivedDocument(snap);
      docs.set(archived.originalPath, archived);
    }
  }

  const snapshot = await db.collection('lguRequests').where('clientId', '==', clientId).get();
  snapshot.docs.forEach(doc => {
    const archived = toArchivedDocument(doc);
    docs.set(archived.originalPath, archived);
  });

  return Array.from(docs.values());
}

async function writeArchiveDocuments(
  db: Firestore,
  archiveRef: DocumentReference,
  collections: Record<ArchiveGroup, ArchivedDocument[]>
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  const queue = { batch: db.batch(), writes: 0 };

  for (const group of ARCHIVE_GROUPS) {
    const docs = collections[group];
    counts[group] = docs.length;

    for (const doc of docs) {
      queue.batch.set(archiveRef.collection(group).doc(doc.id), {
        originalId: doc.originalId,
        originalPath: doc.originalPath,
        data: doc.data,
        archivedAt: FieldValue.serverTimestamp(),
      });
      queue.writes++;

      if (queue.writes >= MAX_BATCH_WRITES) {
        await commitBatch(db, queue);
      }
    }
  }

  await commitBatch(db, queue);
  return counts;
}

async function updateArchiveCleanupProgress(
  db: Firestore,
  archiveId: string,
  progress: CleanupProgress,
  client: Record<string, unknown>
): Promise<void> {
  await db.collection('clientArchives').doc(archiveId).set(
    {
      clientName: getString(client.name) || getString(client.municipalityName) || archiveId,
      cleanupProgress: progress,
      job: {
        status: 'completed',
        progress,
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function deleteStatuses(db: Firestore, clientId: string): Promise<number> {
  const snapshot = await db.collectionGroup('statuses').where('clientId', '==', clientId).get();
  return deleteRefs(db, snapshot.docs.map(doc => doc.ref));
}

async function deleteResidents(db: Firestore, auth: Auth, clientId: string): Promise<number> {
  const snapshot = await db.collection('users').where('clientId', '==', clientId).get();

  for (const doc of snapshot.docs) {
    await deleteAuthUser(auth, doc.id, 'resident');
  }

  return deleteRefs(db, snapshot.docs.map(doc => doc.ref));
}

async function deleteLguAdmins(db: Firestore, auth: Auth, clientId: string): Promise<number> {
  const snapshot = await db.collection('admin').where('clientId', '==', clientId).get();

  for (const doc of snapshot.docs) {
    await deleteAuthUser(auth, doc.id, 'LGU admin');
  }

  return deleteRefs(db, snapshot.docs.map(doc => doc.ref));
}

async function deleteCollectionWhere(db: Firestore, collectionName: string, clientId: string): Promise<number> {
  const snapshot = await db.collection(collectionName).where('clientId', '==', clientId).get();
  return deleteRefs(db, snapshot.docs.map(doc => doc.ref));
}

async function deleteOptionalDoc(db: Firestore, collectionName: string, documentId: string): Promise<number> {
  const ref = db.collection(collectionName).doc(documentId);
  const snap = await ref.get();
  if (!snap.exists) return 0;
  await ref.delete();
  return 1;
}

async function deleteRefs(db: Firestore, refs: DocumentReference[]): Promise<number> {
  const queue = { batch: db.batch(), writes: 0 };

  for (const ref of refs) {
    queue.batch.delete(ref);
    queue.writes++;

    if (queue.writes >= MAX_BATCH_WRITES) {
      await commitBatch(db, queue);
    }
  }

  await commitBatch(db, queue);
  return refs.length;
}

async function commitBatch(
  db: Firestore,
  queue: { batch: WriteBatch; writes: number }
): Promise<void> {
  if (queue.writes === 0) return;
  await queue.batch.commit();
  queue.batch = db.batch();
  queue.writes = 0;
}

async function deleteAuthUser(auth: Auth, uid: string, label: string): Promise<void> {
  try {
    await auth.updateUser(uid, { disabled: true });
  } catch (error) {
    if (!isAuthUserNotFound(error)) {
      console.error(`Failed to disable ${label} auth user ${uid}:`, error);
    }
  }

  try {
    await auth.deleteUser(uid);
  } catch (error) {
    if (!isAuthUserNotFound(error)) {
      console.error(`Failed to delete ${label} auth user ${uid}:`, error);
    }
  }
}

function isAuthUserNotFound(error: unknown): boolean {
  return (
    isRecord(error) &&
    (error.code === 'auth/user-not-found' || String(error.message ?? '').toLowerCase().includes('user not found'))
  );
}

function toArchivedDocument(doc: QueryDocumentSnapshot | DocumentSnapshot): ArchivedDocument {
  return {
    id: archiveDocumentId(doc.ref.path),
    originalId: doc.id,
    originalPath: doc.ref.path,
    data: (doc.data() ?? {}) as Record<string, unknown>,
  };
}

function archiveDocumentId(path: string): string {
  const bytes = new TextEncoder().encode(path);
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function createOperationLog(
  db: Firestore,
  params: {
    action: string;
    actionLabel: string;
    targetType: string;
    actorUid: string;
    actorRole: string;
    message: string;
    after: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const docRef = db.collection('operationLogs').doc();
    await docRef.set({
      id: docRef.id,
      action: params.action,
      actionLabel: params.actionLabel,
      targetType: params.targetType,
      targetId: null,
      targetName: null,
      clientId: null,
      clientName: null,
      actorUid: params.actorUid,
      actorEmail: null,
      actorRole: params.actorRole,
      status: 'success',
      message: params.message,
      before: null,
      after: cleanValue(params.after),
      metadata: {},
      timestamp: Date.now(),
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to create operation log:', error);
  }
}

function cleanValue(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(cleanValue);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, cleanValue(entry)])
    );
  }

  return value;
}

function getString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
