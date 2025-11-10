import { db } from '@/db/firestoreConfig';

export class ConfigModels {
  static async updateFcmToken(uid: string, token?: string | null): Promise<Boolean | null> {
    try {
      const adminRef = db.collection('admin').doc(uid);
      await adminRef.update({ fcmToken: token });

      return token ? true : null;
    } catch (error) {
      console.error('Error updating FCM Token: ', error);
      throw new Error('Failed to update FCM Token');
    }
  }
}
