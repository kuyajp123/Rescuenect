import { admin, db } from '@/db/firestoreConfig';
import { AdminAuthModel } from '@/models/admin/AdminAuthModel';
import { ClientModel } from '@/models/admin/ClientModel';
import type { ClientDeletionJob, ClientDeletionPreview, ClientLgu } from '@/types/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

type CleanupProgress = Record<string, number>;

const DELETION_GRACE_DAYS = 30;
const MAX_BATCH_WRITES = 450;

const toMillis = (value: unknown): number => {
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
  if (typeof seconds === 'number') {
    return seconds * 1000;
  }
  return 0;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const emptyPreview = (): ClientDeletionPreview => ({
  canDelete: false,
  canScheduleDeletion: false,
  warnings: [],
  dependencies: {
    residents: 0,
    lguAdmins: 0,
    adminInvitations: 0,
    statuses: 0,
    evacuationCenters: 0,
    announcements: 0,
    contacts: 0,
    notifications: 0,
    clientBoundaries: 0,
    clientChangeRequests: 0,
  },
});

const serializeJob = (id: string, data: FirebaseFirestore.DocumentData): ClientDeletionJob => ({
  id,
  clientId: data.clientId || id,
  clientName: data.clientName || data.clientId || id,
  status: ['scheduled', 'running', 'completed', 'failed', 'cancelled'].includes(data.status)
    ? data.status
    : 'scheduled',
  deletionEffectiveAt: data.deletionEffectiveAt,
  deletionScheduledAt: data.deletionScheduledAt,
  deletionRequestedBy: data.deletionRequestedBy ?? null,
  deletionReason: data.deletionReason ?? null,
  progress: data.progress ?? {},
  errors: Array.isArray(data.errors) ? data.errors : [],
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export class ClientDeletionModel {
  private static jobsRef() {
    return db.collection('clientDeletionJobs');
  }

  private static async countCollection(collectionName: string, clientId: string): Promise<number> {
    const snapshot = await db.collection(collectionName).where('clientId', '==', clientId).get();
    return snapshot.size;
  }

  private static async countOptionalDoc(collectionName: string, documentId: string): Promise<number> {
    const snap = await db.collection(collectionName).doc(documentId).get();
    return snap.exists ? 1 : 0;
  }

  static async getDeletionPreview(clientId: string): Promise<ClientDeletionPreview> {
    const client = await ClientModel.getClientById(clientId);
    if (!client) throw new Error('Client not found');

    const preview = emptyPreview();
    const [
      residents,
      lguAdmins,
      adminInvitations,
      statuses,
      evacuationCenters,
      announcements,
      contacts,
      notifications,
      clientBoundaries,
      clientChangeRequests,
    ] = await Promise.all([
      this.countCollection('users', client.id),
      this.countCollection('admin', client.id),
      this.countCollection('adminInvitations', client.id),
      db.collectionGroup('statuses').where('clientId', '==', client.id).get().then(snapshot => snapshot.size),
      this.countCollection('centers', client.id),
      this.countCollection('announcements', client.id),
      this.countOptionalDoc('contacts', client.id),
      this.countCollection('notifications', client.id),
      this.countOptionalDoc('clientBoundaries', client.id),
      this.countCollection('clientChangeRequests', client.id),
    ]);

    preview.dependencies = {
      residents,
      lguAdmins,
      adminInvitations,
      statuses,
      evacuationCenters,
      announcements,
      contacts,
      notifications,
      clientBoundaries,
      clientChangeRequests,
    };

    preview.canDelete = false;
    preview.canScheduleDeletion = client.status === 'draft' || client.status === 'inactive';

    if (client.status === 'active') {
      preview.warnings.push('Deactivate the client before scheduling deletion.');
    }
    if (client.status === 'deletion_scheduled') {
      preview.warnings.push('Deletion is already scheduled for this client.');
    }
    if (client.status === 'deleting') {
      preview.warnings.push('Deletion cleanup is already running for this client.');
    }
    if (client.status === 'deleted') {
      preview.warnings.push('This client has already been deleted.');
    }
    if (preview.canScheduleDeletion) {
      preview.warnings.push('Deletion is scheduled with a 30-day grace period by default.');
    }

    return preview;
  }

  static async scheduleDeletion(params: {
    clientId: string;
    requestedBy: string;
    reason?: string | null;
    graceDays?: number;
  }): Promise<{ client: ClientLgu; job: ClientDeletionJob; preview: ClientDeletionPreview }> {
    const client = await ClientModel.getClientById(params.clientId);
    if (!client) throw new Error('Client not found');
    if (client.status !== 'draft' && client.status !== 'inactive') {
      throw new Error('Only draft or inactive clients can be scheduled for deletion');
    }

    const preview = await this.getDeletionPreview(client.id);
    if (!preview.canScheduleDeletion) {
      throw new Error(preview.warnings[0] || 'Client cannot be scheduled for deletion');
    }

    const now = new Date();
    const graceDays =
      typeof params.graceDays === 'number' && Number.isFinite(params.graceDays) && params.graceDays >= 0
        ? Math.floor(params.graceDays)
        : DELETION_GRACE_DAYS;
    const effectiveAt = addDays(now, graceDays);
    const effectiveTimestamp = Timestamp.fromDate(effectiveAt);
    const reason = typeof params.reason === 'string' && params.reason.trim() ? params.reason.trim() : null;

    await db.collection('clients').doc(client.id).set(
      {
        status: 'deletion_scheduled',
        deletionScheduledAt: FieldValue.serverTimestamp(),
        deletionEffectiveAt: effectiveTimestamp,
        deletionRequestedBy: params.requestedBy,
        deletionReason: reason,
        deletionCancelledAt: null,
        deletionStatus: 'scheduled',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await this.jobsRef().doc(client.id).set(
      {
        clientId: client.id,
        clientName: client.name,
        status: 'scheduled',
        deletionEffectiveAt: effectiveTimestamp,
        deletionScheduledAt: FieldValue.serverTimestamp(),
        deletionRequestedBy: params.requestedBy,
        deletionReason: reason,
        progress: {},
        errors: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const [updatedClient, jobSnap] = await Promise.all([
      ClientModel.getClientById(client.id),
      this.jobsRef().doc(client.id).get(),
    ]);
    if (!updatedClient || !jobSnap.exists) throw new Error('Failed to schedule client deletion');

    return {
      client: updatedClient,
      job: serializeJob(jobSnap.id, jobSnap.data() ?? {}),
      preview,
    };
  }

  static async cancelDeletion(params: {
    clientId: string;
    cancelledBy: string;
  }): Promise<{ client: ClientLgu; job: ClientDeletionJob | null }> {
    const client = await ClientModel.getClientById(params.clientId);
    if (!client) throw new Error('Client not found');
    if (client.status !== 'deletion_scheduled') {
      throw new Error('Only scheduled deletions can be cancelled');
    }
    if (toMillis(client.deletionEffectiveAt) <= Date.now()) {
      throw new Error('Deletion can no longer be cancelled because the effective date has passed');
    }

    await db.collection('clients').doc(client.id).set(
      {
        status: 'inactive',
        deletionScheduledAt: null,
        deletionEffectiveAt: null,
        deletionRequestedBy: null,
        deletionReason: null,
        deletionCancelledAt: FieldValue.serverTimestamp(),
        deletionStatus: 'cancelled',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await this.jobsRef().doc(client.id).set(
      {
        status: 'cancelled',
        cancelledBy: params.cancelledBy,
        cancelledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const [updatedClient, jobSnap] = await Promise.all([
      ClientModel.getClientById(client.id),
      this.jobsRef().doc(client.id).get(),
    ]);
    if (!updatedClient) throw new Error('Client not found after cancellation');

    return {
      client: updatedClient,
      job: jobSnap.exists ? serializeJob(jobSnap.id, jobSnap.data() ?? {}) : null,
    };
  }

  private static async commitBatch(queue: { batch: FirebaseFirestore.WriteBatch; writes: number }): Promise<void> {
    if (queue.writes === 0) return;
    await queue.batch.commit();
    queue.batch = db.batch();
    queue.writes = 0;
  }

  private static async deleteRefs(refs: FirebaseFirestore.DocumentReference[]): Promise<number> {
    const queue = { batch: db.batch(), writes: 0 };
    for (const ref of refs) {
      queue.batch.delete(ref);
      queue.writes++;
      if (queue.writes >= MAX_BATCH_WRITES) {
        await this.commitBatch(queue);
      }
    }
    await this.commitBatch(queue);
    return refs.length;
  }

  private static async deleteCollectionWhere(collectionName: string, clientId: string): Promise<number> {
    const snapshot = await db.collection(collectionName).where('clientId', '==', clientId).get();
    return this.deleteRefs(snapshot.docs.map(doc => doc.ref));
  }

  private static async deleteStatuses(clientId: string): Promise<number> {
    const snapshot = await db.collectionGroup('statuses').where('clientId', '==', clientId).get();
    return this.deleteRefs(snapshot.docs.map(doc => doc.ref));
  }

  private static async deleteOptionalDoc(collectionName: string, documentId: string): Promise<number> {
    const ref = db.collection(collectionName).doc(documentId);
    const snap = await ref.get();
    if (!snap.exists) return 0;
    await ref.delete();
    return 1;
  }

  private static async deleteResidents(clientId: string): Promise<number> {
    const snapshot = await db.collection('users').where('clientId', '==', clientId).get();
    const queue = { batch: db.batch(), writes: 0 };
    let count = 0;

    for (const doc of snapshot.docs) {
      const uid = doc.id;
      try {
        await admin.auth().updateUser(uid, { disabled: true });
      } catch (error: any) {
        if (error?.code !== 'auth/user-not-found') {
          console.error(`Failed to disable resident auth user ${uid}:`, error);
        }
      }

      try {
        await admin.auth().deleteUser(uid);
      } catch (error: any) {
        if (error?.code !== 'auth/user-not-found') {
          console.error(`Failed to delete resident auth user ${uid}:`, error);
        }
      }

      queue.batch.delete(doc.ref);
      queue.writes++;
      count++;
      if (queue.writes >= MAX_BATCH_WRITES) {
        await this.commitBatch(queue);
      }
    }

    await this.commitBatch(queue);
    return count;
  }

  private static async cleanupClient(job: ClientDeletionJob): Promise<CleanupProgress> {
    const client = await ClientModel.getClientById(job.clientId);
    if (!client) throw new Error('Client not found');

    await db.collection('clients').doc(client.id).set(
      {
        status: 'deleting',
        deletionStatus: 'running',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const progress: CleanupProgress = {};
    progress.statuses = await this.deleteStatuses(client.id);
    progress.residents = await this.deleteResidents(client.id);
    progress.evacuationCenters = await this.deleteCollectionWhere('centers', client.id);
    progress.announcements = await this.deleteCollectionWhere('announcements', client.id);
    progress.notifications = await this.deleteCollectionWhere('notifications', client.id);
    progress.clientChangeRequests = await this.deleteCollectionWhere('clientChangeRequests', client.id);
    progress.contacts = await this.deleteOptionalDoc('contacts', client.id);
    progress.clientBoundaries = await this.deleteOptionalDoc('clientBoundaries', client.id);
    progress.lguAdmins = await AdminAuthModel.deactivateAdminsForClient(client.id, 'scheduled_client_deletion');
    progress.adminInvitations = await this.deleteCollectionWhere('adminInvitations', client.id);

    await db.collection('clients').doc(client.id).set(
      {
        status: 'deleted',
        deletionStatus: 'completed',
        deletedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return progress;
  }

  static async processDueDeletionJobs(): Promise<{
    processed: number;
    completed: number;
    failed: number;
    jobs: ClientDeletionJob[];
  }> {
    const snapshot = await this.jobsRef().where('status', 'in', ['scheduled', 'running', 'failed']).get();
    const dueJobs = snapshot.docs
      .map(doc => serializeJob(doc.id, doc.data()))
      .filter(job => toMillis(job.deletionEffectiveAt) <= Date.now());

    const results: ClientDeletionJob[] = [];
    let completed = 0;
    let failed = 0;

    for (const job of dueJobs) {
      try {
        await this.jobsRef().doc(job.id).set(
          {
            status: 'running',
            startedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        const progress = await this.cleanupClient(job);
        await this.jobsRef().doc(job.id).set(
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
        await this.jobsRef().doc(job.id).set(
          {
            status: 'failed',
            errors: FieldValue.arrayUnion(error instanceof Error ? error.message : 'Unknown deletion cleanup error'),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      const updated = await this.jobsRef().doc(job.id).get();
      if (updated.exists) {
        results.push(serializeJob(updated.id, updated.data() ?? {}));
      }
    }

    return {
      processed: dueJobs.length,
      completed,
      failed,
      jobs: results,
    };
  }
}
