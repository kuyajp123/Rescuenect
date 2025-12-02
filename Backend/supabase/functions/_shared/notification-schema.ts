// ============================================
// NOTIFICATION SCHEMA - Unified Structure
// ============================================

/**
 * Base notification interface - all notifications must implement this
 */
export interface BaseNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number; // Unix timestamp in milliseconds
  createdAt: string; // ISO string for human-readable date

  // User interaction tracking
  readBy?: string[]; // User IDs who have read the notification
  hiddenBy?: string[]; // User IDs who have hidden/deleted from their view

  // Location/barangay targeting
  location: string; // weather zone or specific barangay
  barangays?: string[]; // List of affected barangays

  // Audience targeting
  audience: 'admin' | 'users' | 'both';

  // Delivery tracking
  sentTo: number; // Number of recipients
  deliveryStatus?: {
    success: number;
    failure: number;
    errors?: string[];
  };

  // Type-specific data
  data?: WeatherNotificationData | EarthquakeNotificationData | AnnouncementNotificationData | Record<string, unknown>;
}

/**
 * Notification types
 */
export type NotificationType =
  | 'weather'
  | 'earthquake'
  | 'announcement'
  | 'emergency'
  | 'system'
  | 'evacuation'
  | 'flood'
  | 'typhoon';

/**
 * Weather notification severity levels
 */
export type WeatherSeverity = 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';

/**
 * Weather notification data structure
 */
export interface WeatherNotificationData {
  // Weather type
  weatherType: 'current' | 'forecast_3h' | 'forecast_tomorrow';

  // Severity and category
  severity: WeatherSeverity;
  category:
    | 'Heat'
    | 'Rain'
    | 'Wind'
    | 'Visibility'
    | 'UV'
    | 'Storm'
    | 'Flood'
    | 'Clear'
    | 'Cloudy'
    | 'Tropical'
    | 'Combined';

  // Weather metrics
  temperature?: number;
  temperatureApparent?: number;
  humidity?: number;
  rainIntensity?: number;
  rainAccumulation?: number;
  windSpeed?: number;
  windGust?: number;
  windDirection?: number;
  uvIndex?: number;
  visibility?: number;
  precipitationProbability?: number;
  weatherCode?: number;

  // Forecast specific
  forecastTime?: string; // ISO string for forecast time
  forecastHoursAhead?: number;

  // Alert priority (1-5, where 1 is highest)
  priority: number;

  // Source
  source: 'weather_api' | 'manual';
}

/**
 * Earthquake notification data structure
 */
export interface EarthquakeNotificationData {
  // USGS earthquake ID
  earthquakeId: string;

  // Magnitude and location
  magnitude: number;
  place: string;

  // Coordinates
  coordinates: {
    latitude: number;
    longitude: number;
    depth: number; // in kilometers
  };

  // Severity classification
  severity: 'micro' | 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';

  // Tsunami warning
  tsunamiWarning: boolean;

  // Priority (1-5, where 1 is highest)
  priority: 'critical' | 'high' | 'medium' | 'low';

  // External links
  usgsUrl?: string;
  phivolcsUrl?: string;

  // Source
  source: 'usgs' | 'phivolcs' | 'manual';

  // Distance from Naic (optional)
  distanceFromNaic?: number; // in kilometers
}

/**
 * Announcement notification data structure
 */
export interface AnnouncementNotificationData {
  // Announcement details
  category: 'general' | 'event' | 'update' | 'maintenance' | 'alert';

  // Optional expiration
  expiresAt?: string; // ISO string

  // Priority
  priority: 'high' | 'medium' | 'low';

  // Rich content
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;

  // Source
  source: 'admin' | 'system';

  // Additional metadata
  metadata?: Record<string, unknown>;
}

/**
 * Strongly-typed notification union
 */
