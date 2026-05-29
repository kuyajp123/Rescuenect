import { NAIC_CLIENT_ID, normalizeBarangayValue } from '@/config/locationConfig';
import { db } from '@/db/firestoreConfig';
import { ClientModel } from '@/models/admin/ClientModel';
import type { DynamicClientCutoverAudit, DynamicClientCutoverCollectionAudit } from '@/types/admin';
import { FieldValue } from 'firebase-admin/firestore';

type AuditOptions = {
  dryRun?: boolean;
};

type AuditContext = {
  clientIds: Set<string>;
  weatherKeyToClientId: Map<string, string>;
  naicSeed: ReturnType<typeof ClientModel.getNaicClientSeed>;
};

const emptyCollectionAudit = (): DynamicClientCutoverCollectionAudit => ({
  scanned: 0,
  missingClientId: 0,
  invalidClientId: 0,
  eligibleForNaicMigration: 0,
  updated: 0,
  errors: [],
});

const isMissing = (value: unknown): boolean =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

const normalizeClientId = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const buildNaicMetadata = (data: FirebaseFirestore.DocumentData, context: AuditContext): Record<string, unknown> => {
  const seed = context.naicSeed;
  const update: Record<string, unknown> = {};
  const setIfMissing = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (isMissing(data[key])) update[key] = value;
  };

  setIfMissing('clientId', NAIC_CLIENT_ID);
  setIfMissing('clientName', seed.name);
  setIfMissing('provinceCode', seed.provinceCode);
  setIfMissing('provinceName', seed.provinceName);
  setIfMissing('municipalityCode', seed.municipalityCode);
  setIfMissing('municipalityName', seed.municipalityName);
  setIfMissing('municipalityType', seed.municipalityType);
  setIfMissing('weatherLocationKey', seed.weatherLocationKey);

  const barangayValue = typeof data.barangay === 'string' ? normalizeBarangayValue(data.barangay) : '';
  const barangay = seed.barangays.find(item => item.value === barangayValue);
  if (barangay) {
    if (data.barangay !== barangay.value) update.barangay = barangay.value;
    setIfMissing('barangayCode', barangay.barangayCode);
    setIfMissing('barangayLabel', barangay.barangayLabel);
  }

  return update;
};

export class DynamicClientCutoverMigrationModel {
  private static async queueSet(
    queue: { batch: FirebaseFirestore.WriteBatch; writes: number },
    ref: FirebaseFirestore.DocumentReference,
    data: Record<string, unknown>,
    dryRun: boolean
  ): Promise<void> {
    if (dryRun) return;

    queue.batch.set(ref, data, { merge: true });
    queue.writes++;
    if (queue.writes >= 450) {
      await queue.batch.commit();
      queue.batch = db.batch();
      queue.writes = 0;
    }
  }

  private static async commitQueue(queue: { batch: FirebaseFirestore.WriteBatch; writes: number }): Promise<void> {
    if (queue.writes === 0) return;
    await queue.batch.commit();
    queue.batch = db.batch();
    queue.writes = 0;
  }

  private static async buildContext(includeNaicSeed: boolean): Promise<AuditContext> {
    const snapshot = await db.collection('clients').get();
    const clients = snapshot.docs.map(doc => ClientModel.getClientById(doc.id));
    const resolvedClients = (await Promise.all(clients)).filter(Boolean) as Array<ReturnType<typeof ClientModel.getNaicClientSeed>>;
    const naicSeed = ClientModel.getNaicClientSeed();
    const allClients = includeNaicSeed
      ? resolvedClients.some(client => client.id === NAIC_CLIENT_ID)
        ? resolvedClients
        : [naicSeed, ...resolvedClients]
      : resolvedClients;

    return {
      clientIds: new Set(allClients.map(client => client.id)),
      weatherKeyToClientId: new Map(allClients.map(client => [client.weatherLocationKey, client.id])),
      naicSeed,
    };
  }

