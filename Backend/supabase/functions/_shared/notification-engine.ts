import { sendFCMNotification } from './fcm-client.ts';
import { getUserTokens, getWeatherData } from './firestore-client.ts';
import {
  NotificationLevel,
  WeatherData,
  WeatherNotification,
  WeatherNotificationSystem,
} from './weather-notification-core.ts';

export interface NotificationConfig {
  level: NotificationLevel;
  maxNotificationsPerLocation: number;
  cooldownPeriod: number; // minutes
  targetAudience: 'admin' | 'users' | 'both';
}

export class NotificationProcessor {
  private weatherNotifier: WeatherNotificationSystem;
  private processedNotifications: Map<string, Date> = new Map();

  constructor() {
    this.weatherNotifier = new WeatherNotificationSystem();
  }

  /**
   * Process notifications for a specific severity level
   */
  async processNotificationsForLevel(
    config: NotificationConfig
  ): Promise<{ sent: number; skipped: number; errors: number }> {
    const results = { sent: 0, skipped: 0, errors: 0 };

    try {
      // Get latest weather data for all locations
      const locations = ['coastal_west', 'coastal_east', 'central_naic', 'sabang', 'farm_area', 'naic_boundary'];

      for (const location of locations) {
        try {
          // Get weather data based on notification level priority
          const dataType = this.getDataSourceForLevel(config.level);
          const weatherData = await getWeatherData(location, dataType);

          if (!weatherData) {
            console.log(`No ${dataType} weather data available for ${location}`);
            continue;
          }

          // Check weather conditions (type assertion - assume data matches WeatherData interface)
          const notifications = this.weatherNotifier.checkWeatherConditions(weatherData as unknown as WeatherData);

          // Filter by severity level
          const levelNotifications = notifications.filter(n => n.level === config.level);

          // Apply rate limiting and cooldown
          const notificationsToSend = this.applyRateLimiting(levelNotifications, location, config);

          // Send consolidated notifications to prevent multiple alerts for same weather event
          if (notificationsToSend.length > 0) {
            try {
              const consolidatedNotification = this.consolidateNotifications(notificationsToSend, location);
              await this.sendNotificationToUsers(consolidatedNotification, location, config.targetAudience);
              results.sent++;

              // Track sent notifications for rate limiting
              this.trackSentNotification(consolidatedNotification, location);
            } catch (error) {
              console.error(`Failed to send notification for ${location}:`, error);
              results.errors++;
            }
          }

          if (notificationsToSend.length === 0 && levelNotifications.length > 0) {
            results.skipped += levelNotifications.length;
          }
        } catch (error) {
          console.error(`Error processing location ${location}:`, error);
          results.errors++;
        }

        // Rate limiting between locations
        await this.delay(500);
      }
    } catch (error) {
      console.error('Fatal error in notification processing:', error);
      results.errors++;
    }

    return results;
  }

  /**
   * Apply rate limiting and cooldown periods
   */
  private applyRateLimiting(
    notifications: WeatherNotification[],
    location: string,
    config: NotificationConfig
  ): WeatherNotification[] {
    const now = new Date();
    const filtered = [];

    for (const notification of notifications) {
      const key = `${location}-${notification.category}-${notification.level}`;
      const lastSent = this.processedNotifications.get(key);

      // Check cooldown period
      if (lastSent) {
        const timeSinceLastSent = now.getTime() - lastSent.getTime();
        const cooldownMs = config.cooldownPeriod * 60 * 1000;

        if (timeSinceLastSent < cooldownMs) {
          console.log(`Notification ${key} is in cooldown period`);
          continue;
        }
      }

      filtered.push(notification);

      // Respect max notifications per location
      if (filtered.length >= config.maxNotificationsPerLocation) {
        break;
      }
    }

    return filtered;
  }

