import { db, withRetry } from '@/db/firestoreConfig';

export class ConfigModels {
  static async updateFcmToken(uid: string, token?: string | null): Promise<Boolean | null> {
    try {
      return await withRetry(async () => {
        const adminRef = db.collection('admin').doc(uid);
        await adminRef.update({ fcmToken: token });
        return token ? true : null;
      }, `updateFcmToken(${uid})`);
    } catch (error) {
      console.error('❌ Error updating FCM Token in Firestore:', {
        uid,
        token: token ? 'present' : 'null/empty',
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Failed to update FCM Token: ${error instanceof Error ? error.message : error}`);
    }
  }
}
