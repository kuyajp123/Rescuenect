import { ClientModel } from '@/models/admin/ClientModel';
import { DangerZoneEvidenceUploadService } from '@/services/DangerZoneEvidenceUploadService';
import { DangerZoneFirestoreGeometryService } from '@/services/DangerZoneFirestoreGeometryService';
import { DangerZoneGeometryService } from '@/services/DangerZoneGeometryService';
import {
  DangerZoneNotificationEvent,
  DangerZoneNotificationService,
  getDangerZoneNotificationEventForOfficialZone,
} from '@/services/DangerZoneNotificationService';
import { AdminUser } from '@/types/admin';
import { DangerZoneAuditAction, DangerZoneAuditActorRole, DangerZoneRecord, DangerZoneStatus } from '@/types/dangerZone';
import { canonicalizeClientId } from '@/config/locationConfig';
import { db } from '@/db/firestoreConfig';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

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

type ParsedExpiry = {
  provided: boolean;
  value: Timestamp | null;
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

  private static parseExpiresAt(rawPayload: unknown): ParsedExpiry {
    if (!rawPayload || typeof rawPayload !== 'object' || !Object.prototype.hasOwnProperty.call(rawPayload, 'expiresAt')) {
      return { provided: false, value: null };
    }

    const rawValue = (rawPayload as { expiresAt?: unknown }).expiresAt;
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return { provided: true, value: null };
    }

    const date =
      rawValue instanceof Date
        ? rawValue
        : typeof rawValue === 'string' || typeof rawValue === 'number'
        ? new Date(rawValue)
        : null;

    if (!date || Number.isNaN(date.getTime())) {
      throw new DangerZoneModelError(400, 'expiresAt must be a valid future date', {
        expiresAt: 'Enter a valid expiry date and time',
      });
    }

    if (date.getTime() <= Date.now()) {
      throw new DangerZoneModelError(400, 'expiresAt must be in the future', {
        expiresAt: 'Expiry must be later than the current time',
      });
    }

    return { provided: true, value: Timestamp.fromDate(date) };
  }

  private static createAuditEntry(
    action: DangerZoneAuditAction,
    actorId: string,
    actorRole: DangerZoneAuditActorRole,
    note?: string | null,
    changes?: Record<string, unknown>
  ) {
    return {
      action,
      actorId,
      actorRole,
      at: Timestamp.now(),
      note: note ?? null,
      ...(changes ? { changes } : {}),
    };
  }

  private static getAdminActorName(adminUser: AdminUser): string {
    return `${adminUser.firstName ?? ''} ${adminUser.lastName ?? ''}`.trim() || adminUser.email || adminUser.uid;
  }

  private static getExpiryUpdate(rawPayload: unknown): { provided: boolean; update: { expiresAt?: Timestamp | null } } {
    const expiry = this.parseExpiresAt(rawPayload);
    if (!expiry.provided) return { provided: false, update: {} };
    return { provided: true, update: { expiresAt: expiry.value } };
  }

  private static getUpdateChangedFields(
    record: DangerZoneRecord,
    storageInput: Record<string, unknown>,
    expiryUpdate: { provided: boolean; update: { expiresAt?: Timestamp | null } }
  ): string[] {
    const changed = new Set<string>();
    const comparableFields = [
      'type',
      'severity',
      'description',
      'geometryType',
      'center',
      'radiusMeters',
      'geojson',
      'affectedWidthMeters',
    ];

    comparableFields.forEach(field => {
      const beforeValue = (record as unknown as Record<string, unknown>)[field] ?? null;
      const afterValue = storageInput[field] ?? null;
      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) changed.add(field);
    });

    if (expiryUpdate.provided) {
      const beforeExpiry = timestampMillis(record.expiresAt);
      const afterExpiry = timestampMillis(expiryUpdate.update.expiresAt);
      if (beforeExpiry !== afterExpiry) changed.add('expiresAt');
    }

    return [...changed];
  }

  private static async notifyLifecycleEvent(
    zone: DangerZoneRecord,
    eventType: DangerZoneNotificationEvent
  ): Promise<void> {
    try {
      await DangerZoneNotificationService.sendLifecycleNotification(eventType, zone);
      await this.pathRef().doc(zone.id).update({
        [`notificationAudit.${eventType}`]: Timestamp.now(),
        ...(eventType === 'expired' ? { expiryNotifiedAt: Timestamp.now() } : {}),
      });
    } catch (error) {
      console.error('Failed to send danger-zone lifecycle notification:', {
        dangerZoneId: zone.id,
        eventType,
        error: error instanceof Error ? error.message : error,
      });
    }
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
      expiresAt: null,
      expiredBy: null,
      expiredAt: null,
      expiryNotifiedAt: null,
      lastEditedBy: null,
      lastEditedAt: null,
      notificationAudit: {},
      auditTrail: [this.createAuditEntry('created', uid, 'resident')],
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
    const expiry = this.parseExpiresAt(rawPayload);
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
      expiresAt: expiry.provided ? expiry.value : null,
      expiredBy: null,
      expiredAt: null,
      expiryNotifiedAt: null,
      lastEditedBy: null,
      lastEditedAt: null,
      notificationAudit: {},
      auditTrail: [this.createAuditEntry('created', adminUser.uid, adminUser.role, `Created by ${this.getAdminActorName(adminUser)}`)],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snap = await docRef.get();
    const zone = this.toRecord(snap);
    await this.notifyLifecycleEvent(zone, getDangerZoneNotificationEventForOfficialZone(zone));

    const updatedSnap = await docRef.get();
    return this.toRecord(updatedSnap);
  }

  static async updateZone(adminUser: AdminUser, id: unknown, rawPayload: unknown): Promise<DangerZoneRecord> {
    const record = await this.getRecordForAdmin(adminUser, id);
    if (record.status !== 'verified' || record.isActive !== true) {
      throw new DangerZoneModelError(400, 'Only active verified danger zones can be edited');
    }

    const input = DangerZoneGeometryService.validateAdminPayload(rawPayload);
    const storageInput = DangerZoneFirestoreGeometryService.toFirestoreInput(input);
    const expiryUpdate = this.getExpiryUpdate(rawPayload);
    const changedFields = this.getUpdateChangedFields(record, input as unknown as Record<string, unknown>, expiryUpdate);
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
      ...expiryUpdate.update,
      lastEditedBy: adminUser.uid,
      lastEditedAt: FieldValue.serverTimestamp(),
      auditTrail: FieldValue.arrayUnion(
        this.createAuditEntry('updated', adminUser.uid, adminUser.role, `Updated by ${this.getAdminActorName(adminUser)}`, {
          fields: changedFields,
        })
      ),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snap = await this.pathRef().doc(record.id).get();
    const zone = this.toRecord(snap);
    if (zone.geometryType === 'line' && (zone.severity === 'high' || zone.severity === 'critical')) {
      await this.notifyLifecycleEvent(zone, 'road_segment_blocked');
    }

    const updatedSnap = await this.pathRef().doc(record.id).get();
    return this.toRecord(updatedSnap);
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

  static async verifyReport(adminUser: AdminUser, id: unknown, rawPayload?: unknown): Promise<DangerZoneRecord> {
    const record = await this.getRecordForAdmin(adminUser, id);
    if (record.source !== 'resident_report' || record.status !== 'pending') {
      throw new DangerZoneModelError(400, 'Only pending resident reports can be verified');
    }

    const expiry = this.parseExpiresAt(rawPayload);
    await this.pathRef().doc(record.id).update({
      status: 'verified',
      isActive: true,
      verifiedBy: adminUser.uid,
      verifiedAt: FieldValue.serverTimestamp(),
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      expiresAt: expiry.provided ? expiry.value : null,
      auditTrail: FieldValue.arrayUnion(
        this.createAuditEntry('verified', adminUser.uid, adminUser.role, `Verified by ${this.getAdminActorName(adminUser)}`)
      ),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snap = await this.pathRef().doc(record.id).get();
    const zone = this.toRecord(snap);
    await this.notifyLifecycleEvent(zone, 'report_verified');

    const updatedSnap = await this.pathRef().doc(record.id).get();
    return this.toRecord(updatedSnap);
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
      auditTrail: FieldValue.arrayUnion(
        this.createAuditEntry('rejected', adminUser.uid, adminUser.role, reason)
      ),
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
      auditTrail: FieldValue.arrayUnion(
        this.createAuditEntry('resolved', adminUser.uid, adminUser.role, `Resolved by ${this.getAdminActorName(adminUser)}`)
      ),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snap = await this.pathRef().doc(record.id).get();
    const zone = this.toRecord(snap);
    await this.notifyLifecycleEvent(zone, 'resolved');

    const updatedSnap = await this.pathRef().doc(record.id).get();
    return this.toRecord(updatedSnap);
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
        .filter(record => !record.expiresAt || timestampMillis(record.expiresAt) > Date.now())
    );
  }
}
