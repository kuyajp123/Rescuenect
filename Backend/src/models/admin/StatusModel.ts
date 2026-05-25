import { db } from '@/db/firestoreConfig';
import { VersionHistoryItem } from '@/types/types';
import { getEffectiveClientId } from '@/utils/adminScope';
import { Timestamp } from 'firebase-admin/firestore';

export class StatusModel {
  private static getTimestamp(t: any): number {
    if (!t) return 0;
    if (typeof t === 'number') return t;
    if (typeof t === 'string') {
      const parsed = new Date(t).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (t instanceof Date) return t.getTime();
    if (typeof t.toMillis === 'function') return t.toMillis();
    if (typeof t.toDate === 'function') return t.toDate().getTime();

    const seconds = t.seconds ?? t._seconds;
    if (seconds !== undefined && seconds !== null) {
      const nanoseconds = t.nanoseconds ?? t._nanoseconds ?? 0;
      return seconds * 1000 + Math.floor(nanoseconds / 1000000);
    }

    const parsed = new Date(t).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private static getStatusPriority(statusType?: string): number {
    switch (statusType) {
      case 'current':
        return 4;
      case 'resolved':
        return 3;
      case 'deleted':
        return 2;
      case 'history':
        return 1;
      default:
        return 0;
    }
  }

  private static getActivityTimestamp(status: any): number {
    return Math.max(
      this.getTimestamp(status.updatedAt),
      this.getTimestamp(status.resolvedAt),
      this.getTimestamp(status.deletedAt),
      this.getTimestamp(status.createdAt)
    );
  }

  private static getVersionNumber(status: any): number {
    const versionId = String(status.versionId || status.id || '');
    const match = versionId.match(/-v(\d+)$/);
    return match ? Number(match[1]) : 0;
  }

  private static normalizeStatusDoc(doc: any) {
    const data = doc.data();
    const userId = data.uid || doc.ref?.parent?.parent?.id || '';
    const parentId = data.parentId || doc.id;

    return {
      id: doc.id,
      ...data,
      uid: userId,
      parentId,
      versionId: data.versionId || doc.id,
    };
  }

  private static getStatusGroupKey(doc: any, status: any): string {
    const userId = status.uid || doc.ref?.parent?.parent?.id || 'unknown-user';
    return `${userId}:${status.parentId || doc.id}`;
  }

  private static shouldReplaceStatus(existing: any, next: any): boolean {
    const existingPriority = this.getStatusPriority(existing.statusType);
    const nextPriority = this.getStatusPriority(next.statusType);

    if (nextPriority !== existingPriority) {
      return nextPriority > existingPriority;
    }

    const existingActivity = this.getActivityTimestamp(existing);
    const nextActivity = this.getActivityTimestamp(next);

    if (nextActivity !== existingActivity) {
      return nextActivity > existingActivity;
    }

    return this.getVersionNumber(next) > this.getVersionNumber(existing);
  }

  private static matchesClientScope(status: any, clientId?: string): boolean {
    return !clientId || getEffectiveClientId(status) === clientId;
  }

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

  public static async getVersions(userId: string, parentId: string, clientId?: string) {
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

        if (this.matchesClientScope(versionItem, clientId)) {
          versions.push(versionItem);
        }
      });

      return versions;
    } catch (error) {
      console.error('❌ Error in StatusModel.getVersions:', error);
      throw error;
    }
  }

  public static async getResidentStatuses(uid: string, clientId?: string) {
    try {
      const snapshot = await db.collection('status').doc(uid).collection('statuses').orderBy('createdAt', 'desc').get();

      if (snapshot.empty) {
        return [];
      }

      const statusMap = new Map<string, any>();
      snapshot.docs.forEach(doc => {
        const data = this.normalizeStatusDoc(doc);
        const parentId = data.parentId;

        if (!this.matchesClientScope(data, clientId)) {
          return;
        }

        if (!statusMap.has(parentId)) {
          statusMap.set(parentId, data);
        }
      });

      return Array.from(statusMap.values()).sort((a, b) => {
        return this.getActivityTimestamp(b) - this.getActivityTimestamp(a);
      });
    } catch (error) {
      console.error('âŒ Error in StatusModel.getResidentStatuses:', error);
      throw error;
    }
  }

  public static async getAllLatestStatuses(clientId?: string) {
    try {
      // Use collectionGroup to get all statuses from all users
      const allStatusesSnapshot = await db.collectionGroup('statuses').orderBy('createdAt', 'desc').get();

      if (allStatusesSnapshot.empty) {
        console.log('⚠️ No statuses found in any user collection');
        return [];
      }

      // Group by user + parentId so different residents never collapse into one row.
      const statusMap = new Map();

      allStatusesSnapshot.docs.forEach(doc => {
        const data = this.normalizeStatusDoc(doc);
        const groupKey = this.getStatusGroupKey(doc, data);

        const existing = statusMap.get(groupKey);

        if (!existing) {
          statusMap.set(groupKey, data);
        } else if (this.shouldReplaceStatus(existing, data)) {
          statusMap.set(groupKey, data);
        }
      });

      // Convert to array and sort by the latest meaningful lifecycle time.
      const allLatestStatuses = Array.from(statusMap.values())
        .filter(status => this.matchesClientScope(status, clientId))
        .sort((a, b) => {
          return this.getActivityTimestamp(b) - this.getActivityTimestamp(a);
        });

      return allLatestStatuses;
    } catch (error) {
      console.error('❌ Error in StatusModel.getAllLatestStatuses:', error);
      throw error;
    }
  }

  public static async getStatusHistory(clientId?: string) {
    try {
      // Use collectionGroup to get all statuses from all users
      const allStatusesSnapshot = await db.collectionGroup('statuses').orderBy('createdAt', 'desc').get();

      if (allStatusesSnapshot.empty) {
        console.log('⚠️ No statuses found in any user collection');
        return [];
      }

      // Group by user + parentId and prefer the active/latest lifecycle state.
      const latestStatusMap = new Map();

      allStatusesSnapshot.docs.forEach(doc => {
        const data = this.normalizeStatusDoc(doc);
        const groupKey = this.getStatusGroupKey(doc, data);
        const existing = latestStatusMap.get(groupKey);

        if (!existing || this.shouldReplaceStatus(existing, data)) {
          latestStatusMap.set(groupKey, data);
        }
      });

      // Convert to array and sort by the latest meaningful lifecycle time.
      const latestStatuses = Array.from(latestStatusMap.values())
        .filter(status => this.matchesClientScope(status, clientId))
        .sort((a, b) => {
          return this.getActivityTimestamp(b) - this.getActivityTimestamp(a);
        });

      return latestStatuses;
    } catch (error) {
      console.error('❌ Error in StatusModel.getStatusHistory:', error);
      throw error;
    }
  }

  public static async resolveStatus(
    uid: string,
    versionId: string,
    resolvedNote: string,
    resolvedBy: { name: string },
    clientId?: string
  ) {
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

      if (!this.matchesClientScope(data, clientId)) {
        console.error('❌ Status is outside the admin client scope');
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
          resolvedBy: resolvedBy,
        },
        { merge: true }
      );

      // Send notification to the user using the notification service
      const { IndividualNotificationService } = await import('@/services/status/individualNotification');
      try {
        await IndividualNotificationService.sendStatusResolvedNotification(uid, versionId, resolvedNote);
      } catch (notificationError) {
        // Log but don't throw - notification failure shouldn't fail the status resolution
        console.error('⚠️ Notification failed but status was resolved successfully:', notificationError);
      }
    } catch (error) {
      console.error('❌ Error in StatusModel.resolveStatus:', error);
      throw error;
    }
  }
}
