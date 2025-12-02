// ============================================
// NOTIFICATION SERVICE - CRUD Operations
// ============================================

import type { Firestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin/firestore';
import {
  AnnouncementNotificationData,
  BaseNotification,
  EarthquakeNotificationData,
  generateNotificationId,
  getBarangaysFromZone,
  Notification,
  NotificationQueryFilter,
  NotificationStats,
  NotificationType,
  WeatherNotificationData,
} from './notification-schema.ts';

/**
 * Notification Service for managing all notification types
 */
export class NotificationService {
  private db: Firestore;
  private collectionName = 'notifications';

  constructor(firestoreInstance: Firestore) {
    this.db = firestoreInstance;
  }

  /**
   * Create a weather notification
   */
  async createWeatherNotification(params: {
    title: string;
    message: string;
    location: string;
    audience: 'admin' | 'users' | 'both';
    sentTo: number;
    weatherData: WeatherNotificationData;
    deliveryStatus?: { success: number; failure: number; errors?: string[] };
  }): Promise<string> {
    const timestamp = Date.now();
    const notificationId = generateNotificationId('weather', timestamp, params.location);

    const notification: Omit<Notification, 'id'> & { id: string } = {
      id: notificationId,
      type: 'weather',
      title: params.title,
      message: params.message,
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
      location: params.location,
      barangays: getBarangaysFromZone(params.location),
      audience: params.audience,
      sentTo: params.sentTo,
      deliveryStatus: params.deliveryStatus,
      data: params.weatherData,
    };

    await this.db.collection(this.collectionName).doc(notificationId).set(notification);
    console.log(`✅ Weather notification created: ${notificationId}`);
    return notificationId;
  }

  /**
   * Create an earthquake notification
   */
  async createEarthquakeNotification(params: {
    title: string;
    message: string;
    location: string;
    audience: 'admin' | 'users' | 'both';
    sentTo: number;
    earthquakeData: EarthquakeNotificationData;
    deliveryStatus?: { success: number; failure: number; errors?: string[] };
  }): Promise<string> {
    const timestamp = Date.now();
    const notificationId = generateNotificationId('earthquake', timestamp, params.location);

    const notification: Omit<Notification, 'id'> & { id: string } = {
      id: notificationId,
      type: 'earthquake',
      title: params.title,
      message: params.message,
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
      location: params.location,
      barangays: getBarangaysFromZone(params.location),
      audience: params.audience,
      sentTo: params.sentTo,
      deliveryStatus: params.deliveryStatus,
      data: params.earthquakeData,
    };

    await this.db.collection(this.collectionName).doc(notificationId).set(notification);
    console.log(`✅ Earthquake notification created: ${notificationId}`);
    return notificationId;
  }

  /**
   * Create an announcement notification
   */
  async createAnnouncementNotification(params: {
    title: string;
    message: string;
    location: string;
    audience: 'admin' | 'users' | 'both';
    sentTo: number;
    announcementData: AnnouncementNotificationData;
    deliveryStatus?: { success: number; failure: number; errors?: string[] };
  }): Promise<string> {
    const timestamp = Date.now();
    const notificationId = generateNotificationId('announcement', timestamp, params.location);

    const notification: Omit<Notification, 'id'> & { id: string } = {
      id: notificationId,
      type: 'announcement',
      title: params.title,
      message: params.message,
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
      location: params.location,
      barangays: getBarangaysFromZone(params.location),
      audience: params.audience,
      sentTo: params.sentTo,
      deliveryStatus: params.deliveryStatus,
      data: params.announcementData,
    };

    await this.db.collection(this.collectionName).doc(notificationId).set(notification);
    console.log(`✅ Announcement notification created: ${notificationId}`);
    return notificationId;
  }

  /**
   * Create a generic notification
   */
  async createNotification(params: {
    type: NotificationType;
    title: string;
    message: string;
    location: string;
    audience: 'admin' | 'users' | 'both';
    sentTo: number;
    data?: Record<string, unknown>;
    deliveryStatus?: { success: number; failure: number; errors?: string[] };
  }): Promise<string> {
    const timestamp = Date.now();
    const notificationId = generateNotificationId(params.type, timestamp, params.location);

    const notification: BaseNotification = {
      id: notificationId,
      type: params.type,
      title: params.title,
      message: params.message,
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
      location: params.location,
      barangays: getBarangaysFromZone(params.location),
      audience: params.audience,
      sentTo: params.sentTo,
      deliveryStatus: params.deliveryStatus,
      data: params.data,
    };

    await this.db.collection(this.collectionName).doc(notificationId).set(notification);
    console.log(`✅ Notification created: ${notificationId}`);
    return notificationId;
  }

  /**
   * Query notifications with filters
   */
  async queryNotifications(filter: NotificationQueryFilter = {}): Promise<Notification[]> {
    let query = this.db.collection(this.collectionName) as any;

    // Apply filters
    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      query = query.where('type', 'in', types);
    }

    if (filter.location) {
      const locations = Array.isArray(filter.location) ? filter.location : [filter.location];
      query = query.where('location', 'in', locations);
    }

    if (filter.audience) {
      query = query.where('audience', '==', filter.audience);
    }

    if (filter.startTime) {
      query = query.where('timestamp', '>=', filter.startTime);
    }

    if (filter.endTime) {
      query = query.where('timestamp', '<=', filter.endTime);
    }

    // Order by timestamp descending (most recent first)
    query = query.orderBy('timestamp', 'desc');

    // Apply limit
    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    const snapshot = await query.get();
    let notifications: Notification[] = snapshot.docs.map((doc: any) => doc.data() as Notification);

    // Client-side filtering for complex conditions
    if (filter.barangay) {
      notifications = notifications.filter(n => n.barangays?.includes(filter.barangay!));
    }

    if (filter.userId) {
      if (filter.onlyUnread) {
        notifications = notifications.filter(n => !n.readBy?.includes(filter.userId!));
      }
      if (filter.excludeHidden) {
        notifications = notifications.filter(n => !n.hiddenBy?.includes(filter.userId!));
      }
    }

    if (filter.severity && notifications.length > 0) {
      const severities = Array.isArray(filter.severity) ? filter.severity : [filter.severity];
      notifications = notifications.filter(n => {
        if (n.type === 'weather' && n.data) {
          const weatherData = n.data as WeatherNotificationData;
          return severities.includes(weatherData.severity);
        }
        return false;
      });
    }

    return notifications;
  }

  /**
   * Get a single notification by ID
   */
  async getNotification(notificationId: string): Promise<Notification | null> {
    const doc = await this.db.collection(this.collectionName).doc(notificationId).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as Notification;
  }

  /**
   * Mark notification as read by user
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const docRef = this.db.collection(this.collectionName).doc(notificationId);

    await docRef.update({
      readBy: admin.FieldValue.arrayUnion(userId) as any,
    });

    console.log(`✅ Notification ${notificationId} marked as read by ${userId}`);
  }

  /**
   * Mark notification as hidden by user
   */
  async markAsHidden(notificationId: string, userId: string): Promise<void> {
    const docRef = this.db.collection(this.collectionName).doc(notificationId);

    await docRef.update({
      hiddenBy: admin.FieldValue.arrayUnion(userId) as any,
    });

    console.log(`✅ Notification ${notificationId} marked as hidden by ${userId}`);
  }

  /**
   * Mark notification as unread by user (remove from readBy)
   */
  async markAsUnread(notificationId: string, userId: string): Promise<void> {
    const docRef = this.db.collection(this.collectionName).doc(notificationId);

    await docRef.update({
      readBy: admin.FieldValue.arrayRemove(userId) as any,
    });

    console.log(`✅ Notification ${notificationId} marked as unread by ${userId}`);
  }

  /**
   * Unhide notification for user (remove from hiddenBy)
   */
  async unhideNotification(notificationId: string, userId: string): Promise<void> {
    const docRef = this.db.collection(this.collectionName).doc(notificationId);

    await docRef.update({
      hiddenBy: admin.FieldValue.arrayRemove(userId) as any,
    });

    console.log(`✅ Notification ${notificationId} unhidden for ${userId}`);
  }

  /**
   * Bulk mark as read for multiple notifications
   */
  async bulkMarkAsRead(notificationIds: string[], userId: string): Promise<void> {
    const batch = this.db.batch();

    for (const notificationId of notificationIds) {
      const docRef = this.db.collection(this.collectionName).doc(notificationId);
      batch.update(docRef, {
        readBy: admin.FieldValue.arrayUnion(userId) as any,
      });
    }

    await batch.commit();
    console.log(`✅ Marked ${notificationIds.length} notifications as read for ${userId}`);
  }

  /**
   * Delete a notification (admin only)
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(notificationId).delete();
    console.log(`✅ Notification ${notificationId} deleted`);
  }

  /**
   * Bulk delete notifications (admin only)
   */
  async bulkDeleteNotifications(notificationIds: string[]): Promise<void> {
    const batch = this.db.batch();

    for (const notificationId of notificationIds) {
      const docRef = this.db.collection(this.collectionName).doc(notificationId);
      batch.delete(docRef);
    }

    await batch.commit();
    console.log(`✅ Deleted ${notificationIds.length} notifications`);
  }

  /**
   * Get notification statistics
   */
  async getStats(filter: NotificationQueryFilter = {}): Promise<NotificationStats> {
    const notifications = await this.queryNotifications(filter);

    const stats: NotificationStats = {
      total: notifications.length,
      byType: {} as Record<NotificationType, number>,
      byLocation: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      unreadCount: 0,
      timeRange: {
        start: filter.startTime ? new Date(filter.startTime).toISOString() : new Date(0).toISOString(),
        end: filter.endTime ? new Date(filter.endTime).toISOString() : new Date().toISOString(),
      },
    };

    for (const notification of notifications) {
      // Count by type
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;

      // Count by location
      stats.byLocation[notification.location] = (stats.byLocation[notification.location] || 0) + 1;

      // Count by severity (for weather notifications)
      if (notification.type === 'weather' && notification.data) {
        const weatherData = notification.data as WeatherNotificationData;
        stats.bySeverity![weatherData.severity] = (stats.bySeverity![weatherData.severity] || 0) + 1;
      }

      // Count unread (if userId filter provided)
      if (filter.userId && !notification.readBy?.includes(filter.userId)) {
        stats.unreadCount!++;
      }
    }

    return stats;
  }

  /**
   * Clean up old notifications (older than specified days)
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    const snapshot = await this.db.collection(this.collectionName).where('timestamp', '<', cutoffTime).get();

    if (snapshot.empty) {
      console.log('No old notifications to clean up');
      return 0;
    }

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ Cleaned up ${snapshot.size} old notifications`);
    return snapshot.size;
  }

  /**
   * Get notifications for a specific barangay
   */
  async getNotificationsForBarangay(barangay: string, limit: number = 50): Promise<Notification[]> {
    const notifications = await this.queryNotifications({ limit: limit * 2 }); // Get more to filter
    return notifications.filter(n => n.barangays?.includes(barangay)).slice(0, limit);
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string, filter?: NotificationQueryFilter): Promise<number> {
    const notifications = await this.queryNotifications({
      ...filter,
      userId,
      onlyUnread: true,
      excludeHidden: true,
    });

    return notifications.length;
  }

  /**
   * Get recent critical notifications
   */
  async getRecentCriticalNotifications(hours: number = 24, limit: number = 10): Promise<Notification[]> {
    const startTime = Date.now() - hours * 60 * 60 * 1000;

    const notifications = await this.queryNotifications({
      startTime,
      limit,
    });

    // Filter for critical weather or high priority earthquakes
    return notifications.filter(n => {
      if (n.type === 'weather' && n.data) {
        const weatherData = n.data as WeatherNotificationData;
        return weatherData.severity === 'CRITICAL' || weatherData.severity === 'WARNING';
      }
      if (n.type === 'earthquake' && n.data) {
        const earthquakeData = n.data as EarthquakeNotificationData;
        return earthquakeData.priority === 'critical' || earthquakeData.priority === 'high';
      }
      return false;
    });
  }
}
