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

  public static async markNotificationAsHidden(notificationId: string, userId: string) {
    try {
      const docRef = db.collection('notifications').doc(notificationId);
      await docRef.update({
        hiddenBy: FieldValue.arrayUnion(userId),
      });
    } catch (error) {
      console.error('❌ Error in UnifiedModel.markNotificationAsHidden:', error);
      throw error;
    }
  }

  public static async getResidentStatuses(userId: string) {
    try {
      // Get all statuses for this user
      const snapshot = await db
        .collection('status')
        .doc(userId)
        .collection('statuses')
        .orderBy('createdAt', 'desc')
        .get();

      if (snapshot.empty) {
        return [];
      }

      // Group by parentId and get only the latest version of each
      const statusMap = new Map();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const parentId = data.parentId;

        // If we haven't seen this parentId, or if this version is newer, store it
        if (!statusMap.has(parentId)) {
          statusMap.set(parentId, { id: doc.id, ...data });
        }
      });

      // Convert map to array and sort by createdAt descending (newest first)
      return Array.from(statusMap.values()).sort((a, b) => {
        const aTime = a.createdAt?._seconds || 0;
        const bTime = b.createdAt?._seconds || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('❌ Error in UnifiedModel.getResidentStatuses:', error);
      throw error;
    }
  }

  public static async markAllNotificationsAsRead(userId: string, notificationIds: string[]) {
    try {
      const batch = db.batch();

      notificationIds.forEach(notificationId => {
        const docRef = db.collection('notifications').doc(notificationId);
        batch.update(docRef, {
          readBy: FieldValue.arrayUnion(userId),
        });
      });
      await batch.commit();
      return;
    } catch (error) {
      console.error('❌ Error in UnifiedModel.markAllNotificationsAsRead:', error);
      throw error;
    }
  }
}
