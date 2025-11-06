import { WeatherNotificationSystem, NotificationLevel } from './weather-notification-core.ts';
import { sendFCMNotification } from './fcm-client.ts';
import { getWeatherData, getUserTokens } from './firestore-client.ts';

export interface NotificationConfig {
  level: NotificationLevel;
  maxNotificationsPerLocation: number;
  cooldownPeriod: number; // minutes
  targetAudience: 'admin' | 'public' | 'both';
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
          // Get realtime weather data
          const weatherData = await getWeatherData(location, 'realtime');

          if (!weatherData) {
            console.log(`No weather data available for ${location}`);
            continue;
          }

          // Check weather conditions
          const notifications = this.weatherNotifier.checkWeatherConditions(weatherData);

          // Filter by severity level
          const levelNotifications = notifications.filter(n => n.level === config.level);

          // Apply rate limiting and cooldown
          const notificationsToSend = this.applyRateLimiting(levelNotifications, location, config);

          // Send notifications
          for (const notification of notificationsToSend) {
            try {
              await this.sendNotificationToUsers(notification, location, config.targetAudience);
              results.sent++;

              // Track sent notifications for rate limiting
              this.trackSentNotification(notification, location);
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
  private applyRateLimiting(notifications: any[], location: string, config: NotificationConfig): any[] {
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
    notification: any,
    location: string,
    targetAudience: 'admin' | 'public' | 'both'
  ): Promise<void> {
    // Get user tokens based on target audience
    const userTokens = await getUserTokens(targetAudience, location);

    if (userTokens.length === 0) {
      console.log(`No users to notify for ${targetAudience} audience in ${location}`);
      return;
    }

    // Enhance notification with location context
    const enhancedNotification = {
      title: `${notification.title} - ${this.getLocationDisplayName(location)}`,
      body: notification.message,
      data: {
        level: notification.level,
        category: notification.category,
        location: location,
        timestamp: notification.timestamp.toISOString(),
        ...notification.data,
      },
    };

    // Send to all user tokens
    await sendFCMNotification(enhancedNotification, userTokens);
  }

  /**
   * Track sent notifications for rate limiting
   */
  private trackSentNotification(notification: any, location: string): void {
    const key = `${location}-${notification.category}-${notification.level}`;
    this.processedNotifications.set(key, new Date());
  }

  /**
   * Get human-readable location name
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
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
