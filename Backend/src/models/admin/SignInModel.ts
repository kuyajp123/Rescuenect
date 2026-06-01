import { db } from '@/db/firestoreConfig';
import { normalizeBarangayValue } from '@/config/locationConfig';
import { AdminAuthModel } from './AdminAuthModel';
import { ClientModel } from './ClientModel';
import type { AdminUser } from '@/types/admin';
import { canLguAdminCompleteOnboarding } from '@/utils/accessControl';

export class SignInModel {
  static async SignUser(
    email: string,
    uid: string,
    barangay: string,
    fcmToken?: string
  ): Promise<AdminUser | null> {
    try {
      return await AdminAuthModel.ensureAdminUser({ email, uid, barangay, fcmToken });
    } catch (error) {
      console.error('Error fetching/creating user:', error);
      throw new Error('Failed to sign in user');
    }
  }

  static async updateProfile(
    uid: string,
    data: {
      firstName: string;
      lastName: string;
      phone: string;
      bio: string;
      barangay?: string;
      address: string;
    }
  ): Promise<boolean> {
    try {
      const adminUser = await AdminAuthModel.getAdminByUid(uid);
      if (!adminUser) {
        throw new Error('Admin user not found');
      }

      const update: Record<string, unknown> = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        bio: data.bio,
        address: data.address,
        onboardingComplete: true,
        updatedAt: new Date(),
      };

      if (adminUser.role === 'lgu_admin') {
        if (!data.barangay) {
          throw new Error('Barangay is required for LGU admins');
        }

        const normalizedBarangay = normalizeBarangayValue(data.barangay);
        const client = adminUser.clientId ? await ClientModel.getClientById(adminUser.clientId) : null;
        const barangay = client?.barangays
          .filter(item => item.isActive !== false)
          .find(item => item.value === normalizedBarangay);

        if (!client || !canLguAdminCompleteOnboarding(client.status) || !barangay) {
          throw new Error('Barangay is not covered by your LGU client');
        }

        update.clientId = client.id;
        update.clientName = client.name;
        update.barangay = normalizedBarangay;
        update.barangayCode = barangay.barangayCode;
        update.barangayLabel = barangay.barangayLabel;
      } else {
        update.barangay = '';
        update.barangayCode = null;
        update.barangayLabel = null;
      }

      await db
        .collection('admin')
        .doc(uid)
        .update(update);
      return true;
    } catch (error) {
      console.error('Error updating admin profile:', error);
      if (error instanceof Error) throw error;
      throw new Error('Failed to update profile');
    }
  }
}
