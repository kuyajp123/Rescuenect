import { db } from '@/db/firestoreConfig';
import { VersionHistoryItem } from '@/types/types';

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

        // If we haven't seen this parentId yet, store it (since we're ordered by createdAt desc, first is latest)
        if (!statusMap.has(parentId)) {
          statusMap.set(parentId, { id: doc.id, ...data });
          processedCount++;
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
      console.error('❌ Error in UnifiedModel.getAllLatestStatuses:', error);
      throw error;
    }
  }
}
