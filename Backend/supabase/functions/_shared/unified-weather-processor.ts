import { sendFCMNotification } from './fcm-client.ts';
import { getUserTokens, getWeatherData, getWeatherForecastData, initializeFirebase } from './firestore-client.ts';
import type { WeatherNotificationData } from './notification-schema.ts';
import { NotificationService } from './notification-service.ts';
import { WeatherNotificationSystem, type WeatherData, type WeatherNotification } from './weather-notification-core.ts';

export interface WeatherNotificationConfig {
  type: 'current' | 'forecast_3h' | 'forecast_tomorrow';
  includeNormalConditions: boolean;
  targetAudience: 'admin' | 'users' | 'both';
  forecastHoursAhead?: number; // For forecast notifications
}

export interface WeatherNotificationResult {
  success: boolean;
  notifications_sent: number;
  locations_processed: number;
  errors: string[];
  notifications_details: Array<{
    location: string;
    level: string;
    category: string;
    recipients: number;
    title: string;
  }>;
}

export class UnifiedWeatherProcessor {
  private weatherNotifier: WeatherNotificationSystem;
  private locations = ['coastal_west', 'coastal_east', 'central_naic', 'sabang', 'farm_area', 'naic_boundary'];

  constructor() {
    this.weatherNotifier = new WeatherNotificationSystem();
  }

