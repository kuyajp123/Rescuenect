import { NAIC_CLIENT_ID, NAIC_LOCATION_CLIENT } from '@/config/locationConfig';
import { db } from '@/db/firestoreConfig';
import type { AdminRole, AdminStatus, AdminUser } from '@/types/admin';
import { FieldValue } from 'firebase-admin/firestore';

const PERMISSIONS_VERSION = 1;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const parseEmailEnv = (raw?: string): string[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map(item => String(item)).map(normalizeEmail).filter(Boolean);
    }
    if (parsed && typeof parsed === 'object') {
      return Object.values(parsed).map(item => String(item)).map(normalizeEmail).filter(Boolean);
    }
  } catch {
    // Fall back to comma-separated env values.
  }

  return raw
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(normalizeEmail);
};

const buildPermissions = (role: AdminRole): string[] =>
  role === 'super_admin'
    ? ['super:manage_clients', 'super:manage_requests', 'super:view_system_status', 'lgu:manage_operations']
    : ['lgu:manage_operations'];

const toAdminUser = (id: string, data: FirebaseFirestore.DocumentData): AdminUser => {
  const role = data.role === 'super_admin' ? 'super_admin' : 'lgu_admin';
  const clientId = role === 'super_admin' ? null : (data.clientId as string | undefined) || NAIC_CLIENT_ID;

  return {
    uid: data.uid || id,
    email: data.email,
    role,
    clientId,
    clientName: data.clientName ?? (clientId === NAIC_CLIENT_ID ? NAIC_LOCATION_CLIENT.name : null),
    status: data.status === 'inactive' ? 'inactive' : 'active',
    permissionsVersion: data.permissionsVersion || PERMISSIONS_VERSION,
    permissions: Array.isArray(data.permissions) ? data.permissions : buildPermissions(role),
    onboardingComplete: Boolean(data.onboardingComplete),
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    bio: data.bio,
    barangay: data.barangay,
    address: data.address,
    fcmToken: data.fcmToken ?? null,
  };
};

export class AdminAuthModel {
  private static adminRef(uid: string) {
    return db.collection('admin').doc(uid);
  }

  private static invitationRef(email: string) {
    return db.collection('adminInvitations').doc(normalizeEmail(email).replace(/[/.#[\]]/g, '_'));
  }

  static getSuperAdminEmails(): string[] {
    return parseEmailEnv(process.env.SUPER_ADMIN_EMAILS);
  }

  static getLguAdminEmails(): string[] {
    return parseEmailEnv(process.env.ADMIN_EMAILS);
  }

  static async getInvitation(email: string): Promise<FirebaseFirestore.DocumentData | null> {
    const snap = await this.invitationRef(email).get();
    return snap.exists ? snap.data() ?? null : null;
  }

  static async getAllowedAdminRole(email: string): Promise<{
    role: AdminRole;
    clientId: string | null;
    clientName: string | null;
  } | null> {
    const normalizedEmail = normalizeEmail(email);

    if (this.getSuperAdminEmails().includes(normalizedEmail)) {
      return { role: 'super_admin', clientId: null, clientName: null };
    }

    if (this.getLguAdminEmails().includes(normalizedEmail)) {
      return { role: 'lgu_admin', clientId: NAIC_CLIENT_ID, clientName: NAIC_LOCATION_CLIENT.name };
    }

    const invitation = await this.getInvitation(normalizedEmail);
    if (invitation && invitation.status !== 'revoked') {
      return {
        role: invitation.role === 'super_admin' ? 'super_admin' : 'lgu_admin',
        clientId: invitation.role === 'super_admin' ? null : invitation.clientId || NAIC_CLIENT_ID,
        clientName: invitation.clientName ?? null,
      };
    }

    return null;
  }

  static async ensureAdminUser(params: {
    uid: string;
    email: string;
    barangay?: string;
    fcmToken?: string | null;
  }): Promise<AdminUser | null> {
    const allowed = await this.getAllowedAdminRole(params.email);
    if (!allowed) return null;

    const docRef = this.adminRef(params.uid);
    const snap = await docRef.get();
    const existing = snap.exists ? snap.data() ?? {} : {};

    const role = allowed.role;
    const clientId = role === 'super_admin' ? null : existing.clientId || allowed.clientId || NAIC_CLIENT_ID;
    const clientName =
      role === 'super_admin' ? null : existing.clientName || allowed.clientName || NAIC_LOCATION_CLIENT.name;
    const status = (existing.status as AdminStatus | undefined) || 'active';

    const payload = {
      email: normalizeEmail(params.email),
      uid: params.uid,
      fcmToken: params.fcmToken ?? existing.fcmToken ?? null,
      barangay: existing.barangay || params.barangay || 'bancaan',
      role,
      clientId,
      clientName,
      status,
      permissionsVersion: PERMISSIONS_VERSION,
      permissions: buildPermissions(role),
      onboardingComplete: Boolean(existing.onboardingComplete),
      createdAt: existing.createdAt || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.set(payload, { merge: true });
    const updatedSnap = await docRef.get();
    return toAdminUser(updatedSnap.id, updatedSnap.data() ?? payload);
  }

  static async getAdminByUid(uid: string): Promise<AdminUser | null> {
    const snap = await this.adminRef(uid).get();
    if (!snap.exists) return null;
    return toAdminUser(snap.id, snap.data() ?? {});
  }

  static async createInvitation(data: {
    email: string;
    role: AdminRole;
    clientId: string | null;
    clientName?: string | null;
    requestId?: string | null;
    invitedBy: string;
  }): Promise<void> {
    await this.invitationRef(data.email).set(
      {
        email: normalizeEmail(data.email),
        role: data.role,
        clientId: data.clientId,
        clientName: data.clientName ?? null,
        requestId: data.requestId ?? null,
        status: 'pending',
        invitedBy: data.invitedBy,
        invitedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  static async listAdmins(): Promise<AdminUser[]> {
    const snapshot = await db.collection('admin').orderBy('email', 'asc').get();
    return snapshot.docs.map(doc => toAdminUser(doc.id, doc.data()));
  }
}
