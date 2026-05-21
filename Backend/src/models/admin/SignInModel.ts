import { db } from '@/db/firestoreConfig';
import { AdminAuthModel } from './AdminAuthModel';
import type { AdminUser } from '@/types/admin';

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
      barangay: string;
      address: string;
    }
  ): Promise<boolean> {
    try {
      await db
        .collection('admin')
        .doc(uid)
        .update({
          ...data,
          onboardingComplete: true,
          updatedAt: new Date(),
        });
      return true;
    } catch (error) {
      console.error('Error updating admin profile:', error);
      throw new Error('Failed to update profile');
    }
  }
}
