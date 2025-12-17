import { db } from '@/db/firestoreConfig';

export class SignInModel {
  static async SignUser(
    email: string,
    uid: string,
    barangay: string,
    fcmToken?: string
  ): Promise<{
    email: string;
    uid: string;
    fcmToken?: string | null;
    barangay: string;
    onboardingComplete: boolean;
  } | null> {
    try {
      const userSnapshot = await db.collection('admin').where('uid', '==', uid).get();
      if (userSnapshot.empty) {
        // New user
        const userData = {
          email,
          uid,
          fcmToken: fcmToken || null,
          barangay,
          onboardingComplete: false, // Default to false
          createdAt: new Date(),
        };

        await db.collection('admin').doc(uid).set(userData);
        return userData;
      }

      const userData = userSnapshot.docs[0].data();
      return {
        email: userData.email,
        uid: userData.uid,
        fcmToken: userData.fcmToken,
        barangay: userData.barangay,
        onboardingComplete: !!userData.onboardingComplete, // Ensure boolean
        ...userData, // Return other fields too
      };
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
