import { db } from '@/db/firestoreConfig';
// import { EmailService } from '@/services/EmailService';
import { ManagementNotificationService } from '@/services/ManagementNotificationService';
import type {
  ClientChangeRequest,
  ClientChangeRequestType,
  ClientCoverageBarangay,
  ClientLgu,
  ClientMapSettings,
} from '@/types/admin';
import { areChangeValuesEqual, hasRecordChanges } from '@/utils/changeDetection';
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

const FIELD_LIMITS = {
  weatherLocationKey: 80,
  clientName: 120,
  email: 254,
  regionCode: 20,
  regionName: 120,
  provinceCode: 20,
  provinceName: 120,
  municipalityCode: 20,
  municipalityName: 120,
  boundarySource: 180,
  barangayCode: 20,
  barangayLabel: 120,
  barangayValue: 120,
} as const;

const FIELD_LABELS: Record<keyof typeof FIELD_LIMITS, string> = {
  weatherLocationKey: 'Weather key',
  clientName: 'LGU name',
  email: 'Email',
  regionCode: 'Region code',
  regionName: 'Region name',
  provinceCode: 'Province code',
  provinceName: 'Province name',
  municipalityCode: 'Municipality or city code',
  municipalityName: 'Municipality or city name',
  boundarySource: 'Boundary source',
  barangayCode: 'Barangay code',
  barangayLabel: 'Barangay name',
  barangayValue: 'Barangay value',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ChangeRequestValidationError extends Error {
  fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super('Validation failed');
    this.fieldErrors = fieldErrors;
  }
}

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
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));
const isWholeNumber = (value: number) => Number.isInteger(value);

const throwIfValidationErrors = (errors: Record<string, string>) => {
  if (Object.keys(errors).length > 0) throw new ChangeRequestValidationError(errors);
};

const validateMaxLength = (
  errors: Record<string, string>,
  errorKey: string,
  fieldKey: keyof typeof FIELD_LIMITS,
  value: string
) => {
  const maxLength = FIELD_LIMITS[fieldKey];
  if (value.length > maxLength) {
    errors[errorKey] = `${FIELD_LABELS[fieldKey]} should not exceed ${maxLength} characters`;
  }
};

const requireString = (
  payload: Record<string, unknown>,
  key: string,
  fieldKey: keyof typeof FIELD_LIMITS,
  errors: Record<string, string>
) => {
  const value = asString(payload[key]);
  if (!value) errors[key] = `${FIELD_LABELS[fieldKey]} is required`;
  else validateMaxLength(errors, key, fieldKey, value);
  return value;
};

const readOptionalString = (
  payload: Record<string, unknown>,
  key: string,
  fieldKey: keyof typeof FIELD_LIMITS,
  errors: Record<string, string>
) => {
  const value = asString(payload[key]);
  if (value) validateMaxLength(errors, key, fieldKey, value);
  return value;
};

