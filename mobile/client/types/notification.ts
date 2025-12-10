// ============================================
// NOTIFICATION TYPES - Mobile Client
// ============================================

/**
 * Base notification interface - matches backend schema
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
  location?: string; // weather zone or specific barangay
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
  | 'typhoon'
  | 'status_resolved';

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

  data?: any;

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

  // Impact radii for visualization
  impact_radii?: {
    felt_radius_km: number;
    moderate_shaking_radius_km: number;
    strong_shaking_radius_km: number;
  };
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
  priority: number; // 1-5, where 1 is highest

  // Source
  source: 'admin' | 'system';
}
