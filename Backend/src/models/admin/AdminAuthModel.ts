import { NAIC_CLIENT_ID, NAIC_LOCATION_CLIENT } from '@/config/locationConfig';
import { db } from '@/db/firestoreConfig';
import type { AdminRole, AdminStatus, AdminUser } from '@/types/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ClientModel } from './ClientModel';

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

    const invitation = await this.getInvitation(normalizedEmail);
    if (invitation?.status === 'revoked') {
      return null;
    }

    if (this.getLguAdminEmails().includes(normalizedEmail)) {
      return { role: 'lgu_admin', clientId: NAIC_CLIENT_ID, clientName: NAIC_LOCATION_CLIENT.name };
    }

    if (invitation) {
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
    return this.withClientMetadata(toAdminUser(updatedSnap.id, updatedSnap.data() ?? payload));
  }

  static async getAdminByUid(uid: string): Promise<AdminUser | null> {
    const snap = await this.adminRef(uid).get();
    if (!snap.exists) return null;
    return this.withClientMetadata(toAdminUser(snap.id, snap.data() ?? {}));
  }

  static async createInvitation(data: {
    email: string;
    role: AdminRole;
    clientId: string | null;
    clientName?: string | null;
    requestId?: string | null;
    invitedBy: string;
  }): Promise<Record<string, unknown>> {
    const payload = {
      email: normalizeEmail(data.email),
      role: data.role,
      clientId: data.clientId,
      clientName: data.clientName ?? null,
      requestId: data.requestId ?? null,
      status: 'pending',
      invitedBy: data.invitedBy,
      invitedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await this.invitationRef(data.email).set(payload, { merge: true });

    return {
      email: payload.email,
      role: payload.role,
      clientId: payload.clientId,
      clientName: payload.clientName,
      requestId: payload.requestId,
      status: payload.status,
      invitedBy: payload.invitedBy,
    };
  }

  static async updateAdminStatus(uid: string, status: AdminStatus): Promise<AdminUser> {
    if (!['active', 'inactive'].includes(status)) {
      throw new Error('Invalid admin status');
    }

    await this.adminRef(uid).set({ status, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const updated = await this.getAdminByUid(uid);
    if (!updated) throw new Error('Admin user not found');
    return updated;
  }

  static async deleteLguAdmin(uid: string, deletedBy: string): Promise<AdminUser> {
    const admin = await this.getAdminByUid(uid);
    if (!admin) throw new Error('Admin user not found');
    if (admin.role === 'super_admin') throw new Error('Super admins must be managed with SUPER_ADMIN_EMAILS');

    await this.adminRef(uid).delete();
    await this.invitationRef(admin.email).set(
      {
        email: normalizeEmail(admin.email),
        role: admin.role,
        clientId: admin.clientId,
        clientName: admin.clientName ?? null,
        status: 'revoked',
        revokedBy: deletedBy,
        revokedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return admin;
  }

  static async listAdmins(): Promise<AdminUser[]> {
    const snapshot = await db.collection('admin').orderBy('email', 'asc').get();
    return snapshot.docs.map(doc => toAdminUser(doc.id, doc.data()));
  }

  static async listLguAdmins(): Promise<AdminUser[]> {
    const admins = await this.listAdmins();
    return admins.filter(admin => admin.role === 'lgu_admin');
  }

  static async listAdminsByClient(clientId: string): Promise<AdminUser[]> {
    const admins = await this.listAdmins();
    return admins.filter(admin => admin.role === 'lgu_admin' && admin.clientId === clientId);
  }

  static async deactivateAdminsForClient(clientId: string, updatedBy: string): Promise<number> {
    const adminSnapshot = await db.collection('admin').where('clientId', '==', clientId).get();
    const inviteSnapshot = await db.collection('adminInvitations').where('clientId', '==', clientId).get();
    const batch = db.batch();

    adminSnapshot.docs.forEach(doc => {
      batch.set(
        doc.ref,
        {
          status: 'inactive',
          deactivatedBy: updatedBy,
          deactivatedReason: 'client_deleted',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    inviteSnapshot.docs.forEach(doc => {
      batch.set(
        doc.ref,
        {
          status: 'revoked',
          revokedBy: updatedBy,
          revokedReason: 'client_deleted',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    if (adminSnapshot.empty && inviteSnapshot.empty) return 0;

    await batch.commit();
    return adminSnapshot.size;
  }

  private static async withClientMetadata(adminUser: AdminUser): Promise<AdminUser> {
    if (adminUser.role !== 'lgu_admin' || !adminUser.clientId) {
      return adminUser;
    }

    const client = await ClientModel.getClientById(adminUser.clientId);
    if (!client) return adminUser;

    return {
      ...adminUser,
      clientName: adminUser.clientName || client.name,
      municipalityName: client.municipalityName,
      weatherLocationKey: client.weatherLocationKey,
      weatherLatitude: client.weatherLatitude,
      weatherLongitude: client.weatherLongitude,
      clientBarangays: client.barangays.filter(barangay => barangay.isActive !== false),
    };
  }
}
