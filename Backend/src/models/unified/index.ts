import { db } from '@/db/firestoreConfig';
import { FieldValue } from 'firebase-admin/firestore';

export class UnifiedModel {
  private static pathRef() {
    return db.collection('centers');
  }

  public static async getCenters() {
    try {
      const snapshot = await this.pathRef().get();
      const centers: any[] = [];
      snapshot.forEach(doc => {
        centers.push({ id: doc.id, ...doc.data() });
      });
      return centers;
    } catch (error) {
      console.error('❌ Error in EvacuationModel.addCenter:', error);
      throw error;
    }
  }

  public static async getNotificationDetails(notificationId: string) {
    try {
      const docRef = db.collection('notifications').doc(notificationId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Notification not found');
      }
    } catch (error) {
      console.error('❌ Error in UnifiedModel.getNotificationDetails:', error);
      throw error;
    }
  }

  public static async markNotificationAsRead(notificationId: string, userId: string) {
    try {
      const docRef = db.collection('notifications').doc(notificationId);
      await docRef.update({
        readBy: FieldValue.arrayUnion(userId),
      });
    } catch (error) {
      console.error('❌ Error in UnifiedModel.markNotificationAsRead:', error);
      throw error;
    }
  }
}
