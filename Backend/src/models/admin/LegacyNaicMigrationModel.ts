import {
  LEGACY_NAIC_CLIENT_IDS,
  NAIC_CLIENT_ID,
  NAIC_LOCATION_CLIENT,
  canonicalizeClientId,
  normalizeBarangayValue,
} from '@/config/locationConfig';
import { db } from '@/db/firestoreConfig';
import { AdminAuthModel } from '@/models/admin/AdminAuthModel';
import { ClientModel } from '@/models/admin/ClientModel';
import { FieldValue } from 'firebase-admin/firestore';

type MigrationResult = {
  scanned: number;
  updated: number;
};

type MigrationSummary = Record<
  'clients' | 'admin' | 'users' | 'centers' | 'announcements' | 'statuses' | 'contacts',
  MigrationResult
> & {
  dryRun: boolean;
  totalUpdated: number;
};

const PERMISSIONS_VERSION = 1;

const buildPermissions = (role: 'super_admin' | 'lgu_admin'): string[] =>
  role === 'super_admin'
    ? ['super:manage_clients', 'super:manage_requests', 'super:view_system_status', 'lgu:manage_operations']
    : ['lgu:manage_operations'];

const isMissing = (value: unknown): boolean => value === undefined || value === null || value === '';

const getNaicMetadata = (data: FirebaseFirestore.DocumentData = {}) => {
  const canonicalClientId = canonicalizeClientId(data.clientId, data.municipalityCode);

  if (!isMissing(data.clientId) && canonicalClientId !== NAIC_CLIENT_ID) {
    return {};
  }

  const seed = ClientModel.getNaicMigrationSeed();
  const update: Record<string, unknown> = {};
  const setIfMissing = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (isMissing(data[key])) update[key] = value;
  };

  if (data.clientId !== NAIC_CLIENT_ID) update.clientId = NAIC_CLIENT_ID;
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

const getNaicClientIdUpdate = (data: FirebaseFirestore.DocumentData = {}): Record<string, unknown> => {
  const canonicalClientId = canonicalizeClientId(data.clientId, data.municipalityCode);
  return canonicalClientId === NAIC_CLIENT_ID && data.clientId !== NAIC_CLIENT_ID
    ? { clientId: NAIC_CLIENT_ID }
    : {};
};

const hasContactsData = (data: FirebaseFirestore.DocumentData | undefined): boolean => {
  const categories = Array.isArray(data?.categories) ? data.categories : [];
  const contacts = Array.isArray(data?.contacts) ? data.contacts : [];
  return categories.length > 0 || contacts.length > 0;
};

