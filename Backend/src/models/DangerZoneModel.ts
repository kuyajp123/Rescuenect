import { ClientModel } from '@/models/admin/ClientModel';
import { DangerZoneEvidenceUploadService } from '@/services/DangerZoneEvidenceUploadService';
import { DangerZoneFirestoreGeometryService } from '@/services/DangerZoneFirestoreGeometryService';
import { DangerZoneGeometryService } from '@/services/DangerZoneGeometryService';
import { AdminUser } from '@/types/admin';
import { DangerZoneRecord, DangerZoneStatus } from '@/types/dangerZone';
import { canonicalizeClientId } from '@/config/locationConfig';
import { db } from '@/db/firestoreConfig';
import { FieldValue } from 'firebase-admin/firestore';

export class DangerZoneModelError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DangerZoneModelError';
  }
}

type ListFilters = {
  clientId?: string;
  status?: string;
};

const asTrimmedString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const timestampMillis = (value: unknown): number => {
  if (!value) return 0;
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof (value as { _seconds?: number })._seconds === 'number') {
    return (value as { _seconds: number })._seconds * 1000;
  }
  if (typeof (value as { seconds?: number }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return 0;
};

export class DangerZoneModel {
  private static readonly COLLECTION = 'dangerZones';

  private static pathRef() {
    return db.collection(this.COLLECTION);
  }

  private static toRecord(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): DangerZoneRecord {
    const data = doc.data() ?? {};
    return {
      id: doc.id,
      ...data,
      geojson: DangerZoneFirestoreGeometryService.fromFirestoreGeoJson(data.geojson),
    } as DangerZoneRecord;
  }

  private static sortNewestFirst(records: DangerZoneRecord[]): DangerZoneRecord[] {
    return records.sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
  }

  private static async getResidentClientMetadata(uid: string): Promise<Record<string, unknown> & { clientId: string }> {
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      throw new DangerZoneModelError(404, 'Resident profile not found');
    }

    const userData = userSnap.data() ?? {};
    const clientId = canonicalizeClientId(asTrimmedString(userData.clientId));
    if (!clientId) {
      throw new DangerZoneModelError(400, 'Resident profile is missing client assignment');
    }

    const client = await ClientModel.getClientById(clientId);
    if (!client || client.status !== 'active') {
      throw new DangerZoneModelError(client?.status === 'deletion_scheduled' ? 423 : 403, 'Resident client is not active');
    }

    const firstName = asTrimmedString(userData.firstName);
    const lastName = asTrimmedString(userData.lastName);
    const reporterName = `${firstName} ${lastName}`.trim() || null;

    return {
      clientId,
      reporterName,
      reporterEmail: asTrimmedString(userData.email) || null,
      barangay: asTrimmedString(userData.barangay) || null,
      barangayCode: asTrimmedString(userData.barangayCode) || null,
      barangayLabel: asTrimmedString(userData.barangayLabel) || null,
      municipalityName: client.municipalityName ?? null,
      provinceName: client.provinceName ?? null,
    };
  }

  private static getAdminClientId(adminUser: AdminUser, requestedClientId?: unknown, requireClient = true): string | undefined {
    if (adminUser.role === 'lgu_admin') {
      const clientId = canonicalizeClientId(adminUser.clientId);
      if (!clientId) {
        throw new DangerZoneModelError(403, 'LGU admin is missing client assignment');
      }
      return clientId;
    }

    const clientId = canonicalizeClientId(asTrimmedString(requestedClientId));
    if (requireClient && !clientId) {
      throw new DangerZoneModelError(400, 'clientId is required');
    }
    return clientId || undefined;
  }

  private static assertAdminCanAccessRecord(adminUser: AdminUser, record: DangerZoneRecord): void {
    if (adminUser.role === 'super_admin') return;
    const adminClientId = canonicalizeClientId(adminUser.clientId);
    if (!adminClientId || record.clientId !== adminClientId) {
      throw new DangerZoneModelError(403, 'Client access denied');
    }
  }

  private static async getRecordForAdmin(adminUser: AdminUser, id: unknown): Promise<DangerZoneRecord> {
    const dangerZoneId = asTrimmedString(id);
    if (!dangerZoneId) {
      throw new DangerZoneModelError(400, 'Danger-zone ID is required');
    }

    const snap = await this.pathRef().doc(dangerZoneId).get();
    if (!snap.exists) {
      throw new DangerZoneModelError(404, 'Danger zone not found');
    }

    const record = this.toRecord(snap);
    this.assertAdminCanAccessRecord(adminUser, record);
    return record;
  }

  static async createResidentReport(uid: string, rawPayload: unknown, file?: Express.Multer.File): Promise<DangerZoneRecord> {
    const metadata = await this.getResidentClientMetadata(uid);
    const input = DangerZoneGeometryService.validatePointCirclePayload(rawPayload);
    const docRef = this.pathRef().doc();
    const photoUrls = file
      ? [
          await DangerZoneEvidenceUploadService.uploadEvidenceImage(file, {
            clientId: metadata.clientId,
            dangerZoneId: docRef.id,
          }),
        ]
      : [];

    await docRef.set({
      ...input,
      ...metadata,
      source: 'resident_report',
      status: 'pending',
      isActive: true,
      photoUrls,
      reportedBy: uid,
      reportedByRole: 'resident',
      verifiedBy: null,
      verifiedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snap = await docRef.get();
    return this.toRecord(snap);
  }

  static async getResidentReports(uid: string): Promise<DangerZoneRecord[]> {
    const metadata = await this.getResidentClientMetadata(uid);
    const snapshot = await this.pathRef().where('reportedBy', '==', uid).get();
    return this.sortNewestFirst(
      snapshot.docs.map(doc => this.toRecord(doc)).filter(record => record.clientId === metadata.clientId)
    );
  }

  static async createOfficialZone(adminUser: AdminUser, rawPayload: unknown): Promise<DangerZoneRecord> {
    const clientId = this.getAdminClientId(adminUser, (rawPayload as { clientId?: unknown } | null)?.clientId, true) as string;
    const input = DangerZoneGeometryService.validateAdminPayload(rawPayload);
    const docRef = this.pathRef().doc();

    await docRef.set({
      ...DangerZoneFirestoreGeometryService.toFirestoreInput(input),
      clientId,
      source: 'lgu_official',
      status: 'verified',
      isActive: true,
      photoUrls: [],
      reportedBy: adminUser.uid,
      reportedByRole: adminUser.role,
      reporterName: `${adminUser.firstName ?? ''} ${adminUser.lastName ?? ''}`.trim() || adminUser.email || null,
      reporterEmail: adminUser.email ?? null,
      verifiedBy: adminUser.uid,
      verifiedAt: FieldValue.serverTimestamp(),
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snap = await docRef.get();
    return this.toRecord(snap);
  }

  static async updateZone(adminUser: AdminUser, id: unknown, rawPayload: unknown): Promise<DangerZoneRecord> {
    const record = await this.getRecordForAdmin(adminUser, id);
    if (record.status !== 'verified' || record.isActive !== true) {
      throw new DangerZoneModelError(400, 'Only active verified danger zones can be edited');
    }

    const input = DangerZoneGeometryService.validateAdminPayload(rawPayload);
    const storageInput = DangerZoneFirestoreGeometryService.toFirestoreInput(input);
    await this.pathRef().doc(record.id).update({
      type: storageInput.type,
      severity: storageInput.severity,
      description: storageInput.description,
      geometryType: storageInput.geometryType,
      center: storageInput.center ?? null,
      radiusMeters: storageInput.radiusMeters ?? null,
      geojson: storageInput.geojson,
      affectedWidthMeters: storageInput.affectedWidthMeters ?? null,
      avoidGeojson: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snap = await this.pathRef().doc(record.id).get();
    return this.toRecord(snap);
  }

  static async listResidentReports(adminUser: AdminUser, filters: ListFilters = {}): Promise<DangerZoneRecord[]> {
    const clientId = this.getAdminClientId(adminUser, filters.clientId, false);
    const status = asTrimmedString(filters.status) as DangerZoneStatus | '';
    const snapshot = clientId ? await this.pathRef().where('clientId', '==', clientId).get() : await this.pathRef().get();

    return this.sortNewestFirst(
      snapshot.docs
        .map(doc => this.toRecord(doc))
        .filter(record => record.source === 'resident_report')
        .filter(record => !status || record.status === status)
    );
  }

  static async listZones(adminUser: AdminUser, filters: ListFilters = {}): Promise<DangerZoneRecord[]> {
    const clientId = this.getAdminClientId(adminUser, filters.clientId, false);
    const status = asTrimmedString(filters.status) as DangerZoneStatus | '';
    const snapshot = clientId ? await this.pathRef().where('clientId', '==', clientId).get() : await this.pathRef().get();

    return this.sortNewestFirst(
      snapshot.docs
        .map(doc => this.toRecord(doc))
        .filter(record => !status || record.status === status)
    );
  }

  static async verifyReport(adminUser: AdminUser, id: unknown): Promise<DangerZoneRecord> {
    const record = await this.getRecordForAdmin(adminUser, id);
    if (record.source !== 'resident_report' || record.status !== 'pending') {
      throw new DangerZoneModelError(400, 'Only pending resident reports can be verified');
    }

    await this.pathRef().doc(record.id).update({
      status: 'verified',
      isActive: true,
      verifiedBy: adminUser.uid,
      verifiedAt: FieldValue.serverTimestamp(),
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snap = await this.pathRef().doc(record.id).get();
    return this.toRecord(snap);
  }

  static async rejectReport(adminUser: AdminUser, id: unknown, rejectionReason: unknown): Promise<DangerZoneRecord> {
    const record = await this.getRecordForAdmin(adminUser, id);
    if (record.source !== 'resident_report' || record.status !== 'pending') {
      throw new DangerZoneModelError(400, 'Only pending resident reports can be rejected');
    }

    const reason = asTrimmedString(rejectionReason);
    if (!reason) {
      throw new DangerZoneModelError(400, 'Rejection reason is required', { rejectionReason: 'Rejection reason is required' });
    }

    await this.pathRef().doc(record.id).update({
      status: 'rejected',
      isActive: false,
      rejectedBy: adminUser.uid,
      rejectedAt: FieldValue.serverTimestamp(),
      rejectionReason: reason,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snap = await this.pathRef().doc(record.id).get();
    return this.toRecord(snap);
  }

  static async resolveZone(adminUser: AdminUser, id: unknown): Promise<DangerZoneRecord> {
    const record = await this.getRecordForAdmin(adminUser, id);
    if (record.status !== 'verified' || record.isActive !== true) {
      throw new DangerZoneModelError(400, 'Only active verified danger zones can be resolved');
    }

    await this.pathRef().doc(record.id).update({
      status: 'resolved',
      isActive: false,
      resolvedBy: adminUser.uid,
      resolvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snap = await this.pathRef().doc(record.id).get();
    return this.toRecord(snap);
  }

  static async listPublicVerifiedActive(clientIdValue: unknown): Promise<DangerZoneRecord[]> {
    const clientId = canonicalizeClientId(asTrimmedString(clientIdValue));
    if (!clientId) {
      throw new DangerZoneModelError(400, 'clientId is required');
    }

    const snapshot = await this.pathRef().where('clientId', '==', clientId).get();
    return this.sortNewestFirst(
      snapshot.docs
        .map(doc => this.toRecord(doc))
        .filter(record => record.status === 'verified' && record.isActive === true)
    );
  }
}
