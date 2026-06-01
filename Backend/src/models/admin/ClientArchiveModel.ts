import { db } from '@/db/firestoreConfig';
import type {
  ArchivedClientDocument,
  ClientArchive,
  ClientArchiveSummary,
  ClientDeletionJob,
  ClientLgu,
} from '@/types/admin';
import { FieldValue } from 'firebase-admin/firestore';

const ARCHIVE_COLLECTION = 'clientArchives';
const MAX_BATCH_WRITES = 450;

const ARCHIVE_GROUPS = [
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
] as const;

type ArchiveGroup = (typeof ARCHIVE_GROUPS)[number];
type ArchiveCollections = Record<ArchiveGroup, ArchivedClientDocument[]>;

const archiveDocumentId = (path: string): string =>
  Buffer.from(path).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const toArchivedDocument = (doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) => ({
  id: archiveDocumentId(doc.ref.path),
  originalId: doc.id,
  originalPath: doc.ref.path,
  data: doc.data() ?? {},
});

const emptyCollections = (): ArchiveCollections =>
  ARCHIVE_GROUPS.reduce((acc, group) => {
    acc[group] = [];
    return acc;
  }, {} as ArchiveCollections);

const serializeSummary = (id: string, data: FirebaseFirestore.DocumentData): ClientArchiveSummary => ({
  id,
  clientId: data.clientId || id,
  clientName: data.clientName || data.client?.name || id,
  provinceName: data.provinceName ?? data.client?.provinceName ?? null,
  municipalityName: data.municipalityName ?? data.client?.municipalityName ?? null,
  status: 'archived',
  counts: data.counts ?? {},
  deletionReason: data.deletionReason ?? data.deletion?.reason ?? null,
  deletionRequestedBy: data.deletionRequestedBy ?? data.deletion?.requestedBy ?? null,
  deletionScheduledAt: data.deletionScheduledAt ?? data.deletion?.scheduledAt,
  deletionEffectiveAt: data.deletionEffectiveAt ?? data.deletion?.effectiveAt,
  archivedAt: data.archivedAt,
  permanentlyDeletedAt: data.permanentlyDeletedAt,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const serializeArchive = (
  id: string,
  data: FirebaseFirestore.DocumentData,
  collections: Record<string, ArchivedClientDocument[]>
): ClientArchive => ({
  ...serializeSummary(id, data),
  client: data.client ?? {},
  request: data.request ?? null,
  deletion: data.deletion ?? {},
  job: data.job ?? {},
  collections,
});

export class ClientArchiveModel {
  private static collectionRef() {
    return db.collection(ARCHIVE_COLLECTION);
  }

  private static async readCollectionWhere(collectionName: string, clientId: string): Promise<ArchivedClientDocument[]> {
    const snapshot = await db.collection(collectionName).where('clientId', '==', clientId).get();
    return snapshot.docs.map(toArchivedDocument);
  }

  private static async readOptionalDoc(collectionName: string, documentId: string): Promise<ArchivedClientDocument[]> {
    const snap = await db.collection(collectionName).doc(documentId).get();
    return snap.exists ? [toArchivedDocument(snap)] : [];
  }

  private static async readLguRequests(client: ClientLgu): Promise<ArchivedClientDocument[]> {
    const docs = new Map<string, ArchivedClientDocument>();

    if (client.requestId) {
      const snap = await db.collection('lguRequests').doc(client.requestId).get();
      if (snap.exists) {
        const archived = toArchivedDocument(snap);
        docs.set(archived.originalPath, archived);
      }
    }

    const snapshot = await db.collection('lguRequests').where('clientId', '==', client.id).get();
    snapshot.docs.forEach(doc => {
      const archived = toArchivedDocument(doc);
      docs.set(archived.originalPath, archived);
    });

    return Array.from(docs.values());
  }

  private static async buildCollections(client: ClientLgu): Promise<ArchiveCollections> {
    const collections = emptyCollections();
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
      this.readLguRequests(client),
      this.readCollectionWhere('admin', client.id),
      this.readCollectionWhere('adminInvitations', client.id),
      this.readCollectionWhere('users', client.id),
      db.collectionGroup('statuses').where('clientId', '==', client.id).get().then(snapshot => snapshot.docs.map(toArchivedDocument)),
      this.readCollectionWhere('centers', client.id),
      this.readCollectionWhere('announcements', client.id),
      this.readOptionalDoc('contacts', client.id),
      this.readCollectionWhere('notifications', client.id),
      this.readOptionalDoc('clientBoundaries', client.id),
      this.readCollectionWhere('clientChangeRequests', client.id),
    ]);

    collections.lguRequests = lguRequests;
    collections.lguAdmins = lguAdmins;
    collections.adminInvitations = adminInvitations;
    collections.residents = residents;
    collections.statuses = statuses;
    collections.evacuationCenters = evacuationCenters;
    collections.announcements = announcements;
    collections.contacts = contacts;
    collections.notifications = notifications;
    collections.clientBoundaries = clientBoundaries;
    collections.clientChangeRequests = clientChangeRequests;

    return collections;
  }

  private static async commitBatch(queue: { batch: FirebaseFirestore.WriteBatch; writes: number }): Promise<void> {
    if (queue.writes === 0) return;
    await queue.batch.commit();
    queue.batch = db.batch();
    queue.writes = 0;
  }

  private static async writeArchiveDocuments(
    archiveId: string,
    collections: ArchiveCollections
  ): Promise<Record<string, number>> {
    const archiveRef = this.collectionRef().doc(archiveId);
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
          await this.commitBatch(queue);
        }
      }
    }

    await this.commitBatch(queue);
    return counts;
  }

  static async archiveClientSnapshot(params: {
    client: ClientLgu;
    job: ClientDeletionJob;
    archivedBy: string;
  }): Promise<ClientArchiveSummary> {
    const collections = await this.buildCollections(params.client);
    const request = collections.lguRequests[0]?.data ?? null;
    const counts = await this.writeArchiveDocuments(params.client.id, collections);
    const archiveRef = this.collectionRef().doc(params.client.id);

    await archiveRef.set(
      {
        archiveVersion: 1,
        status: 'archived',
        clientId: params.client.id,
        clientName: params.client.name,
        provinceName: params.client.provinceName,
        municipalityName: params.client.municipalityName,
        client: params.client,
        request,
        counts,
        deletionReason: params.job.deletionReason ?? null,
        deletionRequestedBy: params.job.deletionRequestedBy ?? null,
        deletionScheduledAt: params.job.deletionScheduledAt,
        deletionEffectiveAt: params.job.deletionEffectiveAt,
        deletion: {
          reason: params.job.deletionReason ?? null,
          requestedBy: params.job.deletionRequestedBy ?? null,
          scheduledAt: params.job.deletionScheduledAt,
          effectiveAt: params.job.deletionEffectiveAt,
        },
        job: {
          id: params.job.id,
          status: params.job.status,
          progress: params.job.progress ?? {},
          errors: params.job.errors ?? [],
        },
        archivedBy: params.archivedBy,
        archivedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const archiveSnap = await archiveRef.get();
    return serializeSummary(archiveSnap.id, archiveSnap.data() ?? {});
  }

  static async listArchives(): Promise<ClientArchiveSummary[]> {
    const snapshot = await this.collectionRef().orderBy('archivedAt', 'desc').get();
    return snapshot.docs.map(doc => serializeSummary(doc.id, doc.data()));
  }

  static async getArchive(archiveId: string): Promise<ClientArchive | null> {
    const archiveSnap = await this.collectionRef().doc(archiveId).get();
    if (!archiveSnap.exists) return null;

    const collections: Record<string, ArchivedClientDocument[]> = {};
    await Promise.all(
      ARCHIVE_GROUPS.map(async group => {
        const snapshot = await archiveSnap.ref.collection(group).get();
        collections[group] = snapshot.docs.map(doc => ({
          id: doc.id,
          originalId: doc.data().originalId || doc.id,
          originalPath: doc.data().originalPath || '',
          data: doc.data().data ?? {},
        }));
      })
    );

    return serializeArchive(archiveSnap.id, archiveSnap.data() ?? {}, collections);
  }

  static async updateCleanupProgress(archiveId: string, progress: Record<string, number>): Promise<void> {
    await this.collectionRef().doc(archiveId).set(
      {
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

  static async deleteArchive(archiveId: string): Promise<ClientArchiveSummary> {
    const archiveSnap = await this.collectionRef().doc(archiveId).get();
    if (!archiveSnap.exists) throw new Error('Client archive not found');

    const summary = serializeSummary(archiveSnap.id, archiveSnap.data() ?? {});
    const queue = { batch: db.batch(), writes: 0 };

    for (const group of ARCHIVE_GROUPS) {
      const snapshot = await archiveSnap.ref.collection(group).get();
      for (const doc of snapshot.docs) {
        queue.batch.delete(doc.ref);
        queue.writes++;
        if (queue.writes >= MAX_BATCH_WRITES) {
          await this.commitBatch(queue);
        }
      }
    }

    queue.batch.delete(archiveSnap.ref);
    queue.writes++;
    await this.commitBatch(queue);

    return summary;
  }
}
