import { admin, db } from '@/db/firestoreConfig';

type DeleteAuthIfOrphanResult = 'deleted' | 'skipped_profile_exists' | 'already_missing';

export class AuthIdentityService {
  static async hasResidentProfile(uid: string): Promise<boolean> {
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists;
  }

  static async hasAdminProfile(uid: string): Promise<boolean> {
    const snap = await db.collection('admin').doc(uid).get();
    return snap.exists;
  }

  static async deleteAuthUserIfNoProfiles(uid: string, label = 'user'): Promise<DeleteAuthIfOrphanResult> {
    const [hasResidentProfile, hasAdminProfile] = await Promise.all([
      this.hasResidentProfile(uid),
      this.hasAdminProfile(uid),
    ]);

    if (hasResidentProfile || hasAdminProfile) {
      return 'skipped_profile_exists';
    }

    try {
      await admin.auth().updateUser(uid, { disabled: true });
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') {
        return 'already_missing';
      }
      console.error(`Failed to disable ${label} auth user ${uid}:`, error);
    }

    try {
      await admin.auth().deleteUser(uid);
      return 'deleted';
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') {
        return 'already_missing';
      }
      console.error(`Failed to delete ${label} auth user ${uid}:`, error);
      throw error;
    }
  }
}
