import { db } from '@/db/firestoreConfig';
// import { EmailService } from '@/services/EmailService';
import { ManagementNotificationService } from '@/services/ManagementNotificationService';
import type { ClientChangeRequest, ClientChangeRequestType, ClientLgu, ClientMapSettings } from '@/types/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { AdminAuthModel } from './AdminAuthModel';
import { ClientModel, normalizeMapSettings, parseGeoJsonFromStorage, stringifyGeoJsonForStorage } from './ClientModel';

const allowedTypes: ClientChangeRequestType[] = [
  'weather_coordinates',
  'map_settings',
  'barangay_coverage',
  'client_info',
  'admin_invite',
  'boundary_update',
];

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const asEmail = (value: unknown): string => asString(value).toLowerCase();
const asNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const serialize = (id: string, data: FirebaseFirestore.DocumentData): ClientChangeRequest => ({
  id,
  clientId: data.clientId || '',
  clientName: data.clientName ?? null,
  type: allowedTypes.includes(data.type) ? data.type : 'client_info',
  status: data.status || 'pending',
  currentSnapshot: data.currentSnapshot || {},
  proposedChanges: data.proposedChanges || {},
  requestedBy: data.requestedBy || '',
  requestedByEmail: data.requestedByEmail ?? null,
  requestedAt: data.requestedAt,
  reviewedBy: data.reviewedBy ?? null,
  reviewedAt: data.reviewedAt,
  reviewNote: data.reviewNote ?? null,
  appliedAt: data.appliedAt,
  cancelledAt: data.cancelledAt,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const snapshotForType = (client: ClientLgu, type: ClientChangeRequestType): Record<string, unknown> => {
  if (type === 'weather_coordinates') {
    return {
      weatherLocationKey: client.weatherLocationKey,
      weatherLatitude: client.weatherLatitude,
      weatherLongitude: client.weatherLongitude,
    };
  }
  if (type === 'map_settings') return { mapSettings: client.mapSettings };
  if (type === 'barangay_coverage') return { barangays: client.barangays };
  if (type === 'client_info') {
    return {
      name: client.name,
      regionName: client.regionName,
      provinceName: client.provinceName,
      municipalityName: client.municipalityName,
    };
  }
  return {};
};

const sanitizeProposal = (
  type: ClientChangeRequestType,
  proposedChanges: Record<string, unknown>,
  client: ClientLgu
): Record<string, unknown> => {
  if (type === 'weather_coordinates') {
    const latitude = asNumberOrNull(proposedChanges.weatherLatitude);
    const longitude = asNumberOrNull(proposedChanges.weatherLongitude);
    if (latitude === null || longitude === null) throw new Error('Weather latitude and longitude are required');
    return {
      weatherLatitude: latitude,
      weatherLongitude: longitude,
      weatherLocationKey: asString(proposedChanges.weatherLocationKey) || client.weatherLocationKey,
      mapSettings: normalizeMapSettings(
        {
          ...client.mapSettings,
          centerLatitude: latitude,
          centerLongitude: longitude,
        },
        latitude,
        longitude
      ),
    };
  }

  if (type === 'map_settings') {
    return {
      mapSettings: normalizeMapSettings(
        proposedChanges.mapSettings,
        client.weatherLatitude,
        client.weatherLongitude
      ) as ClientMapSettings,
    };
  }

  if (type === 'barangay_coverage') {
    if (!Array.isArray(proposedChanges.barangays)) throw new Error('Barangay coverage is required');
    return { barangays: proposedChanges.barangays };
  }

  if (type === 'client_info') {
    const allowed: Record<string, unknown> = {};
    [
      'name',
      'regionCode',
      'regionName',
      'provinceCode',
      'provinceName',
      'municipalityCode',
      'municipalityName',
    ].forEach(key => {
      if (Object.prototype.hasOwnProperty.call(proposedChanges, key)) allowed[key] = proposedChanges[key];
    });
    if (Object.keys(allowed).length === 0) throw new Error('At least one client information field is required');
    return allowed;
  }

  if (type === 'admin_invite') {
    const email = asEmail(proposedChanges.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Valid invite email is required');
    return { email };
  }

  if (type === 'boundary_update') {
    if (!proposedChanges.geoJson || typeof proposedChanges.geoJson !== 'object') {
      throw new Error('GeoJSON boundary is required');
    }
    return {
      geoJsonText: stringifyGeoJsonForStorage(proposedChanges.geoJson as Record<string, unknown>),
      source: asString(proposedChanges.source) || null,
    };
  }

  throw new Error('Unsupported change request type');
};

export class ClientChangeRequestModel {
  private static collectionRef() {
    return db.collection('clientChangeRequests');
  }

  static async listAll(): Promise<ClientChangeRequest[]> {
    const snapshot = await this.collectionRef().orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => serialize(doc.id, doc.data()));
  }

  static async listByClient(clientId: string): Promise<ClientChangeRequest[]> {
    const snapshot = await this.collectionRef().where('clientId', '==', clientId).get();
    return snapshot.docs
      .map(doc => serialize(doc.id, doc.data()))
      .sort((left, right) => {
        const leftTime = (left.createdAt as any)?._seconds ?? 0;
        const rightTime = (right.createdAt as any)?._seconds ?? 0;
        return rightTime - leftTime;
      });
  }

  static async getById(id: string): Promise<ClientChangeRequest | null> {
    const snap = await this.collectionRef().doc(id).get();
    return snap.exists ? serialize(snap.id, snap.data() ?? {}) : null;
  }

  static async create(params: {
    clientId: string;
    type: ClientChangeRequestType;
    proposedChanges: Record<string, unknown>;
    requestedBy: string;
    requestedByEmail?: string | null;
  }): Promise<ClientChangeRequest> {
    if (!allowedTypes.includes(params.type)) throw new Error('Invalid change request type');

    const client = await ClientModel.getClientById(params.clientId);
    if (!client) throw new Error('Client not found');

    const proposedChanges = sanitizeProposal(params.type, params.proposedChanges, client);
    const payload = {
      clientId: client.id,
      clientName: client.name,
      type: params.type,
      status: 'pending',
      currentSnapshot: snapshotForType(client, params.type),
      proposedChanges,
      requestedBy: params.requestedBy,
      requestedByEmail: params.requestedByEmail ?? null,
      requestedAt: FieldValue.serverTimestamp(),
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      appliedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await this.collectionRef().add(payload);
    const request = await this.getById(docRef.id);
    if (!request) throw new Error('Change request not found after creation');

    const appUrl = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
    const superAdminEmails = AdminAuthModel.getSuperAdminEmails();
    await Promise.all([
      ManagementNotificationService.notifySuperAdmins({
        type: 'client_change_request',
        title: 'Client change request submitted',
        message: `${client.name} submitted a ${params.type.replace(/_/g, ' ')} proposal.`,
        clientId: client.id,
        clientName: client.name,
        sentTo: superAdminEmails.length,
        data: {
          requestId: request.id,
          clientId: client.id,
          clientName: client.name,
          requestType: params.type,
          requestedBy: params.requestedBy,
          requestedByEmail: params.requestedByEmail ?? null,
          status: request.status,
          actionPath: '/super/client-requests',
        },
      }),
      //--- EMAIL DISABLED ---
      // ...superAdminEmails.map(email =>
      //   EmailService.sendSimple({
      //     to: email,
      //     subject: 'New Rescuenect client change request',
      //     title: 'Client change request submitted',
      //     message: `${client.name} submitted a ${params.type.replace(/_/g, ' ')} proposal.`,
      //     template: 'client_change_request_submitted',
      //     actionUrl: appUrl ? `${appUrl}/super/client-requests` : undefined,
      //     actionLabel: appUrl ? 'Review proposal' : undefined,
      //   })
      // ),
      //--- EMAIL DISABLED ---
    ]);

    return request;
  }

  static async cancel(id: string, clientId: string): Promise<ClientChangeRequest> {
    const request = await this.getById(id);
    if (!request) throw new Error('Change request not found');
    if (request.clientId !== clientId) throw new Error('Change request is outside your client scope');
    if (request.status !== 'pending') throw new Error('Only pending change requests can be cancelled');

    await this.collectionRef().doc(id).set(
      {
        status: 'cancelled',
        cancelledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const updated = await this.getById(id);
    if (!updated) throw new Error('Change request not found after cancellation');
    return updated;
  }

  static async approve(id: string, reviewedBy: string, reviewNote?: string): Promise<ClientChangeRequest> {
    const request = await this.getById(id);
    if (!request) throw new Error('Change request not found');
    if (request.status !== 'pending') throw new Error('Only pending change requests can be approved');

    if (request.type === 'admin_invite') {
      const client = await ClientModel.getClientById(request.clientId);
      if (!client) throw new Error('Client not found');
      await AdminAuthModel.createInvitation({
        email: String(request.proposedChanges.email || ''),
        role: 'lgu_admin',
        clientId: client.id,
        clientName: client.name,
        invitedBy: reviewedBy,
      });
    } else if (request.type === 'boundary_update') {
      const geoJson = parseGeoJsonFromStorage(request.proposedChanges.geoJsonText ?? request.proposedChanges.geoJson);
      if (!geoJson) throw new Error('GeoJSON boundary is required');

      await ClientModel.saveBoundary({
        clientId: request.clientId,
        geoJson,
        source: typeof request.proposedChanges.source === 'string' ? request.proposedChanges.source : null,
        uploadedBy: reviewedBy,
      });
    } else {
      await ClientModel.updateClient(request.clientId, request.proposedChanges);
    }

    await this.collectionRef()
      .doc(id)
      .set(
        {
          status: 'approved',
          reviewedBy,
          reviewedAt: FieldValue.serverTimestamp(),
          reviewNote: reviewNote || null,
          appliedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    const updated = await this.getById(id);
    if (!updated) throw new Error('Change request not found after approval');
    // await this.notifyRequester(updated, true, reviewNote); //--- EMAIL DISABLED ---
    return updated;
  }

  static async reject(id: string, reviewedBy: string, reviewNote?: string): Promise<ClientChangeRequest> {
    const request = await this.getById(id);
    if (!request) throw new Error('Change request not found');
    if (request.status !== 'pending') throw new Error('Only pending change requests can be rejected');

    await this.collectionRef()
      .doc(id)
      .set(
        {
          status: 'rejected',
          reviewedBy,
          reviewedAt: FieldValue.serverTimestamp(),
          reviewNote: reviewNote || null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    const updated = await this.getById(id);
    if (!updated) throw new Error('Change request not found after rejection');
    // await this.notifyRequester(updated, false, reviewNote); //--- EMAIL DISABLED ---
    return updated;
  }

  static async delete(id: string): Promise<ClientChangeRequest> {
    const request = await this.getById(id);
    if (!request) throw new Error('Change request not found');

    await this.collectionRef().doc(id).delete();
    return request;
  }

  //--- EMAIL DISABLED ---
  // private static async notifyRequester(
  //   request: ClientChangeRequest,
  //   approved: boolean,
  //   reviewNote?: string
  // ): Promise<void> {
  //   if (!request.requestedByEmail) return;

  //   await EmailService.sendSimple({
  //     to: request.requestedByEmail,
  //     subject: approved ? 'Rescuenect client change approved' : 'Rescuenect client change update',
  //     title: approved ? 'Your client change request was approved' : 'Your client change request was not approved',
  //     message:
  //       reviewNote ||
  //       `${request.type.replace(/_/g, ' ')} for ${request.clientName || request.clientId} was ${
  //         approved ? 'approved and applied' : 'reviewed'
  //       }.`,
  //     template: approved ? 'client_change_request_approved' : 'client_change_request_rejected',
  //   });
  // }
  //--- EMAIL DISABLED ---
}