export type Notification =
  | (BaseNotification & { type: 'weather'; data: WeatherNotificationData })
  | (BaseNotification & { type: 'earthquake'; data: EarthquakeNotificationData })
  | (BaseNotification & { type: 'announcement'; data: AnnouncementNotificationData })
  | (BaseNotification & {
      type: 'emergency' | 'system' | 'evacuation' | 'flood' | 'typhoon';
      data?: Record<string, unknown>;
    });

/**
 * Notification filter options for querying
 */
export interface NotificationQueryFilter {
  type?: NotificationType | NotificationType[];
  location?: string | string[];
  barangay?: string;
  audience?: 'admin' | 'users' | 'both';
  severity?: WeatherSeverity | WeatherSeverity[];
  startTime?: number; // Unix timestamp
  endTime?: number; // Unix timestamp
  limit?: number;
  userId?: string; // Filter by readBy or hiddenBy
  onlyUnread?: boolean; // Show only unread for specific user
  excludeHidden?: boolean; // Exclude hidden notifications for specific user
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  total: number;
  byType: Record<NotificationType, number>;
  byLocation: Record<string, number>;
  bySeverity?: Record<WeatherSeverity, number>;
  unreadCount?: number;
  timeRange: {
    start: string;
    end: string;
  };
}

/**
 * Helper function to create a notification ID
 */
export function generateNotificationId(type: NotificationType, timestamp: number, location: string): string {
  // Format: weather_central_naic_1701513600000
  return `${type}_${location}_${timestamp}`;
}

/**
 * Helper function to validate notification data
 */
export function validateNotification(notification: Partial<Notification>): notification is Notification {
  return !!(
    notification.type &&
    notification.title &&
    notification.message &&
    notification.timestamp &&
    notification.location &&
    notification.audience &&
    notification.sentTo !== undefined
  );
}

/**
 * Helper function to check if user has read notification
 */
export function hasUserRead(notification: BaseNotification, userId: string): boolean {
  return notification.readBy?.includes(userId) ?? false;
}

/**
 * Helper function to check if user has hidden notification
 */
export function hasUserHidden(notification: BaseNotification, userId: string): boolean {
  return notification.hiddenBy?.includes(userId) ?? false;
}

/**
 * Helper function to get barangays from weather zone
 */
export function getBarangaysFromZone(zone: string): string[] {
  const zoneMap: Record<string, string[]> = {
    coastal_west: [
      'labac',
      'mabolo',
      'bancaan',
      'balsahan',
      'bagong karsada',
      'sapa',
      'bucana sasahan',
      'capt c. nazareno',
      'gomez-zamora',
      'kanluran',
      'humbac',
    ],
    coastal_east: [
      'bucana malaki',
      'ibayo estacion',
      'ibayo silangan',
      'latoria',
      'munting mapino',
      'timalan balsahan',
      'timalan concepcion',
    ],
    central_naic: ['muzon', 'malainem bago', 'santulan', 'calubcob', 'makina', 'san roque'],
    sabang: ['sabang'],
    farm_area: ['molino', 'halang', 'palangue 1'],
    naic_boundary: ['malainem luma', 'palangue 2 & 3'],
  };

  return zoneMap[zone] || [];
}

/**
 * Convert old notification format to new schema
 */
export function convertLegacyNotification(
  oldNotification: {
    title: string;
    body: string;
    type: string;
    level?: string;
    category?: string;
    metadata?: Record<string, unknown>;
    data?: Record<string, unknown>;
    sentTo: number;
    timestamp: Date;
  },
  location: string,
  audience: 'admin' | 'users' | 'both'
): BaseNotification {
  const timestamp = oldNotification.timestamp.getTime();
  const id = generateNotificationId(oldNotification.type as NotificationType, timestamp, location);

  return {
    id,
    type: oldNotification.type as NotificationType,
    title: oldNotification.title,
    message: oldNotification.body,
    timestamp,
    createdAt: oldNotification.timestamp.toISOString(),
    location,
    barangays: getBarangaysFromZone(location),
    audience,
    sentTo: oldNotification.sentTo,
    data: oldNotification.data,
  };
}
