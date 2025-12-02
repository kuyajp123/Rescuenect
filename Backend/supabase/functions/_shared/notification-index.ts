// ============================================
// NOTIFICATION SYSTEM - Main Export
// ============================================
// Single entry point for the entire notification system

/**
 * Unified Notification System
 *
 * A comprehensive, strongly-typed notification system for managing
 * weather alerts, earthquake notifications, announcements, and more.
 *
 * @example
 * ```typescript
 * import { NotificationService, initializeFirebase } from './index.ts';
 *
 * const db = initializeFirebase();
 * const notificationService = new NotificationService(db);
 *
 * // Create a notification
 * await notificationService.createWeatherNotification({
 *   title: '🔥 Heat Warning',
 *   message: 'High temperature detected',
 *   location: 'central_naic',
 *   audience: 'both',
 *   sentTo: 150,
 *   weatherData: {
 *     weatherType: 'current',
 *     severity: 'WARNING',
 *     category: 'Heat',
 *     temperature: 38,
 *     priority: 2,
 *     source: 'weather_api'
 *   }
 * });
 *
 * // Query notifications
 * const notifications = await notificationService.queryNotifications({
 *   userId: 'user123',
 *   onlyUnread: true,
 *   limit: 50
 * });
 * ```
 *
 * @see {@link README_NOTIFICATIONS.md} for complete documentation
 * @see {@link NOTIFICATION_QUICKREF.md} for quick reference
 * @see {@link NOTIFICATION_MIGRATION_GUIDE.md} for migration guide
 * @see {@link notification-examples.ts} for usage examples
 */

// Export all types
export type {
  AnnouncementNotificationData,
  BaseNotification,
  EarthquakeNotificationData,
  Notification,
  NotificationQueryFilter,
  NotificationStats,
  NotificationType,
  WeatherNotificationData,
  WeatherSeverity,
} from './notification-schema.ts';

// Export utility functions
export {
  convertLegacyNotification,
  generateNotificationId,
  getBarangaysFromZone,
  hasUserHidden,
  hasUserRead,
  validateNotification,
} from './notification-schema.ts';

// Export service
export { NotificationService } from './notification-service.ts';
import type { NotificationService as NotificationServiceType } from './notification-service.ts';

// Export Firestore client functions
export {
  getUserTokens,
  getWeatherData,
  getWeatherForecastData,
  initializeFirebase,
  saveNotificationHistory,
} from './firestore-client.ts';

// Export FCM client functions
export { isValidFCMToken, sendEarthquakeNotification, sendFCMNotification } from './fcm-client.ts';

// Export constants
export const WEATHER_ZONES = [
  'coastal_west',
  'coastal_east',
  'central_naic',
  'sabang',
  'farm_area',
  'naic_boundary',
] as const;

export const NOTIFICATION_TYPES = [
  'weather',
  'earthquake',
  'announcement',
  'emergency',
  'system',
  'evacuation',
  'flood',
  'typhoon',
] as const;

export const WEATHER_SEVERITIES = ['CRITICAL', 'WARNING', 'ADVISORY', 'INFO'] as const;

export const EARTHQUAKE_PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;

export const ANNOUNCEMENT_CATEGORIES = ['general', 'event', 'update', 'maintenance', 'alert'] as const;

/**
 * Helper function to initialize the notification system
 *
 * @returns Initialized NotificationService instance
 *
 * @example
 * ```typescript
 * const notificationService = await initializeNotificationSystem();
 *
 * // Now ready to use
 * await notificationService.queryNotifications({ limit: 50 });
 * ```
 */
export async function initializeNotificationSystem(): Promise<NotificationServiceType> {
  const { initializeFirebase } = await import('./firestore-client.ts');
  const { NotificationService } = await import('./notification-service.ts');

  const db = initializeFirebase();
  return new NotificationService(db);
}

// Type guards for runtime type checking
import type {
  AnnouncementNotificationData,
  EarthquakeNotificationData,
  Notification,
  WeatherNotificationData,
} from './notification-schema.ts';

export function isWeatherNotification(notification: Notification): notification is Notification & {
  type: 'weather';
  data: WeatherNotificationData;
} {
  return notification.type === 'weather';
}

export function isEarthquakeNotification(notification: Notification): notification is Notification & {
  type: 'earthquake';
  data: EarthquakeNotificationData;
} {
  return notification.type === 'earthquake';
}

export function isAnnouncementNotification(notification: Notification): notification is Notification & {
  type: 'announcement';
  data: AnnouncementNotificationData;
} {
  return notification.type === 'announcement';
}

/**
 * Version info
 */
export const VERSION = '1.0.0';
export const SYSTEM_NAME = 'Unified Notification System';

/**
 * Documentation links
 */
export const DOCS = {
  readme: './README_NOTIFICATIONS.md',
  quickRef: './NOTIFICATION_QUICKREF.md',
  migration: './NOTIFICATION_MIGRATION_GUIDE.md',
  architecture: './NOTIFICATION_ARCHITECTURE.md',
  examples: './notification-examples.ts',
} as const;

// Default export
export default {
  initializeNotificationSystem,
  VERSION,
  SYSTEM_NAME,
  DOCS,
};