export class LegacyNaicMigrationModel {
  private static async queueSet(
    queue: {
      batch: FirebaseFirestore.WriteBatch;
      writes: number;
    },
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

  private static async ensureNaicClient(dryRun: boolean): Promise<MigrationResult> {
    const result = { scanned: 1, updated: 0 };
    const seed = ClientModel.getNaicMigrationSeed();
    const ref = db.collection('clients').doc(NAIC_CLIENT_ID);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() ?? {} : {};
    const update: Record<string, unknown> = {};
    const setIfMissingOrInvalid = (key: string, value: unknown) => {
      if (key === 'status') {
        if (data[key] !== value) update[key] = value;
        return;
      }

      if (key === 'barangays') {
        if (!Array.isArray(data[key]) || data[key].length === 0) update[key] = value;
        return;
      }

      if (isMissing(data[key])) update[key] = value;
    };

    Object.entries(seed).forEach(([key, value]) => setIfMissingOrInvalid(key, value));

    if (!snap.exists) {
      update.createdAt = FieldValue.serverTimestamp();
    }

    if (Object.keys(update).length > 0) {
      result.updated++;
      if (!dryRun) {
        await ref.set({ ...update, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
    }

    return result;
  }

  private static async backfillAdmins(dryRun: boolean): Promise<MigrationResult> {
    const result = { scanned: 0, updated: 0 };
    const queue = { batch: db.batch(), writes: 0 };
    const superAdminEmails = new Set(AdminAuthModel.getSuperAdminEmails());
    const snapshot = await db.collection('admin').get();

    for (const doc of snapshot.docs) {
      result.scanned++;
      const data = doc.data();
      const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
      const role = email && superAdminEmails.has(email) ? 'super_admin' : 'lgu_admin';
      const update: Record<string, unknown> = {};

      if (data.role !== role) update.role = role;
      if (isMissing(data.status)) update.status = 'active';
      if (data.permissionsVersion !== PERMISSIONS_VERSION) update.permissionsVersion = PERMISSIONS_VERSION;
      if (!Array.isArray(data.permissions)) update.permissions = buildPermissions(role);

      if (role === 'super_admin') {
        if (data.clientId !== null) update.clientId = null;
        if (data.clientName !== null) update.clientName = null;
      } else {
        const canonicalClientId = canonicalizeClientId(data.clientId, data.municipalityCode);
        if (isMissing(data.clientId)) {
          update.clientId = NAIC_CLIENT_ID;
        } else if (canonicalClientId && canonicalClientId !== data.clientId) {
          update.clientId = canonicalClientId;
        }
        if (isMissing(data.clientName)) update.clientName = NAIC_LOCATION_CLIENT.name;
      }

      if (Object.keys(update).length > 0) {
        result.updated++;
        await this.queueSet(queue, doc.ref, { ...update, updatedAt: FieldValue.serverTimestamp() }, dryRun);
      }
    }

    await this.commitQueue(queue);
    return result;
  }

  private static async backfillCollection(
    collectionName: string,
    dryRun: boolean,
    options: { includeNaicMetadata?: boolean } = {}
  ): Promise<MigrationResult> {
    const result = { scanned: 0, updated: 0 };
    const queue = { batch: db.batch(), writes: 0 };
    const snapshot = await db.collection(collectionName).get();

    for (const doc of snapshot.docs) {
      result.scanned++;
      const data = doc.data();
      const update = options.includeNaicMetadata
        ? getNaicMetadata(data)
        : isMissing(data.clientId)
          ? { clientId: NAIC_CLIENT_ID }
          : getNaicClientIdUpdate(data);

      if (Object.keys(update).length > 0) {
        result.updated++;
        await this.queueSet(queue, doc.ref, { ...update, updatedAt: FieldValue.serverTimestamp() }, dryRun);
      }
    }

    await this.commitQueue(queue);
    return result;
  }

  private static async backfillStatuses(dryRun: boolean): Promise<MigrationResult> {
    const result = { scanned: 0, updated: 0 };
    const queue = { batch: db.batch(), writes: 0 };
    const snapshot = await db.collectionGroup('statuses').get();

    for (const doc of snapshot.docs) {
      result.scanned++;
      const update = getNaicMetadata(doc.data());
      if (Object.keys(update).length === 0) continue;

      result.updated++;
      await this.queueSet(queue, doc.ref, { ...update, updatedAt: FieldValue.serverTimestamp() }, dryRun);
    }

    await this.commitQueue(queue);
    return result;
  }

  private static async backfillContacts(dryRun: boolean): Promise<MigrationResult> {
    const result = { scanned: 0, updated: 0 };
    const targetRef = db.collection('contacts').doc(NAIC_CLIENT_ID);
    const legacyRef = db.collection('contacts').doc('main');
    const legacyNaicRefs = LEGACY_NAIC_CLIENT_IDS.map(id => db.collection('contacts').doc(id));
    const [targetSnap, legacySnap, ...legacyNaicSnaps] = await Promise.all([
      targetRef.get(),
      legacyRef.get(),
      ...legacyNaicRefs.map(ref => ref.get()),
    ]);
    const sourceSnap = legacyNaicSnaps.find(snap => snap.exists) ?? (legacySnap.exists ? legacySnap : null);
    result.scanned = 1 + (legacySnap.exists ? 1 : 0) + legacyNaicSnaps.filter(snap => snap.exists).length;

    const targetData = targetSnap.data() ?? {};
    const sourceData = sourceSnap?.data();
    const shouldCopySourceContacts = Boolean(sourceSnap && (!targetSnap.exists || !hasContactsData(targetData)) && hasContactsData(sourceData));

    if (shouldCopySourceContacts && sourceSnap) {
      result.updated++;
      if (!dryRun) {
        await targetRef.set(
          {
            ...sourceData,
            clientId: NAIC_CLIENT_ID,
            migratedFrom: sourceSnap.id,
            migratedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
      return result;
    }

    if (isMissing(targetData.clientId)) {
      result.updated++;
      if (!dryRun) {
        await targetRef.set({ clientId: NAIC_CLIENT_ID, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
    }

    return result;
  }

  static async backfillNaicClientId(options: { dryRun?: boolean } = {}): Promise<MigrationSummary> {
    const dryRun = Boolean(options.dryRun);
    const summary: MigrationSummary = {
      dryRun,
      clients: await this.ensureNaicClient(dryRun),
      admin: await this.backfillAdmins(dryRun),
      users: await this.backfillCollection('users', dryRun, { includeNaicMetadata: true }),
      centers: await this.backfillCollection('centers', dryRun),
      announcements: await this.backfillCollection('announcements', dryRun),
      statuses: await this.backfillStatuses(dryRun),
      contacts: await this.backfillContacts(dryRun),
      totalUpdated: 0,
    };

    summary.totalUpdated =
      summary.clients.updated +
      summary.admin.updated +
      summary.users.updated +
      summary.centers.updated +
      summary.announcements.updated +
      summary.statuses.updated +
      summary.contacts.updated;

    return summary;
  }
}
