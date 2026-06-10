import { db } from '@/db/firestoreConfig';
import { AdminAuthModel } from '@/models/admin/AdminAuthModel';
import { ClientModel } from '@/models/admin/ClientModel';
// import { EmailService } from '@/services/EmailService';
import { ManagementNotificationService } from '@/services/ManagementNotificationService';
import type { ClientCoverageBarangay, ClientLguType, LguRequest } from '@/types/admin';
import { FieldValue } from 'firebase-admin/firestore';

const FIELD_LIMITS = {
  lguName: 120,
  officeDepartment: 120,
  requesterName: 100,
  requesterPosition: 100,
  requesterEmail: 254,
  requesterPhone: 13,
  regionCode: 20,
  regionName: 120,
  provinceCode: 20,
  provinceName: 120,
  municipalityCode: 20,
  municipalityName: 120,
  notes: 500,
  barangayCode: 20,
  barangayLabel: 120,
  barangayValue: 120,
} as const;

const FIELD_LABELS: Record<keyof typeof FIELD_LIMITS, string> = {
  lguName: 'LGU name',
  officeDepartment: 'Office or department',
  requesterName: 'Requester name',
  requesterPosition: 'Position',
  requesterEmail: 'Email',
  requesterPhone: 'Phone',
  regionCode: 'Region code',
  regionName: 'Region name',
  provinceCode: 'Province code',
  provinceName: 'Province name',
  municipalityCode: 'Municipality or city code',
  municipalityName: 'Municipality or city name',
  notes: 'Notes',
  barangayCode: 'Barangay code',
  barangayLabel: 'Barangay name',
  barangayValue: 'Barangay value',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_MOBILE_DIGITS_PATTERN = /^09\d{9}$/;

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const asEmail = (value: unknown): string => asString(value).toLowerCase();
const asFiniteNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatPhoneNumber = (digits: string): string => `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;

const normalizePhoneNumber = (value: unknown, errors: Record<string, string>): string => {
  const rawPhone = asString(value);
  const digits = rawPhone.replace(/\D/g, '');

  if (!digits) {
    errors.requesterPhone = 'Phone is required';
    return rawPhone;
  }

  if (!PH_MOBILE_DIGITS_PATTERN.test(digits)) {
    errors.requesterPhone = 'Enter an 11-digit mobile number starting with 09';
    return rawPhone;
  }

  return formatPhoneNumber(digits);
};

const validateMaxLength = (
  errors: Record<string, string>,
  key: keyof typeof FIELD_LIMITS,
  value: string,
  errorKey: string = key
) => {
  const maxLength = FIELD_LIMITS[key];
  if (value.length > maxLength) {
    errors[errorKey] = `${FIELD_LABELS[key]} should not exceed ${maxLength} characters`;
  }
};

const requireString = (
  payload: Record<string, unknown>,
  key: keyof typeof FIELD_LIMITS,
  errors: Record<string, string>
) => {
  const value = asString(payload[key]);
  if (!value) errors[key] = `${FIELD_LABELS[key]} is required`;
  else validateMaxLength(errors, key, value);
  return value;
};

const readOptionalString = (
  payload: Record<string, unknown>,
  key: keyof typeof FIELD_LIMITS,
  errors: Record<string, string>
) => {
  const value = asString(payload[key]);
  if (value) validateMaxLength(errors, key, value);
  return value;
};

const normalizeBarangay = (value: unknown): ClientCoverageBarangay | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const label = asString(data.barangayLabel || data.name || data.label);
  const code = asString(data.barangayCode || data.code || data.psgcCode);
  const rawValue = asString(data.value) || label;

  if (!label || !rawValue) return null;
  if (
    label.length > FIELD_LIMITS.barangayLabel ||
    code.length > FIELD_LIMITS.barangayCode ||
    rawValue.length > FIELD_LIMITS.barangayValue
  ) {
    return null;
  }

  return {
    barangayCode: code || null,
    barangayLabel: label,
    value: rawValue.trim().toLowerCase(),
    isActive: true,
    latitude: null,
    longitude: null,
    verified: true,
  };
};

const serializeRequest = (id: string, data: FirebaseFirestore.DocumentData): LguRequest => ({
  id,
  status: data.status || 'pending',
  lguName: data.lguName || '',
  officeDepartment: data.officeDepartment || '',
  requesterName: data.requesterName || '',
  requesterPosition: data.requesterPosition || '',
  requesterEmail: data.requesterEmail || '',
  requesterPhone: data.requesterPhone || '',
  regionCode: data.regionCode || '',
  regionName: data.regionName || '',
  provinceCode: data.provinceCode || '',
  provinceName: data.provinceName || '',
  municipalityCode: data.municipalityCode || '',
  municipalityName: data.municipalityName || '',
  municipalityType: data.municipalityType === 'city' ? 'city' : 'municipality',
  proposedWeatherLatitude: typeof data.proposedWeatherLatitude === 'number' ? data.proposedWeatherLatitude : null,
  proposedWeatherLongitude: typeof data.proposedWeatherLongitude === 'number' ? data.proposedWeatherLongitude : null,
  selectedBarangays: Array.isArray(data.selectedBarangays) ? data.selectedBarangays : [],
  barangaysVerified: Boolean(data.barangaysVerified),
  notes: data.notes || '',
  reviewedBy: data.reviewedBy ?? null,
  reviewedAt: data.reviewedAt,
  reviewNote: data.reviewNote ?? null,
  clientId: data.clientId ?? null,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export class LguRequestModel {
  private static collectionRef() {
    return db.collection('lguRequests');
  }

  static async createRequest(payload: Record<string, unknown>): Promise<string> {
    const errors: Record<string, string> = {};
    const rawSelectedBarangays = Array.isArray(payload.selectedBarangays) ? payload.selectedBarangays : [];
    const selectedBarangays = Array.isArray(payload.selectedBarangays)
      ? payload.selectedBarangays
          .map(normalizeBarangay)
          .filter((barangay): barangay is ClientCoverageBarangay => Boolean(barangay))
      : [];
    const requesterEmail = asEmail(payload.requesterEmail);
    const proposedWeatherLatitude = asFiniteNumberOrNull(payload.proposedWeatherLatitude);
    const proposedWeatherLongitude = asFiniteNumberOrNull(payload.proposedWeatherLongitude);

    const request = {
      status: 'pending',
      lguName: requireString(payload, 'lguName', errors),
      officeDepartment: requireString(payload, 'officeDepartment', errors),
      requesterName: requireString(payload, 'requesterName', errors),
      requesterPosition: requireString(payload, 'requesterPosition', errors),
      requesterEmail,
      requesterPhone: normalizePhoneNumber(payload.requesterPhone, errors),
      regionCode: requireString(payload, 'regionCode', errors),
      regionName: requireString(payload, 'regionName', errors),
      provinceCode: requireString(payload, 'provinceCode', errors),
      provinceName: requireString(payload, 'provinceName', errors),
      municipalityCode: requireString(payload, 'municipalityCode', errors),
      municipalityName: requireString(payload, 'municipalityName', errors),
      municipalityType: payload.municipalityType === 'city' ? ('city' as ClientLguType) : ('municipality' as const),
      proposedWeatherLatitude,
      proposedWeatherLongitude,
      selectedBarangays,
      barangaysVerified: payload.barangaysVerified === true,
      notes: readOptionalString(payload, 'notes', errors),
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      clientId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!request.requesterEmail) {
      errors.requesterEmail = 'Email is required';
    } else if (request.requesterEmail.length > FIELD_LIMITS.requesterEmail) {
      errors.requesterEmail = `Email should not exceed ${FIELD_LIMITS.requesterEmail} characters`;
    } else if (!EMAIL_PATTERN.test(request.requesterEmail)) {
      errors.requesterEmail = 'Enter a valid email address';
    }

    if (request.proposedWeatherLatitude === null) {
      errors.proposedWeatherLatitude = 'Proposed center latitude is required';
    } else if (request.proposedWeatherLatitude < -90 || request.proposedWeatherLatitude > 90) {
      errors.proposedWeatherLatitude = 'Proposed center latitude must be between -90 and 90';
    }

    if (request.proposedWeatherLongitude === null) {
      errors.proposedWeatherLongitude = 'Proposed center longitude is required';
    } else if (request.proposedWeatherLongitude < -180 || request.proposedWeatherLongitude > 180) {
      errors.proposedWeatherLongitude = 'Proposed center longitude must be between -180 and 180';
    }

    if (!request.barangaysVerified) {
      errors.barangaysVerified = 'Barangay verification is required';
    }
    if (rawSelectedBarangays.length === 0) {
      errors.selectedBarangays = 'At least one barangay is required';
    } else if (selectedBarangays.length !== rawSelectedBarangays.length) {
      errors.selectedBarangays = 'Selected barangays contain invalid entries';
    }

    if (Object.keys(errors).length > 0) {
      const error = new Error('Validation failed') as Error & { fieldErrors?: Record<string, string> };
      error.fieldErrors = errors;
      throw error;
    }

    const docRef = await this.collectionRef().add(request);
    const appUrl = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
    const superAdminEmails = AdminAuthModel.getSuperAdminEmails();
    await Promise.all([
      ManagementNotificationService.notifySuperAdmins({
        type: 'client_request',
        title: 'New LGU access request',
        message: `${request.lguName} requested Rescuenect access for ${request.municipalityName}, ${request.provinceName}.`,
        sentTo: superAdminEmails.length,
        data: {
          requestId: docRef.id,
          status: request.status,
          lguName: request.lguName,
          requesterEmail: request.requesterEmail,
          municipalityName: request.municipalityName,
          provinceName: request.provinceName,
          actionPath: '/super/requests',
        },
      }),
      //--- EMAIL DISABLED ---
      // EmailService.sendSimple({
      //   to: request.requesterEmail,
      //   subject: 'Rescuenect access request received',
      //   title: 'Request received',
      //   message: `We received your Rescuenect access request for ${request.lguName}. A Super Admin will review it soon.`,
      //   template: 'lgu_request_received',
      //   actionUrl: appUrl ? `${appUrl}/request-access` : undefined,
      //   actionLabel: appUrl ? 'View Rescuenect' : undefined,
      // }),
      // ...superAdminEmails.map(email =>
      //   EmailService.sendSimple({
      //     to: email,
      //     subject: 'New Rescuenect LGU access request',
      //     title: 'New LGU request',
      //     message: `${request.lguName} submitted a request for ${request.municipalityName}, ${request.provinceName}.`,
      //     template: 'super_lgu_request_received',
      //     actionUrl: appUrl ? `${appUrl}/super/requests` : undefined,
      //     actionLabel: appUrl ? 'Review request' : undefined,
      //   })
      // ),
      //--- EMAIL DISABLED ---
    ]);
    return docRef.id;
  }

  static async listRequests(): Promise<LguRequest[]> {
    const snapshot = await this.collectionRef().orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => serializeRequest(doc.id, doc.data()));
  }

  static async getRequest(id: string): Promise<LguRequest | null> {
    const snap = await this.collectionRef().doc(id).get();
    return snap.exists ? serializeRequest(snap.id, snap.data() ?? {}) : null;
  }

  static async getRequestForClient(clientId: string, requestId?: string | null): Promise<LguRequest | null> {
    if (requestId) {
      const request = await this.getRequest(requestId);
      if (request?.clientId === clientId) return request;
    }

    const snapshot = await this.collectionRef().where('clientId', '==', clientId).limit(1).get();
    return snapshot.empty ? null : serializeRequest(snapshot.docs[0].id, snapshot.docs[0].data());
  }

  static async approveRequest(id: string, reviewedBy: string, reviewNote?: string): Promise<LguRequest> {
    const request = await this.getRequest(id);
    if (!request) throw new Error('LGU request not found');
    if (request.status !== 'pending') throw new Error('Only pending LGU requests can be approved');

    const client = await ClientModel.createDraftClientFromRequest(request);
    await AdminAuthModel.createInvitation({
      email: request.requesterEmail,
      role: 'lgu_admin',
      clientId: client.id,
      clientName: client.name,
      requestId: request.id,
      invitedBy: reviewedBy,
    });

    await this.collectionRef()
      .doc(id)
      .set(
        {
          status: 'approved',
          clientId: client.id,
          reviewedBy,
          reviewedAt: FieldValue.serverTimestamp(),
          reviewNote: reviewNote || null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    const updated = await this.getRequest(id);
    if (!updated) throw new Error('LGU request not found after approval');
    const appUrl = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
    //--- EMAIL DISABLED ---
    // await EmailService.sendSimple({
    //   to: updated.requesterEmail,
    //   subject: 'Rescuenect request approved',
    //   title: 'Your Rescuenect request was approved',
    //   message: `${updated.lguName} has been approved as a draft client. Please sign in with this email to continue onboarding.`,
    //   template: 'lgu_request_approved',
    //   actionUrl: appUrl ? `${appUrl}/auth/login` : undefined,
    //   actionLabel: appUrl ? 'Sign in' : undefined,
    // });
    //--- EMAIL DISABLED ---
    return updated;
  }

  static async rejectRequest(id: string, reviewedBy: string, reviewNote?: string): Promise<LguRequest> {
    const request = await this.getRequest(id);
    if (!request) throw new Error('LGU request not found');
    if (request.status !== 'pending') throw new Error('Only pending LGU requests can be rejected');

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

    const updated = await this.getRequest(id);
    if (!updated) throw new Error('LGU request not found after rejection');
    //--- EMAIL DISABLED ---
    // await EmailService.sendSimple({
    //   to: updated.requesterEmail,
    //   subject: 'Rescuenect request update',
    //   title: 'Your Rescuenect request was not approved',
    //   message: reviewNote || 'A Super Admin reviewed your request and did not approve it at this time.',
    //   template: 'lgu_request_rejected',
    // });
    //--- EMAIL DISABLED ---
    return updated;
  }

  static async deleteFinalizedRequest(id: string): Promise<LguRequest> {
    const request = await this.getRequest(id);
    if (!request) throw new Error('LGU request not found');
    if (request.status !== 'approved' && request.status !== 'rejected') {
      throw new Error('Only approved or rejected LGU requests can be deleted');
    }

    await this.collectionRef().doc(id).delete();
    return request;
  }
}
