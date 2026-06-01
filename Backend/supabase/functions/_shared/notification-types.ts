// ============================================
// NOTIFICATION SYSTEM - TYPE EXPORTS
// ============================================
// Central export file for all notification types
import { ACTIVE_WEATHER_LOCATION_KEYS } from './location-config.ts';

export type {
  // Announcement types
  AnnouncementNotificationData,
  // Core types
  BaseNotification,
  // Earthquake types
  EarthquakeNotificationData,
  Notification,
  // Query & stats types
  NotificationQueryFilter,
  NotificationStats,
  NotificationType,
  WeatherNotificationData,
  // Weather types
  WeatherSeverity,
} from './notification-schema.ts';

export {
  convertLegacyNotification,
  getBarangaysFromWeatherLocation,
  // Utility functions
  generateNotificationId,
  getBarangaysFromZone,
  hasUserHidden,
  hasUserRead,
  validateNotification,
} from './notification-schema.ts';

export { NotificationService } from './notification-service.ts';

// Re-export common constants
export const WEATHER_LOCATION_KEYS = ACTIVE_WEATHER_LOCATION_KEYS;
export const WEATHER_ZONES = WEATHER_LOCATION_KEYS;

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