  /**
   * Send notification to appropriate users
   */
  private async sendNotificationToUsers(
    notification: WeatherNotification,
    location: string,
    targetAudience: 'admin' | 'users' | 'both'
  ): Promise<void> {
    // Get user tokens and barangays based on target audience and weather zone
    const { tokens: userTokens, barangays } = await getUserTokens(targetAudience, location);

    if (userTokens.length === 0) {
      console.log(`No users to notify for ${targetAudience} audience in ${location}`);
      return;
    }

    // Use actual barangay names instead of generic zone name
    const locationDisplayName =
      barangays.length > 0 ? this.formatBarangayNames(barangays) : this.getLocationDisplayName(location);

    // Enhance notification with specific barangay context
    // Convert all data values to strings for FCM compatibility
    const stringifiedData: Record<string, string> = {};
    if (notification.data) {
      for (const [key, value] of Object.entries(notification.data)) {
        stringifiedData[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
      }
    }

    const enhancedNotification = {
      title: `${notification.title} - ${locationDisplayName}`,
      body: notification.message,
      data: {
        level: notification.level,
        category: notification.category,
        location: location,
        barangays: barangays.join(','), // Include specific barangays in data
        timestamp: notification.timestamp.toISOString(),
        ...stringifiedData,
      },
    };

    // Send to all user tokens
    await sendFCMNotification(enhancedNotification, userTokens);
  }

  /**
   * Track sent notifications for rate limiting
   */
  private trackSentNotification(notification: WeatherNotification, location: string): void {
    const key = `${location}-${notification.category}-${notification.level}`;
    this.processedNotifications.set(key, new Date());
  }

  /**
   * Get human-readable location name (fallback for zone names)
   */
  private getLocationDisplayName(locationKey: string): string {
    const locationNames = {
      coastal_west: 'Coastal West',
      coastal_east: 'Coastal East',
      central_naic: 'Central Naic',
      sabang: 'Sabang',
      farm_area: 'Farm Area',
      naic_boundary: 'Naic Boundary',
    };
    return locationNames[locationKey as keyof typeof locationNames] || locationKey;
  }

  /**
   * Format barangay names for display in notification titles
   */
  private formatBarangayNames(barangays: string[]): string {
    if (barangays.length === 0) return '';

    // Capitalize first letter of each barangay
    const formatted = barangays.map(barangay =>
      barangay
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    );

    if (formatted.length === 1) {
      return formatted[0];
    } else if (formatted.length === 2) {
      return `${formatted[0]} & ${formatted[1]}`;
    } else if (formatted.length <= 4) {
      return `${formatted.slice(0, -1).join(', ')} & ${formatted[formatted.length - 1]}`;
    } else {
      // Too many barangays, show first few + count
      return `${formatted.slice(0, 2).join(', ')} & ${formatted.length - 2} other areas`;
    }
  }

  /**
   * Get appropriate data source based on notification level to prevent overlap
   */
  private getDataSourceForLevel(level: NotificationLevel): 'realtime' | 'hourly' | 'daily' {
    switch (level) {
      case 'CRITICAL':
      case 'WARNING':
        return 'realtime'; // Most urgent alerts use latest realtime data
      case 'ADVISORY':
        return 'hourly'; // Medium-term conditions use hourly trends
      case 'INFO':
        return 'daily'; // Long-term forecasts use daily data
      default:
        return 'realtime';
    }
  }

  /**
   * Consolidate multiple notifications for same weather event to prevent spam
   */
  private consolidateNotifications(notifications: WeatherNotification[], _location: string): WeatherNotification {
    if (notifications.length === 1) {
      return notifications[0];
    }

    // Sort by priority (1 = highest)
    const sortedNotifications = notifications.sort((a, b) => a.priority - b.priority);
    const primary = sortedNotifications[0];

    // Combine multiple conditions into one comprehensive alert
    const categories = [...new Set(notifications.map(n => n.category))];
    const conditions = notifications.map(n => n.message.split('.')[0]).join(', ');

    return {
      level: primary.level,
      category: categories.length > 1 ? 'Combined' : primary.category,
      title: categories.length > 1 ? `🚨 MULTIPLE WEATHER HAZARDS` : primary.title,
      message:
        categories.length > 1
          ? `Multiple weather hazards detected: ${conditions}. Take immediate precautions for all conditions.`
          : primary.message,
      priority: primary.priority,
      timestamp: new Date(),
      data: {
        ...primary.data,
        consolidatedConditions: categories,
        totalAlerts: notifications.length,
      },
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
