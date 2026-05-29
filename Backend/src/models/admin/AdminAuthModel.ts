import { admin, db } from '@/db/firestoreConfig';
import { EmailService } from '@/services/EmailService';
import type { AdminRole, AdminStatus, AdminUser } from '@/types/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ClientModel } from './ClientModel';

const PERMISSIONS_VERSION = 1;

type AllowedAdminAccess = {
  role: AdminRole;
  clientId: string | null;
  clientName: string | null;
  source: 'super_admin_allowlist' | 'invitation' | 'existing_admin' | 'legacy_admin_email';
};

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
  const clientId =
    role === 'super_admin'
      ? null
      : typeof data.clientId === 'string' && data.clientId.trim()
        ? data.clientId.trim()
        : null;

  return {
    uid: data.uid || id,
    email: data.email,
    role,
    clientId,
    clientName: data.clientName ?? null,
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
    return [];
  }

  private static async getAdminRecordByEmail(email: string): Promise<AdminUser | null> {
    const snapshot = await db.collection('admin').where('email', '==', normalizeEmail(email)).limit(1).get();
    if (snapshot.empty) return null;
    return toAdminUser(snapshot.docs[0].id, snapshot.docs[0].data());
  }

  static async getInvitation(email: string): Promise<FirebaseFirestore.DocumentData | null> {
    const snap = await this.invitationRef(email).get();
    return snap.exists ? snap.data() ?? null : null;
  }

  static async getAllowedAdminRole(email: string): Promise<{
    role: AdminRole;
    clientId: string | null;
    clientName: string | null;
    source?: AllowedAdminAccess['source'];
  } | null> {
    const normalizedEmail = normalizeEmail(email);

    if (this.getSuperAdminEmails().includes(normalizedEmail)) {
      return { role: 'super_admin', clientId: null, clientName: null, source: 'super_admin_allowlist' };
    }

    const invitation = await this.getInvitation(normalizedEmail);
    if (invitation?.status === 'revoked') {
      return null;
    }

    if (invitation) {
      if (invitation.role === 'super_admin') {
        return null;
      }

      if (typeof invitation.clientId !== 'string' || !invitation.clientId.trim()) {
        return null;
      }

      return {
        role: 'lgu_admin',
        clientId: invitation.clientId.trim(),
        clientName: invitation.clientName ?? null,
        source: 'invitation',
      };
    }

    const existingAdmin = await this.getAdminRecordByEmail(normalizedEmail);
    if (existingAdmin) {
      if (existingAdmin.role === 'super_admin') {
        return null;
      }

      return {
        role: existingAdmin.role,
        clientId: existingAdmin.clientId,
        clientName: existingAdmin.clientName ?? null,
        source: 'existing_admin',
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
    const clientId = role === 'super_admin' ? null : existing.clientId || allowed.clientId || null;
    if (role === 'lgu_admin' && !clientId) {
      return null;
    }
    const clientName = role === 'super_admin' ? null : existing.clientName || allowed.clientName || null;
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
    if (allowed.source === 'invitation') {
      await this.acceptInvitation(params.email, params.uid);
    }

    const updatedSnap = await docRef.get();
    return this.withClientMetadata(toAdminUser(updatedSnap.id, updatedSnap.data() ?? payload));
  }

  static async acceptInvitation(email: string, uid: string): Promise<void> {
    const invitationRef = this.invitationRef(email);
    const invitation = await invitationRef.get();
    if (!invitation.exists || invitation.data()?.status === 'revoked') return;

    await invitationRef.set(
      {
        status: 'accepted',
        acceptedBy: uid,
        acceptedAt: invitation.data()?.acceptedAt || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
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
    const appUrl = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
    await EmailService.sendSimple({
      to: payload.email,
      subject: `Rescuenect ${payload.clientName || 'LGU'} admin invitation`,
      title: 'You have been invited to Rescuenect',
      message: `You were invited as an LGU admin${payload.clientName ? ` for ${payload.clientName}` : ''}. Sign in with this email to accept the invitation.`,
      template: 'lgu_admin_invitation',
      actionUrl: appUrl ? `${appUrl}/auth/login` : undefined,
      actionLabel: appUrl ? 'Accept invitation' : undefined,
    });
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

    const current = await this.getAdminByUid(uid);
    if (!current) throw new Error('Admin user not found');

    if (status === 'active' && current.role === 'lgu_admin') {
      if (!current.clientId) {
        throw new Error('Cannot activate LGU admin without an assigned client');
      }

      const client = await ClientModel.getClientById(current.clientId);
      if (!client) {
        throw new Error('Cannot activate LGU admin because the assigned client was not found');
      }
      if (client.status !== 'active') {
        throw new Error('Cannot activate LGU admin because the assigned client is not active');
      }
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
    return Promise.all(snapshot.docs.map(doc => this.withClientMetadata(toAdminUser(doc.id, doc.data()))));
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

  static async removeAdminsForClient(clientId: string): Promise<number> {
    const adminSnapshot = await db.collection('admin').where('clientId', '==', clientId).get();
    if (adminSnapshot.empty) return 0;

    const batch = db.batch();
    for (const doc of adminSnapshot.docs) {
      const uid = doc.id;
      try {
        await admin.auth().updateUser(uid, { disabled: true });
      } catch (error: any) {
        if (error?.code !== 'auth/user-not-found') {
          console.error(`Failed to disable LGU admin auth user ${uid}:`, error);
        }
      }

      try {
        await admin.auth().deleteUser(uid);
      } catch (error: any) {
        if (error?.code !== 'auth/user-not-found') {
          console.error(`Failed to delete LGU admin auth user ${uid}:`, error);
        }
      }

      batch.delete(doc.ref);
    }

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
      clientStatus: client.status,
      clientDeletionEffectiveAt: client.deletionEffectiveAt,
      municipalityName: client.municipalityName,
      weatherLocationKey: client.weatherLocationKey,
      weatherLatitude: client.weatherLatitude,
      weatherLongitude: client.weatherLongitude,
      mapSettings: client.mapSettings,
      clientBarangays: client.barangays.filter(barangay => barangay.isActive !== false),
    };
  }
}