  /**
   * Process weather notifications for all locations
   */
  async processWeatherNotifications(config: WeatherNotificationConfig): Promise<WeatherNotificationResult> {
    const result: WeatherNotificationResult = {
      success: true,
      notifications_sent: 0,
      locations_processed: 0,
      errors: [],
      notifications_details: [],
    };

    console.log(`🌤️ Processing ${config.type} weather notifications...`);

    try {
      for (const location of this.locations) {
        try {
          await this.processLocationWeather(location, config, result);
          result.locations_processed++;

          // Rate limiting between locations
          await this.delay(1000);
        } catch (error) {
          const errorMsg = `Failed to process ${location}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Process weather notifications for a specific location
   */
  private async processLocationWeather(
    location: string,
    config: WeatherNotificationConfig,
    result: WeatherNotificationResult
  ): Promise<void> {
    // Get appropriate weather data based on notification type
    const weatherData = await this.getWeatherDataForType(location, config);

    if (!weatherData) {
      console.log(`❌ No weather data available for ${location}`);
      return;
    }

    // Check weather conditions
    const notifications = this.weatherNotifier.checkAllWeatherConditions(
      weatherData as unknown as WeatherData,
      config.includeNormalConditions
    );

    // Filter to only CRITICAL and WARNING (unless normal conditions are explicitly included)
    const filteredNotifications = config.includeNormalConditions
      ? notifications
      : notifications.filter(n => n.level === 'CRITICAL' || n.level === 'WARNING');

    if (filteredNotifications.length === 0) {
      console.log(`ℹ️ No significant weather conditions met for ${location}`);
      console.log('🔍 Debug Data:', JSON.stringify(weatherData, null, 2));
      return;
    }

    console.log(
      `📢 Found ${filteredNotifications.length} weather notifications for ${location} (${notifications.length} total conditions detected)`
    );

    // Send notifications for each condition found
    for (const notification of filteredNotifications) {
      try {
        await this.sendWeatherNotification(notification, location, config, result);
      } catch (error) {
        const errorMsg = `Failed to send notification for ${location}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        result.errors.push(errorMsg);
      }
    }
  }

  /**
   * Get weather data based on notification type
   */
  private async getWeatherDataForType(
    location: string,
    config: WeatherNotificationConfig
  ): Promise<Record<string, unknown> | null> {
    switch (config.type) {
      case 'current':
        return await getWeatherData(location, 'realtime');

      case 'forecast_3h': {
        // Get multiple hourly documents and find the entry closest to 3 hours from now
        const hourlyDocuments = await getWeatherForecastData(location, 'hourly', 50);
        return this.extractForecastData(hourlyDocuments, 3);
      }

      case 'forecast_tomorrow': {
        // Get multiple daily documents for tomorrow
        const dailyDocuments = await getWeatherForecastData(location, 'daily', 10);
        return this.extractTomorrowData(dailyDocuments);
      }

      default:
        throw new Error(`Unknown notification type: ${config.type}`);
    }
  }

  /**
   * Extract forecast data for specific hours ahead
   * Works with your existing Firestore structure: weather/{location}/hourly/{timestamp}
   */
  private extractForecastData(
    hourlyDocuments: Array<Record<string, unknown>> | null,
    hoursAhead: number
  ): Record<string, unknown> | null {
    if (!hourlyDocuments || hourlyDocuments.length === 0) {
      return null;
    }

    // Calculate target time (current time + hoursAhead) in Philippines timezone
    const targetTime = new Date();
    targetTime.setHours(targetTime.getHours() + hoursAhead);

    // Parse your time format: "11/19/2025, 09:00:00 PM"
    const parseCustomTime = (timeStr: string): Date | null => {
      try {
        return new Date(timeStr);
      } catch (_error) {
        return null;
      }
    };

    let closestEntry: Record<string, unknown> | null = null;
    let smallestTimeDiff = Infinity;

    // Find the document with time closest to our target
    for (const doc of hourlyDocuments) {
      if (doc.time && typeof doc.time === 'string') {
        const docTime = parseCustomTime(doc.time);
        if (docTime) {
          const timeDiff = Math.abs(docTime.getTime() - targetTime.getTime());
          const timeDiffHours = timeDiff / (1000 * 60 * 60);

          // Only consider documents that are within reasonable forecast range (within 6 hours)
          if (timeDiffHours <= 6 && timeDiff < smallestTimeDiff) {
            smallestTimeDiff = timeDiff;
            closestEntry = doc;
          }
        }
      }
    }

    if (closestEntry) {
      // Return the weather values (remove metadata like id, time)
      const { id: _id, time: _time, timestamp: _timestamp, ...weatherData } = closestEntry;
      return weatherData;
    }

    return null;
  }

  /**
   * Extract tomorrow's weather data
   * Works with your existing Firestore structure: weather/{location}/daily/{timestamp}
   */
  private extractTomorrowData(dailyDocuments: Array<Record<string, unknown>> | null): Record<string, unknown> | null {
    if (!dailyDocuments || dailyDocuments.length === 0) {
      return null;
    }

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Parse your time format: "11/19/2025, 09:00:00 PM"
    const parseCustomTime = (timeStr: string): Date | null => {
      try {
        return new Date(timeStr);
      } catch (_error) {
        return null;
      }
    };

    // Find document that matches tomorrow's date
    for (const doc of dailyDocuments) {
      if (doc.time && typeof doc.time === 'string') {
        const docTime = parseCustomTime(doc.time);
        if (docTime) {
          // Check if this document is for tomorrow
          const docDate = new Date(docTime);
          docDate.setHours(0, 0, 0, 0);

          if (docDate.getTime() === tomorrow.getTime()) {
            // Return the weather values (remove metadata like id, time)
            const { id: _id, time: _time, timestamp: _timestamp, ...rawData } = doc;

            // Map daily aggregate fields to expected field names for weather condition checking
            const weatherData = {
              ...rawData,
              // Map aggregate fields to simple field names expected by weather condition checker
              // Use !== undefined to handle falsy values like 0
              temperature: rawData.temperatureAvg !== undefined ? rawData.temperatureAvg : rawData.temperature,
              rainIntensity: rawData.rainIntensityAvg !== undefined ? rawData.rainIntensityAvg : rawData.rainIntensity,
              windSpeed: rawData.windSpeedAvg !== undefined ? rawData.windSpeedAvg : rawData.windSpeed,
              weatherCode: rawData.weatherCodeMax !== undefined ? rawData.weatherCodeMax : rawData.weatherCode,
              humidity: rawData.humidityAvg !== undefined ? rawData.humidityAvg : rawData.humidity,
              cloudCover: rawData.cloudCoverAvg !== undefined ? rawData.cloudCoverAvg : rawData.cloudCover,
              precipitationProbability:
                rawData.precipitationProbabilityAvg !== undefined
                  ? rawData.precipitationProbabilityAvg
                  : rawData.precipitationProbability,
            };

            return weatherData;
          }
        }
      }
    }

    return null;
  }

  /**
   * Send individual weather notification
   */
  private async sendWeatherNotification(
    notification: WeatherNotification,
    location: string,
    config: WeatherNotificationConfig,
    result: WeatherNotificationResult
  ): Promise<void> {
    // Get user tokens for the location/audience
    const { tokens } = await getUserTokens(config.targetAudience, location);

    if (tokens.length === 0) {
      console.log(`No FCM tokens found for ${location}`);
      return;
    }

    // Create notification content with time context
    const notificationContent = this.createNotificationContent(notification, config);

    // Send FCM notification
    const fcmResult = await sendFCMNotification(notificationContent, tokens);

    if (fcmResult.success > 0) {
      // Save to notification collection using new NotificationService
      const db = initializeFirebase();
      const notificationService = new NotificationService(db);

      // Prepare weather notification data (only include defined values)
      const weatherData: WeatherNotificationData = {
        weatherType: config.type,
        severity: notification.level,
        category: notification.category,
        priority: notification.priority,
        source: 'weather_api',
      };

      // Only add metrics that are actually defined
      if (notification.data?.temperature !== undefined)
        weatherData.temperature = notification.data.temperature as number;
      if (notification.data?.temperatureApparent !== undefined)
        weatherData.temperatureApparent = notification.data.temperatureApparent as number;
      if (notification.data?.humidity !== undefined) weatherData.humidity = notification.data.humidity as number;
      if (notification.data?.rainIntensity !== undefined)
        weatherData.rainIntensity = notification.data.rainIntensity as number;
      if (notification.data?.rainAccumulation !== undefined)
        weatherData.rainAccumulation = notification.data.rainAccumulation as number;
      if (notification.data?.windSpeed !== undefined) weatherData.windSpeed = notification.data.windSpeed as number;
      if (notification.data?.windGust !== undefined) weatherData.windGust = notification.data.windGust as number;
      if (notification.data?.windDirection !== undefined)
        weatherData.windDirection = notification.data.windDirection as number;
      if (notification.data?.uvIndex !== undefined) weatherData.uvIndex = notification.data.uvIndex as number;
      if (notification.data?.visibility !== undefined) weatherData.visibility = notification.data.visibility as number;
      if (notification.data?.precipitationProbability !== undefined)
        weatherData.precipitationProbability = notification.data.precipitationProbability as number;
      if (notification.data?.weatherCode !== undefined)
        weatherData.weatherCode = notification.data.weatherCode as number;
      if (config.type !== 'current') weatherData.forecastTime = this.getForecastTimeString(config);
      if (config.forecastHoursAhead !== undefined) weatherData.forecastHoursAhead = config.forecastHoursAhead;

      // Create the notification in the new schema
      const deliveryStatus: {
        success: number;
        failure: number;
        errors?: string[];
      } = {
        success: fcmResult.success,
        failure: fcmResult.failure,
      };

      // Only add errors array if there are actual errors
      if (fcmResult.errors.length > 0) {
        deliveryStatus.errors = fcmResult.errors;
      }

      await notificationService.createWeatherNotification({
        title: notificationContent.title,
        message: notificationContent.body,
        location: location,
        audience: config.targetAudience,
        sentTo: fcmResult.success + fcmResult.failure,
        weatherData: weatherData,
        deliveryStatus: deliveryStatus,
      });

      result.notifications_sent++;
      result.notifications_details.push({
        location: location,
        level: notification.level,
        category: notification.category,
        recipients: fcmResult.success,
        title: notificationContent.title,
      });

      console.log(`✅ Notification sent to ${fcmResult.success} users in ${location}`);
    }
  }

  /**
   * Create notification content with appropriate time context
   */
  private createNotificationContent(
    notification: WeatherNotification,
    config: WeatherNotificationConfig
  ): { title: string; body: string; data: Record<string, string> } {
    let title = notification.title;
    let body = notification.message;

    // Add time context for forecast notifications
    if (config.type === 'forecast_3h') {
      const forecastTime = new Date();
      forecastTime.setHours(forecastTime.getHours() + 3);
      const timeString = forecastTime.toLocaleTimeString('en-PH', {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
      });

      title = `📅 Weather Alert (${timeString})`;
      body = `${notification.message} Expected around ${timeString}.`;
    } else if (config.type === 'forecast_tomorrow') {
      title = "🌅 Tomorrow's Weather";
      body = `Tomorrow: ${notification.message}`;
    }

    return {
      title,
      body,
      data: {
        type: 'weather_alert',
        weather_level: notification.level,
        weather_category: notification.category,
        condition_type: config.type,
        priority: notification.priority.toString(),
        timestamp: new Date().toISOString(),
        ...(notification.data
          ? Object.fromEntries(Object.entries(notification.data).map(([k, v]) => [k, String(v)]))
          : {}),
      },
    };
  }

  /**
   * Get forecast time string for notifications
   */
  private getForecastTimeString(config: WeatherNotificationConfig): string {
    if (config.type === 'forecast_3h') {
      const time = new Date();
      time.setHours(time.getHours() + 3);
      return time.toISOString();
    } else if (config.type === 'forecast_tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString();
    }
    return new Date().toISOString();
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
