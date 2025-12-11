import { admin, db } from '@/db/firestoreConfig';

export class IndividualNotificationService {
  private static async getUserDoc(uid: string) {
    return db.collection('users').doc(uid).get();
  }

  /**
   * Send FCM notification to all user devices
   */
  private static async sendToAllDevices(fcmTokens: string[], notification: any, data: any) {
    if (!fcmTokens || fcmTokens.length === 0) {
      console.log('⚠️ No FCM tokens found for user');
      return;
    }

    const invalidTokens: string[] = [];
    let successCount = 0;

    // Send to all devices
    for (const token of fcmTokens) {
      try {
        await admin.messaging().send({
          token,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data,
        });
        successCount++;
      } catch (error: any) {
        console.error(`❌ Failed to send to token ${token.substring(0, 10)}...`, error.message);

        // Track invalid tokens for cleanup
        if (error.errorInfo?.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(token);
        }
      }
    }

    console.log(`✅ Notifications sent to ${successCount}/${fcmTokens.length} devices`);

    return invalidTokens;
  }

  public static async sendStatusResolvedNotification(uid: string, versionId: string, resolvedNote?: string) {
    try {
      const userDoc = await this.getUserDoc(uid);
      if (!userDoc.exists) {
        throw new Error(`User with uid ${uid} does not exist.`);
      }

      const userData = userDoc.data();
      const fcmTokens = userData?.fcmTokens || [];

      const notificationId = db.collection('notifications').doc().id;

      const notification = {
        id: notificationId,
        title: 'Status Resolved',
        body: `Your status has been marked as resolved. ${resolvedNote ? 'Note: ' + resolvedNote : ''}`,
        type: 'status_resolved',
        statusId: versionId,
        timestamp: Date.now(),
        read: false,
      };

      // Store notification in user's document
      await db
        .collection('users')
        .doc(uid)
        .set(
          {
            notifications: admin.firestore.FieldValue.arrayUnion(notification),
          },
          { merge: true }
        );

      console.log('✅ Notification stored in user document');

      // Send FCM notification to all devices
      const invalidTokens = await this.sendToAllDevices(fcmTokens, notification, {
        type: notification.type,
        statusId: notification.statusId,
        notificationId: notification.id,
      });

      // Clean up invalid tokens
      if (invalidTokens && invalidTokens.length > 0) {
        try {
          for (const token of invalidTokens) {
            await db
              .collection('users')
              .doc(uid)
              .update({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
              });
          }
          console.log(`ℹ️ Removed ${invalidTokens.length} invalid FCM tokens for user:`, uid);
        } catch (updateError) {
          console.error('❌ Failed to remove invalid FCM tokens:', updateError);
        }
      }

      return notification;
    } catch (notificationError: any) {
      console.error('❌ Failed to send notification:', notificationError);
      throw notificationError;
    }
  }

  public static async sendAnnouncementNotification(uid: string, title: string, body: string, announcementId: string) {
    try {
      const userDoc = await this.getUserDoc(uid);
      if (!userDoc.exists) {
        throw new Error(`User with uid ${uid} does not exist.`);
      }

      const userData = userDoc.data();
      const fcmTokens = userData?.fcmTokens || [];

      const notificationId = db.collection('notifications').doc().id;

      const notification = {
        id: notificationId,
        title: title,
        body: body,
        type: 'announcement',
        announcementId: announcementId,
        timestamp: Date.now(),
        read: false,
      };

      // Store notification in user's document
      await db
        .collection('users')
        .doc(uid)
        .set(
          {
            notifications: admin.firestore.FieldValue.arrayUnion(notification),
          },
          { merge: true }
        );

      console.log('✅ Notification stored in user document');

      // Send FCM notification to all devices
      const invalidTokens = await this.sendToAllDevices(fcmTokens, notification, {
        type: notification.type,
        announcementId: notification.announcementId,
        notificationId: notification.id,
      });

      // Clean up invalid tokens
      if (invalidTokens && invalidTokens.length > 0) {
        try {
          for (const token of invalidTokens) {
            await db
              .collection('users')
              .doc(uid)
              .update({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
              });
          }
          console.log(`ℹ️ Removed ${invalidTokens.length} invalid FCM tokens for user:`, uid);
        } catch (updateError) {
          console.error('❌ Failed to remove invalid FCM tokens:', updateError);
        }
      }

      return notification;
    } catch (notificationError: any) {
      console.error('❌ Failed to send notification:', notificationError);
      throw notificationError;
    }
  }
}
