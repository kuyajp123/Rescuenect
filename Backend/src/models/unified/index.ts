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

  public static async markNotificationAsRead(notificationId: string, uid: string) {
    try {
      const docRef = db.collection('notifications').doc(notificationId);
      await docRef.update({
        readBy: FieldValue.arrayUnion(uid),
      });
    } catch (error) {
      console.error('❌ Error in UnifiedModel.markNotificationAsRead:', error);
      throw error;
    }
  }

  public static async markNotificationAsHidden(notificationId: string, uid: string) {
    try {
      const docRef = db.collection('notifications').doc(notificationId);
      await docRef.update({
        hiddenBy: FieldValue.arrayUnion(uid),
      });
    } catch (error) {
      console.error('❌ Error in UnifiedModel.markNotificationAsHidden:', error);
      throw error;
    }
  }

  public static async getResidentStatuses(uid: string) {
    try {
      // Get all statuses for this user
      const snapshot = await db.collection('status').doc(uid).collection('statuses').orderBy('createdAt', 'desc').get();

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

  public static async markAllNotificationsAsRead(uid: string, notificationIds: string[]) {
    try {
      const uniqueIds = Array.from(new Set(notificationIds.filter(Boolean)));
      if (uniqueIds.length === 0) return;

      // Some notification types (e.g. status_resolved) are stored inside the user document
      // under `users/{uid}.notifications` rather than in the global `notifications` collection.
      // Attempting to batch.update() a non-existent global doc will fail the entire batch.
      const userNotificationIds = new Set<string>();
      try {
        const userDocRef = db.collection('users').doc(uid);
        const userSnap = await userDocRef.get();

        if (userSnap.exists) {
          const data = userSnap.data();
          const existingNotifications = Array.isArray(data?.notifications) ? data!.notifications : [];

          for (const notif of existingNotifications) {
            if (notif && typeof (notif as any).id === 'string') {
              userNotificationIds.add((notif as any).id);
            }
          }

          const idsToMark = new Set(uniqueIds);
          let changed = false;
          const updatedNotifications = existingNotifications.map((notif: any) => {
            if (notif && typeof notif.id === 'string' && idsToMark.has(notif.id)) {
              if (notif.read !== true) {
                changed = true;
                return { ...notif, read: true };
              }
            }
            return notif;
          });

          if (changed) {
            await userDocRef.set({ notifications: updatedNotifications }, { merge: true });
          }
        }
      } catch (userNotifError) {
        // Don't fail the entire operation if the user-doc notification update fails.
        console.error('⚠️ Error updating user-stored notifications as read:', userNotifError);
      }

      const globalIds = uniqueIds.filter(id => !userNotificationIds.has(id));
      if (globalIds.length === 0) return;

      const docRefs = globalIds.map(id => db.collection('notifications').doc(id));
      const snaps = await db.getAll(...docRefs);

      // Batch write limit is 500 operations; chunk commits defensively.
      let batch = db.batch();
      let writesInBatch = 0;

      const commitBatch = async () => {
        if (writesInBatch === 0) return;
        await batch.commit();
        batch = db.batch();
        writesInBatch = 0;
      };

      for (const snap of snaps) {
        if (!snap.exists) {
          continue; // Skip IDs that don't exist in global notifications
        }

        batch.update(snap.ref, {
          readBy: FieldValue.arrayUnion(uid),
        });
        writesInBatch++;

        if (writesInBatch >= 450) {
          await commitBatch();
        }
      }

      await commitBatch();
      return;
    } catch (error) {
      console.error('❌ Error in UnifiedModel.markAllNotificationsAsRead:', error);
      throw error;
    }
  }

  public static async markAllNotificationsAsHidden(uid: string, notificationIds: string[]) {
    try {
      const batch = db.batch();

      notificationIds.forEach(notificationId => {
        const docRef = db.collection('notifications').doc(notificationId);
        batch.update(docRef, {
          hiddenBy: FieldValue.arrayUnion(uid),
        });
      });
      await batch.commit();
      return;
    } catch (error) {
      console.error('❌ Error in UnifiedModel.markAllNotificationsAsHidden:', error);
      throw error;
    }
  }

  static async getAllAnnouncements(): Promise<FirebaseFirestore.DocumentData[]> {
    try {
      const snapshot = await db.collection('announcements').orderBy('createdAt', 'desc').get();
      const announcements: FirebaseFirestore.DocumentData[] = [];
      snapshot.forEach(doc => {
        announcements.push({ id: doc.id, ...doc.data() });
      });
      return announcements;
    } catch (error) {
      console.error('❌ Error in AnnouncementModel.getAllAnnouncements:', error);
      throw error;
    }
  }

  static async getAnnouncementById(announcementId: string): Promise<FirebaseFirestore.DocumentData | null> {
    try {
      const docRef = db.collection('announcements').doc(announcementId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error in AnnouncementModel.getAnnouncementById:', error);
      throw error;
    }
  }
}