  private static async ensureNaicClient(dryRun: boolean): Promise<DynamicClientCutoverCollectionAudit> {
    const result = emptyCollectionAudit();
    result.scanned = 1;
    const seed = ClientModel.getNaicClientSeed();
    const ref = db.collection('clients').doc(NAIC_CLIENT_ID);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() ?? {} : {};
    const update: Record<string, unknown> = {};

    Object.entries(seed).forEach(([key, value]) => {
      if (key === 'status') {
        if (data[key] !== value) update[key] = value;
        return;
      }
      if (key === 'barangays') {
        if (!Array.isArray(data[key]) || data[key].length === 0) update[key] = value;
        return;
      }
      if (isMissing(data[key])) update[key] = value;
    });

    if (!snap.exists) {
      update.createdAt = FieldValue.serverTimestamp();
    }

    if (Object.keys(update).length > 0) {
      result.eligibleForNaicMigration = 1;
      result.updated = 1;
      if (!dryRun) {
        await ref.set({ ...update, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
    }

    return result;
  }

  private static async auditAdmin(
    collectionName: 'admin' | 'adminInvitations',
    context: AuditContext,
    dryRun: boolean
  ): Promise<DynamicClientCutoverCollectionAudit> {
    const result = emptyCollectionAudit();
    const queue = { batch: db.batch(), writes: 0 };
    const snapshot = await db.collection(collectionName).get();

    for (const doc of snapshot.docs) {
      result.scanned++;
      const data = doc.data();
      const role = data.role === 'super_admin' ? 'super_admin' : 'lgu_admin';
      if (role === 'super_admin') continue;

      const clientId = normalizeClientId(data.clientId);
      if (!clientId) {
        result.missingClientId++;
        result.eligibleForNaicMigration++;
        result.updated++;
        await this.queueSet(
          queue,
          doc.ref,
          {
            clientId: NAIC_CLIENT_ID,
            clientName: context.naicSeed.name,
            updatedAt: FieldValue.serverTimestamp(),
          },
          dryRun
        );
        continue;
      }

      if (!context.clientIds.has(clientId)) {
        result.invalidClientId++;
        result.errors.push(`${collectionName}/${doc.id} references missing clientId "${clientId}"`);
      }
    }

    await this.commitQueue(queue);
    return result;
  }

  private static async auditNaicBackfillCollection(
    collectionName: string,
    context: AuditContext,
    dryRun: boolean,
    includeNaicMetadata = false
  ): Promise<DynamicClientCutoverCollectionAudit> {
    const result = emptyCollectionAudit();
    const queue = { batch: db.batch(), writes: 0 };
    const snapshot = await db.collection(collectionName).get();

    for (const doc of snapshot.docs) {
      result.scanned++;
      const data = doc.data();
      const clientId = normalizeClientId(data.clientId);
      if (!clientId) {
        result.missingClientId++;
        result.eligibleForNaicMigration++;
        const update = includeNaicMetadata ? buildNaicMetadata(data, context) : { clientId: NAIC_CLIENT_ID };
        result.updated++;
        await this.queueSet(queue, doc.ref, { ...update, updatedAt: FieldValue.serverTimestamp() }, dryRun);
        continue;
      }

      if (!context.clientIds.has(clientId)) {
        result.invalidClientId++;
        result.errors.push(`${collectionName}/${doc.id} references missing clientId "${clientId}"`);
      }
    }

    await this.commitQueue(queue);
    return result;
  }

  private static async auditStatuses(
    context: AuditContext,
    dryRun: boolean
  ): Promise<DynamicClientCutoverCollectionAudit> {
    const result = emptyCollectionAudit();
    const queue = { batch: db.batch(), writes: 0 };
    const snapshot = await db.collectionGroup('statuses').get();

    for (const doc of snapshot.docs) {
      result.scanned++;
      const data = doc.data();
      const clientId = normalizeClientId(data.clientId);
      if (!clientId) {
        result.missingClientId++;
        result.eligibleForNaicMigration++;
        result.updated++;
        await this.queueSet(
          queue,
          doc.ref,
          { ...buildNaicMetadata(data, context), updatedAt: FieldValue.serverTimestamp() },
          dryRun
        );
        continue;
      }

      if (!context.clientIds.has(clientId)) {
        result.invalidClientId++;
        result.errors.push(`${doc.ref.path} references missing clientId "${clientId}"`);
      }
    }

    await this.commitQueue(queue);
    return result;
  }

  private static async auditContacts(
    context: AuditContext,
    dryRun: boolean
  ): Promise<DynamicClientCutoverCollectionAudit> {
    const result = emptyCollectionAudit();
    const queue = { batch: db.batch(), writes: 0 };
    const snapshot = await db.collection('contacts').get();

    for (const doc of snapshot.docs) {
      result.scanned++;
      const data = doc.data();
      const clientId = normalizeClientId(data.clientId);
      if (doc.id === 'main') {
        result.missingClientId++;
        result.eligibleForNaicMigration++;
        result.updated++;
        if (!dryRun) {
          await db.collection('contacts').doc(NAIC_CLIENT_ID).set(
            {
              ...data,
              clientId: NAIC_CLIENT_ID,
              migratedFrom: 'main',
              migratedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
        continue;
      }

      if (!clientId && context.clientIds.has(doc.id)) {
        result.missingClientId++;
        result.updated++;
        await this.queueSet(queue, doc.ref, { clientId: doc.id, updatedAt: FieldValue.serverTimestamp() }, dryRun);
        continue;
      }

      if (!clientId) {
        result.missingClientId++;
        result.errors.push(`contacts/${doc.id} has no clientId and its document id is not a known client`);
        continue;
      }

      if (!context.clientIds.has(clientId)) {
        result.invalidClientId++;
        result.errors.push(`contacts/${doc.id} references missing clientId "${clientId}"`);
      }
    }

    await this.commitQueue(queue);
    return result;
  }

  private static inferNotificationClientId(
    data: FirebaseFirestore.DocumentData,
    context: AuditContext
  ): string | null {
    const directClientId = normalizeClientId(data.clientId) || normalizeClientId(data.data?.clientId);
    if (directClientId) return directClientId;

    const location = typeof data.location === 'string' ? data.location.trim() : '';
    if (location && context.weatherKeyToClientId.has(location)) {
      return context.weatherKeyToClientId.get(location) ?? null;
    }

    return null;
  }

  private static async auditNotifications(
    context: AuditContext,
    dryRun: boolean
  ): Promise<DynamicClientCutoverCollectionAudit> {
    const result = emptyCollectionAudit();
    const queue = { batch: db.batch(), writes: 0 };
    const snapshot = await db.collection('notifications').get();

    for (const doc of snapshot.docs) {
      result.scanned++;
      const data = doc.data();
      const type = typeof data.type === 'string' ? data.type : '';
      const clientScoped = ['weather', 'announcement', 'emergency', 'evacuation'].includes(type);
      const inferredClientId = this.inferNotificationClientId(data, context);

      if (!clientScoped && !inferredClientId) {
        continue;
      }

      if (!inferredClientId) {
        result.missingClientId++;
        result.errors.push(`notifications/${doc.id} has no inferable clientId`);
        continue;
      }

      if (!context.clientIds.has(inferredClientId)) {
        result.invalidClientId++;
        result.errors.push(`notifications/${doc.id} references missing clientId "${inferredClientId}"`);
        continue;
      }

      if (isMissing(data.clientId)) {
        result.missingClientId++;
        result.updated++;
        await this.queueSet(
          queue,
          doc.ref,
          {
            clientId: inferredClientId,
            updatedAt: FieldValue.serverTimestamp(),
          },
          dryRun
        );
      }
    }

    await this.commitQueue(queue);
    return result;
  }

  private static async auditStrictClientCollection(
    collectionName: string,
    context: AuditContext,
    dryRun: boolean
  ): Promise<DynamicClientCutoverCollectionAudit> {
    const result = emptyCollectionAudit();
    const snapshot = await db.collection(collectionName).get();

    for (const doc of snapshot.docs) {
      result.scanned++;
      const clientId = normalizeClientId(doc.data().clientId);
      if (!clientId) {
        result.missingClientId++;
        result.errors.push(`${collectionName}/${doc.id} is missing clientId`);
        continue;
      }

      if (!context.clientIds.has(clientId)) {
        result.invalidClientId++;
        result.errors.push(`${collectionName}/${doc.id} references missing clientId "${clientId}"`);
      }
    }

    return result;
  }

  static async audit(options: AuditOptions = {}): Promise<DynamicClientCutoverAudit> {
    const dryRun = options.dryRun !== false;
    const context = await this.buildContext(false);
    const collections: Record<string, DynamicClientCutoverCollectionAudit> = {
      clients: await this.ensureNaicClient(true),
    };

    const contextWithNaic = await this.buildContext(true);
    collections.admin = await this.auditAdmin('admin', contextWithNaic, true);
    collections.adminInvitations = await this.auditAdmin('adminInvitations', contextWithNaic, true);
    collections.users = await this.auditNaicBackfillCollection('users', contextWithNaic, true, true);
    collections.centers = await this.auditNaicBackfillCollection('centers', contextWithNaic, true);
    collections.announcements = await this.auditNaicBackfillCollection('announcements', contextWithNaic, true);
    collections.statuses = await this.auditStatuses(contextWithNaic, true);
    collections.contacts = await this.auditContacts(contextWithNaic, true);
    collections.notifications = await this.auditNotifications(contextWithNaic, true);
    collections.clientChangeRequests = await this.auditStrictClientCollection('clientChangeRequests', contextWithNaic, true);

    return this.summarize(dryRun, collections);
  }

  static async run(options: AuditOptions = {}): Promise<DynamicClientCutoverAudit> {
    const dryRun = Boolean(options.dryRun);
    const collections: Record<string, DynamicClientCutoverCollectionAudit> = {
      clients: await this.ensureNaicClient(dryRun),
    };

    const context = await this.buildContext(true);
    collections.admin = await this.auditAdmin('admin', context, dryRun);
    collections.adminInvitations = await this.auditAdmin('adminInvitations', context, dryRun);
    collections.users = await this.auditNaicBackfillCollection('users', context, dryRun, true);
    collections.centers = await this.auditNaicBackfillCollection('centers', context, dryRun);
    collections.announcements = await this.auditNaicBackfillCollection('announcements', context, dryRun);
    collections.statuses = await this.auditStatuses(context, dryRun);
    collections.contacts = await this.auditContacts(context, dryRun);
    collections.notifications = await this.auditNotifications(context, dryRun);
    collections.clientChangeRequests = await this.auditStrictClientCollection('clientChangeRequests', context, dryRun);

    return this.summarize(dryRun, collections);
  }

  private static summarize(
    dryRun: boolean,
    collections: Record<string, DynamicClientCutoverCollectionAudit>
  ): DynamicClientCutoverAudit {
    const values = Object.values(collections);
    const totalScanned = values.reduce((sum, item) => sum + item.scanned, 0);
    const totalMissingClientId = values.reduce((sum, item) => sum + item.missingClientId, 0);
    const totalInvalidClientId = values.reduce((sum, item) => sum + item.invalidClientId, 0);
    const totalEligibleForNaicMigration = values.reduce((sum, item) => sum + item.eligibleForNaicMigration, 0);
    const totalUpdated = values.reduce((sum, item) => sum + item.updated, 0);
    const totalErrors = values.reduce((sum, item) => sum + item.errors.length, 0);

    return {
      dryRun,
      collections,
      totalScanned,
      totalMissingClientId,
      totalInvalidClientId,
      totalEligibleForNaicMigration,
      totalUpdated,
      canCutover: totalInvalidClientId === 0 && totalErrors === 0 && (!dryRun ? totalUpdated === 0 : totalUpdated === 0),
    };
  }
}