const requireBoundedNumber = (
  payload: Record<string, unknown>,
  key: string,
  label: string,
  min: number,
  max: number,
  errors: Record<string, string>
) => {
  const value = asNumberOrNull(payload[key]);
  if (value === null) errors[key] = `${label} is required`;
  else if (value < min || value > max) errors[key] = `${label} must be between ${min} and ${max}`;
  return value;
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

const hasProposalChanges = (
  type: ClientChangeRequestType,
  currentSnapshot: Record<string, unknown>,
  proposedChanges: Record<string, unknown>
): boolean => {
  if (type === 'admin_invite' || type === 'boundary_update') return true;

  if (type === 'weather_coordinates') {
    return ['weatherLocationKey', 'weatherLatitude', 'weatherLongitude'].some(
      key => !areChangeValuesEqual(currentSnapshot[key], proposedChanges[key])
    );
  }

  if (type === 'map_settings') {
    return !areChangeValuesEqual(
      getComparableMapSettings(currentSnapshot.mapSettings),
      getComparableMapSettings(proposedChanges.mapSettings)
    );
  }

  if (type === 'barangay_coverage') {
    return !areChangeValuesEqual(currentSnapshot.barangays, proposedChanges.barangays);
  }

  if (type === 'client_info') {
    const currentForProposedKeys = Object.fromEntries(
      Object.keys(proposedChanges).map(key => [key, currentSnapshot[key]])
    );
    return hasRecordChanges(currentForProposedKeys, proposedChanges);
  }

  return hasRecordChanges(currentSnapshot, proposedChanges);
};

const getComparableMapSettings = (value: unknown): ClientMapSettings => {
  const settings = isRecord(value) ? value : {};
  const bounds = isRecord(settings.maxBounds) ? settings.maxBounds : null;

  return {
    centerLatitude: asNumberOrNull(settings.centerLatitude),
    centerLongitude: asNumberOrNull(settings.centerLongitude),
    minZoom: asNumberOrNull(settings.minZoom) ?? 13,
    zoom: asNumberOrNull(settings.zoom) ?? 15,
    maxZoom: asNumberOrNull(settings.maxZoom) ?? 18,
    maxBounds: bounds
      ? {
          north: asNumberOrNull(bounds.north) ?? 0,
          south: asNumberOrNull(bounds.south) ?? 0,
          east: asNumberOrNull(bounds.east) ?? 0,
          west: asNumberOrNull(bounds.west) ?? 0,
        }
      : null,
    boundarySource: asString(settings.boundarySource) || null,
    boundaryVerified: settings.boundaryVerified === true,
  };
};

const validateMapSettings = (value: unknown): ClientMapSettings => {
  const errors: Record<string, string> = {};
  if (!isRecord(value)) {
    throw new ChangeRequestValidationError({ mapSettings: 'Map settings are required' });
  }

  const centerLatitude = requireBoundedNumber(value, 'centerLatitude', 'Center latitude', -90, 90, errors);
  const centerLongitude = requireBoundedNumber(value, 'centerLongitude', 'Center longitude', -180, 180, errors);
  const minZoom = requireBoundedNumber(value, 'minZoom', 'Minimum zoom', 12, 13, errors);
  const zoom = requireBoundedNumber(value, 'zoom', 'Default zoom', 12, 17, errors);
  const maxZoom = requireBoundedNumber(value, 'maxZoom', 'Maximum zoom', 12, 18, errors);
  const maxBounds = isRecord(value.maxBounds) ? value.maxBounds : null;

  if (minZoom !== null && !isWholeNumber(minZoom)) errors.minZoom = 'Minimum zoom must be a whole number';
  if (zoom !== null && !isWholeNumber(zoom)) errors.zoom = 'Default zoom must be a whole number';
  if (maxZoom !== null && !isWholeNumber(maxZoom)) errors.maxZoom = 'Maximum zoom must be a whole number';

  if (minZoom !== null && zoom !== null && zoom < minZoom) {
    errors.zoom = 'Default zoom must be greater than or equal to minimum zoom';
  }
  if (zoom !== null && maxZoom !== null && maxZoom < zoom) {
    errors.maxZoom = 'Maximum zoom must be greater than or equal to default zoom';
  }

  if (!maxBounds) errors.maxBounds = 'Map bounds are required';
  const north = maxBounds ? requireBoundedNumber(maxBounds, 'north', 'North bound', -90, 90, errors) : null;
  const south = maxBounds ? requireBoundedNumber(maxBounds, 'south', 'South bound', -90, 90, errors) : null;
  const east = maxBounds ? requireBoundedNumber(maxBounds, 'east', 'East bound', -180, 180, errors) : null;
  const west = maxBounds ? requireBoundedNumber(maxBounds, 'west', 'West bound', -180, 180, errors) : null;

  if (north !== null && south !== null && north <= south) {
    errors.north = 'North bound must be greater than south bound';
    errors.south = 'South bound must be less than north bound';
  }
  if (east !== null && west !== null && east <= west) {
    errors.east = 'East bound must be greater than west bound';
    errors.west = 'West bound must be less than east bound';
  }
  if (centerLatitude !== null && north !== null && south !== null && (centerLatitude > north || centerLatitude < south)) {
    errors.centerLatitude = 'Center latitude must be inside the north/south bounds';
  }
  if (centerLongitude !== null && east !== null && west !== null && (centerLongitude > east || centerLongitude < west)) {
    errors.centerLongitude = 'Center longitude must be inside the east/west bounds';
  }

  const boundarySource = readOptionalString(value, 'boundarySource', 'boundarySource', errors);

  throwIfValidationErrors(errors);

  return {
    centerLatitude,
    centerLongitude,
    minZoom: minZoom as number,
    zoom: zoom as number,
    maxZoom: maxZoom as number,
    maxBounds: {
      north: north as number,
      south: south as number,
      east: east as number,
      west: west as number,
    },
    boundarySource: boundarySource || null,
    boundaryVerified: value.boundaryVerified === true,
  };
};

const normalizeCoverageBarangay = (
  value: unknown,
  index: number,
  errors: Record<string, string>
): ClientCoverageBarangay | null => {
  if (!isRecord(value)) {
    errors[`barangays.${index}`] = 'Barangay entry is invalid';
    return null;
  }

  const label = asString(value.barangayLabel || value.name || value.label);
  const code = asString(value.barangayCode || value.code || value.psgcCode);
  const rawValue = asString(value.value) || label;
  const latitude = value.latitude === null || value.latitude === undefined ? null : asNumberOrNull(value.latitude);
  const longitude = value.longitude === null || value.longitude === undefined ? null : asNumberOrNull(value.longitude);

  if (!label) errors[`barangays.${index}.barangayLabel`] = 'Barangay name is required';
  else validateMaxLength(errors, `barangays.${index}.barangayLabel`, 'barangayLabel', label);
  if (!rawValue) errors[`barangays.${index}.value`] = 'Barangay value is required';
  else validateMaxLength(errors, `barangays.${index}.value`, 'barangayValue', rawValue);
  if (code) validateMaxLength(errors, `barangays.${index}.barangayCode`, 'barangayCode', code);
  if (latitude === null && value.latitude !== null && value.latitude !== undefined) {
    errors[`barangays.${index}.latitude`] = 'Barangay latitude must be a valid number';
  } else if (latitude !== null && (latitude < -90 || latitude > 90)) {
    errors[`barangays.${index}.latitude`] = 'Barangay latitude must be between -90 and 90';
  }
  if (longitude === null && value.longitude !== null && value.longitude !== undefined) {
    errors[`barangays.${index}.longitude`] = 'Barangay longitude must be a valid number';
  } else if (longitude !== null && (longitude < -180 || longitude > 180)) {
    errors[`barangays.${index}.longitude`] = 'Barangay longitude must be between -180 and 180';
  }

  if (!label || !rawValue) return null;

  return {
    barangayCode: code || null,
    barangayLabel: label,
    value: rawValue.trim().toLowerCase(),
    isActive: value.isActive !== false,
    latitude,
    longitude,
    verified: value.verified !== false,
  };
};

const sanitizeProposal = (
  type: ClientChangeRequestType,
  proposedChanges: Record<string, unknown>,
  client: ClientLgu
): Record<string, unknown> => {
  if (type === 'weather_coordinates') {
    const errors: Record<string, string> = {};
    const weatherLocationKey = requireString(proposedChanges, 'weatherLocationKey', 'weatherLocationKey', errors);
    const latitude = asNumberOrNull(proposedChanges.weatherLatitude);
    const longitude = asNumberOrNull(proposedChanges.weatherLongitude);
    if (latitude === null) errors.weatherLatitude = 'Weather latitude is required';
    else if (latitude < -90 || latitude > 90) errors.weatherLatitude = 'Weather latitude must be between -90 and 90';
    if (longitude === null) errors.weatherLongitude = 'Weather longitude is required';
    else if (longitude < -180 || longitude > 180) {
      errors.weatherLongitude = 'Weather longitude must be between -180 and 180';
    }

    throwIfValidationErrors(errors);

    return {
      weatherLatitude: latitude,
      weatherLongitude: longitude,
      weatherLocationKey,
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
    const mapSettings = validateMapSettings(proposedChanges.mapSettings);
    return {
      mapSettings: normalizeMapSettings(
        mapSettings,
        client.weatherLatitude,
        client.weatherLongitude
      ) as ClientMapSettings,
    };
  }

  if (type === 'barangay_coverage') {
    const errors: Record<string, string> = {};
    if (!Array.isArray(proposedChanges.barangays)) {
      throw new ChangeRequestValidationError({ barangays: 'Barangay coverage is required' });
    }

    const barangays = proposedChanges.barangays
      .map((barangay, index) => normalizeCoverageBarangay(barangay, index, errors))
      .filter((barangay): barangay is ClientCoverageBarangay => Boolean(barangay));

    if (barangays.length === 0) errors.barangays = 'Barangay coverage is required';
    else if (!barangays.some(barangay => barangay.isActive !== false)) {
      errors.barangays = 'At least one barangay must remain enabled';
    }

    throwIfValidationErrors(errors);

    return { barangays };
  }

  if (type === 'client_info') {
    const errors: Record<string, string> = {};
    const allowed: Record<string, unknown> = {};
    const allowedFields: Array<[string, keyof typeof FIELD_LIMITS]> = [
      ['name', 'clientName'],
      ['regionCode', 'regionCode'],
      ['regionName', 'regionName'],
      ['provinceCode', 'provinceCode'],
      ['provinceName', 'provinceName'],
      ['municipalityCode', 'municipalityCode'],
      ['municipalityName', 'municipalityName'],
    ];

    allowedFields.forEach(([key, fieldKey]) => {
      if (!Object.prototype.hasOwnProperty.call(proposedChanges, key)) return;
      allowed[key] = requireString(proposedChanges, key, fieldKey, errors);
    });

    if (Object.keys(allowed).length === 0) errors.clientInfo = 'At least one client information field is required';

    throwIfValidationErrors(errors);

    return allowed;
  }

  if (type === 'admin_invite') {
    const errors: Record<string, string> = {};
    const email = asEmail(proposedChanges.email);
    if (!email) errors.email = 'Email is required';
    else if (email.length > FIELD_LIMITS.email) errors.email = `Email should not exceed ${FIELD_LIMITS.email} characters`;
    else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address';

    throwIfValidationErrors(errors);

    return { email };
  }

  if (type === 'boundary_update') {
    const errors: Record<string, string> = {};
    if (!isRecord(proposedChanges.geoJson)) {
      errors.geoJson = 'GeoJSON boundary is required';
    }
    const source = readOptionalString(proposedChanges, 'source', 'boundarySource', errors);

    throwIfValidationErrors(errors);

    return {
      geoJsonText: stringifyGeoJsonForStorage(proposedChanges.geoJson as Record<string, unknown>),
      source: source || null,
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
    const currentSnapshot = snapshotForType(client, params.type);

    if (!hasProposalChanges(params.type, currentSnapshot, proposedChanges)) {
      throw new Error('No changes detected in proposal');
    }

    const payload = {
      clientId: client.id,
      clientName: client.name,
      type: params.type,
      status: 'pending',
      currentSnapshot,
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
