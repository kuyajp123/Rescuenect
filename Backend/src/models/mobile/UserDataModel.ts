import { admin, db, withRetry } from '@/db/firestoreConfig';

export class UserDataModel {
  private static pathRef(userId: string) {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error(`Invalid userId provided: ${userId}`);
    }

    return db.collection('users').doc(userId.trim());
  }

  /**
   * Add FCM token to user's fcmTokens array (avoids duplicates)
   */
  static async updateFcmToken(uid: string, fcmToken: string) {
    try {
      return await withRetry(async () => {
        const ref = this.pathRef(uid);

        await ref.set(
          {
            fcmTokens: admin.firestore.FieldValue.arrayUnion(fcmToken),
          },
          { merge: true }
        );

        return { uid, fcmToken, operationType: 'added' };
      }, `UserDataModel.updateFcmToken(${uid})`);
    } catch (error) {
      console.error('❌ Error updating FCM token:', error);
      throw error;
    }
  }

  /**
   * Remove FCM token from user's fcmTokens array
   */
  static async removeFcmToken(uid: string, fcmToken: string) {
    try {
      return await withRetry(async () => {
        const ref = this.pathRef(uid);

        await ref.set(
          {
            fcmTokens: admin.firestore.FieldValue.arrayRemove(fcmToken),
          },
          { merge: true }
        );

        return { uid, fcmToken, operationType: 'removed' };
      }, `UserDataModel.removeFcmToken(${uid})`);
    } catch (error) {
      console.error('❌ Error removing FCM token:', error);
      throw error;
    }
  }

  /**
   * Get all FCM tokens for a user
   */
  static async getFcmTokens(uid: string): Promise<string[]> {
    try {
      const ref = this.pathRef(uid);
      const doc = await ref.get();

      if (doc.exists) {
        const data = doc.data();
        return data?.fcmTokens || [];
      }

      return [];
    } catch (error) {
      console.error('❌ Error getting FCM tokens:', error);
      throw error;
    }
  }

  static async saveLocationData(uid: string, id: string, label: string, location: string, lat: number, lng: number) {
    try {
      const ref = this.pathRef(uid);

      // Get existing locations first
      const doc = await ref.get();
      const existingData = doc.exists ? doc.data() : {};
      const existingLocations = existingData?.savedLocations || [];

      // Check if location with this ID already exists
      const existingLocationIndex = existingLocations.findIndex((loc: any) => loc.id === id);

      let updatedLocations;
      let operationType;

      if (existingLocationIndex !== -1) {
        // Update existing location
        updatedLocations = [...existingLocations];
        updatedLocations[existingLocationIndex] = { id, label, location, lat, lng };
        operationType = 'updated';
      } else {
        // Add new location
        updatedLocations = [...existingLocations, { id, label, location, lat, lng }];
        operationType = 'created';
      }

      await ref.set(
        {
          savedLocations: updatedLocations,
        },
        { merge: true }
      );

      return { uid, id, label, location, lat, lng, operationType };
    } catch (error) {
      console.error('Error saving location data:', error);
      throw error;
    }
  }

  static async getLocationData(userId: string) {
    try {
      const ref = this.pathRef(userId);
      const doc = await ref.get();
      if (doc.exists) {
        return doc.data()?.savedLocations || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error getting location data:', error);
      throw error;
    }
  }

  static async deleteLocationData(uid: string, id: string) {
    try {
      const ref = this.pathRef(uid);
      const doc = await ref.get();
      if (doc.exists) {
        const existingData = doc.data();
        const existingLocations = existingData?.savedLocations || [];

        // Filter out the location to be deleted
        const updatedLocations = existingLocations.filter((loc: any) => loc.id !== id);

        await ref.set(
          {
            savedLocations: updatedLocations,
          },
          { merge: true }
        );

        return { uid, id, operationType: 'deleted' };
      } else {
        throw new Error('User data not found');
      }
    } catch (error) {
      console.error('Error deleting location data:', error);
      throw error;
    }
  }

  static async markNotificationAsReadInStatusResolved(uid: string, notificationId: string) {
    try {
      const ref = this.pathRef(uid);
      const doc = await ref.get();
      if (doc.exists) {
        const existingData = doc.data();
        const existingNotifications = existingData?.notifications || [];

        // Filter out the notification to be marked as read
        const updatedNotifications = existingNotifications.map((notification: any) => {
          if (notification.id === notificationId) {
            return { ...notification, read: true };
          }
          return notification;
        });

        await ref.set(
          {
            notifications: updatedNotifications,
          },
          { merge: true }
        );

        return { uid, notificationId, operationType: 'updated' };
      } else {
        throw new Error('User data not found');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markNotificationAsDeleted(uid: string, notificationId: string) {
    try {
      const ref = this.pathRef(uid);
      const doc = await ref.get();
      if (doc.exists) {
        const existingData = doc.data();
        const existingNotifications = existingData?.notifications || [];

        const deletedNotification = existingNotifications.filter(
          (notification: any) => notification.id !== notificationId
        );

        await ref.set(
          {
            notifications: deletedNotification,
          },
          { merge: true }
        );

        return { uid, notificationId, operationType: 'deleted' };
      } else {
        throw new Error('User data not found');
      }
    } catch (error) {
      console.error('Error marking notification as deleted:', error);
      throw error;
    }
  }
}
