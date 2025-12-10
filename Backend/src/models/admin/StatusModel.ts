import { admin, db } from '@/db/firestoreConfig';
import { VersionHistoryItem } from '@/types/types';
import { Timestamp } from 'firebase-admin/firestore';

export class StatusModel {
  private static pathRef(userId: string, parentId: string) {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error(`Invalid userId provided: ${userId}`);
    }

    if (!parentId || typeof parentId !== 'string' || parentId.trim() === '') {
      throw new Error(`Invalid parentId provided: ${parentId}`);
    }

    return db
      .collection('status')
      .doc(userId)
      .collection('statuses')
      .where('parentId', '==', parentId)
      .orderBy('createdAt', 'desc');
  }

  public static async getVersions(userId: string, parentId: string) {
    try {
      const query = this.pathRef(userId, parentId);

      const snapshot = await query.get();

      const versions: VersionHistoryItem[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();

        // Convert Firebase Timestamps to the format expected by frontend helpers
        const processedData = { ...data };

        // Convert createdAt timestamp (_seconds → seconds)
        if (data.createdAt && data.createdAt._seconds) {
          processedData.createdAt = {
            seconds: data.createdAt._seconds,
            nanoseconds: data.createdAt._nanoseconds || 0,
          };
        }

        // Convert updatedAt timestamp if it exists
        if (data.updatedAt && data.updatedAt._seconds) {
          processedData.updatedAt = {
            seconds: data.updatedAt._seconds,
            nanoseconds: data.updatedAt._nanoseconds || 0,
          };
        }

        const versionItem: VersionHistoryItem = {
          ...processedData,
          versionId: doc.id,
          uid: data.uid || userId, // Ensure uid is present
        } as VersionHistoryItem;

        versions.push(versionItem);
      });

      return versions;
    } catch (error) {
      console.error('❌ Error in StatusModel.getVersions:', error);
      throw error;
    }
  }

  public static async getAllLatestStatuses() {
    try {
      // Use collectionGroup to get all statuses from all users
      const allStatusesSnapshot = await db.collectionGroup('statuses').orderBy('createdAt', 'desc').get();

      if (allStatusesSnapshot.empty) {
        console.log('⚠️ No statuses found in any user collection');
        return [];
      }

      // Group by parentId and get only the latest version of each
      const statusMap = new Map();
      let processedCount = 0;

      allStatusesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const parentId = data.parentId;

        // Get the current entry for this parentId (if any)
        const existing = statusMap.get(parentId);

        // Priority logic:
        // 1. Always prefer 'current' status over others
        // 2. If both are current or neither is current, prefer the one with latest createdAt
        if (!existing) {
          // First time seeing this parentId
          statusMap.set(parentId, { id: doc.id, ...data });
          processedCount++;
        } else {
          const existingTime = existing.createdAt?._seconds || 0;
          const currentTime = data.createdAt?._seconds || 0;

          // Replace if:
          // - New status is 'current' and existing is not
          // - Both have same statusType but new one is more recent
          const shouldReplace =
            (data.statusType === 'current' && existing.statusType !== 'current') ||
            (data.statusType === existing.statusType && currentTime > existingTime);

          if (shouldReplace) {
            statusMap.set(parentId, { id: doc.id, ...data });
          }
        }
      });

      // Convert to array and sort by createdAt descending (newest first)
      const allLatestStatuses = Array.from(statusMap.values()).sort((a, b) => {
        const aTime = a.createdAt?._seconds || 0;
        const bTime = b.createdAt?._seconds || 0;
        return bTime - aTime;
      });

      return allLatestStatuses;
    } catch (error) {
      console.error('❌ Error in StatusModel.getAllLatestStatuses:', error);
      throw error;
    }
  }

  public static async resolveStatus(uid: string, versionId: string, resolvedNote: string) {
    try {
      const docRef = db.collection('status').doc(uid).collection('statuses').doc(versionId);
      const doc = await docRef.get();

      if (!doc.exists) {
        console.error('❌ Status not found');
        throw new Error('Status not found');
      }

      const data = doc.data();

      if (!data) {
        console.error('❌ Status not found');
        throw new Error('Status not found');
      }

      if (data.statusType !== 'current') {
        console.error('❌ Status is not current');
        throw new Error('Status is not current');
      }

      // Update the status to resolved
      await docRef.set(
        {
          statusType: 'resolved',
          resolvedNote: resolvedNote,
          resolvedAt: Timestamp.fromDate(new Date()),
        },
        { merge: true }
      );

      console.log('✅ Status resolved successfully');

      // Send notification to the user
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const fcmToken = userData?.fcmToken;

          const notificationId = db.collection('notifications').doc().id;

          const notificationData = {
            id: notificationId,
            title: 'Status Resolved',
            body: `Your status has been marked as resolved. Note: ${resolvedNote}`,
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
                notifications: admin.firestore.FieldValue.arrayUnion(notificationData),
              },
              { merge: true }
            );

          if (fcmToken) {
            await admin.messaging().send({
              token: fcmToken,
              notification: {
                title: notificationData.title,
                body: notificationData.body,
              },
              data: {
                type: notificationData.type,
                statusId: notificationData.statusId,
              },
            });
            console.log('✅ Notification sent to user');
          } else {
            console.log('⚠️ No FCM token found for user');
          }
        }
      } catch (notificationError: any) {
        console.error('❌ Failed to send notification:', notificationError);
        // data loss prevention: if token is invalid, remove it to prevent future errors
        if (notificationError.errorInfo?.code === 'messaging/registration-token-not-registered') {
          try {
            await db.collection('users').doc(uid).update({
              fcmToken: '', // or use FieldValue.delete() if preferred, but string is safer for typing
            });
            console.log('ℹ️ Invalid FCM token removed for user:', uid);
          } catch (updateError) {
            console.error('❌ Failed to remove invalid FCM token:', updateError);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in StatusModel.resolveStatus:', error);
      throw error;
    }
  }
}
