# 🌤️ UNIFIED WEATHER NOTIFICATION SYSTEM - IMPLEMENTATION GUIDE

This document provides **READY-TO-USE CODE** to replace your separate notification functions with a unified system that handles current, upcoming (3-hour), and tomorrow's weather notifications.

## 📋 **System Overview**

### **Current Separate Functions → New Unified System:**

```
❌ OLD: notification-critical, notification-warning, notification-info, notification-advisory
✅ NEW: unified-weather-notification (handles all levels automatically)
```

### **New Function Structure:**

```
Backend/supabase/functions/
├── unified-weather-notification/     ← 🆕 NEW - Replaces all 4 notification functions
│   └── index.ts
├── weather-forecast-notification/    ← 🆕 NEW - 3-hour advance notifications
│   └── index.ts
├── weather-tomorrow-notification/    ← 🆕 NEW - Tomorrow's weather notifications
│   └── index.ts
├── _shared/
│   ├── unified-weather-processor.ts  ← 🆕 NEW - Core notification logic
│   ├── weather-notification-core.ts  ← ✅ EXISTS - Enhanced with normal conditions
│   └── firestore-client.ts           ← ✅ EXISTS - Already supports flexible notifications
```

---

## 🗄️ **Enhanced Notifications Collection Schema**

### **Firestore Collection: `notifications`**

```typescript
interface NotificationDocument {
  // Core Fields
  id: string; // Auto-generated document ID
  title: string; // "🚨 Critical Heat Warning"
  body: string; // "Extreme heat expected. Temperature: 42°C"
  type: 'weather' | 'earthquake' | 'general' | 'emergency' | 'system';
  level: 'info' | 'warning' | 'critical' | 'emergency';
  category: string; // "heat", "rain", "wind", "seismic", etc.

  // Weather-Specific Fields
  weather_info?: {
    condition_type: 'current' | 'forecast_3h' | 'forecast_tomorrow';
    weather_category: 'heat' | 'rain' | 'wind' | 'storm' | 'clear' | 'normal';
    temperature?: number;
    humidity?: number;
    rain_intensity?: number;
    wind_speed?: number;
    forecast_time?: string; // ISO string for forecast notifications
    location_key: string; // "coastal_west", "central_naic", etc.
  };

  // Earthquake-Specific Fields (existing)
  earthquake_info?: {
    magnitude: number;
    coordinates: { lat: number; lng: number };
    depth: number;
    // ... existing earthquake fields
  };

  // Delivery Information
  metadata: {
    location?: string;
    audience: 'admin' | 'users' | 'both';
    weather_zone?: string;
    source: string; // "weather_api", "usgs", "manual"
  };

  // Tracking Fields
  sent_to: number; // Number of recipients
  delivery_status: 'sent' | 'failed' | 'partial';
  errors: string[];
  error_count: number;

  // Timestamps
  timestamp: Date; // When notification was sent
  created_at: string; // ISO string
  forecast_valid_time?: string; // For forecast notifications

  // Additional Data
  data: Record<string, unknown>; // Flexible payload
}
```

---

## 🔧 **Step 1: Enhanced Weather Notification Core**

**File:** `c:\Users\Paul\Rescuenect\Backend\supabase\functions\_shared\weather-notification-core.ts`

**ADD THESE FUNCTIONS TO THE BOTTOM OF THE FILE:**

```typescript
// ============================================
// NORMAL WEATHER CONDITIONS (FOR FORECASTS)
// ============================================

/**
 * Check for normal/pleasant weather conditions (for forecast notifications)
 */
public checkNormalWeatherConditions(weatherData: WeatherData): WeatherNotification[] {
  const normalNotifications: WeatherNotification[] = [];

  // Clear/Pleasant Weather
  if (this.isPleasantWeather(weatherData)) {
    normalNotifications.push({
      level: 'INFO',
      category: 'Clear',
      title: '☀️ Pleasant Weather Expected',
      message: this.getPleasantWeatherMessage(weatherData),
      priority: 10, // Low priority
      timestamp: new Date(),
      data: {
        weather_type: 'pleasant',
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        weather_code: weatherData.weatherCode
      }
    });
  }

  // Partly Cloudy (Normal)
  else if (this.isPartlyCloudyWeather(weatherData)) {
    normalNotifications.push({
      level: 'INFO',
      category: 'Cloudy',
      title: '⛅ Partly Cloudy Weather',
      message: this.getPartlyCloudyMessage(weatherData),
      priority: 10,
      timestamp: new Date(),
      data: {
        weather_type: 'partly_cloudy',
        temperature: weatherData.temperature,
        cloud_cover: weatherData.cloudCover
      }
    });
  }

  // Light Rain (Normal)
  else if (this.isLightRainWeather(weatherData)) {
    normalNotifications.push({
      level: 'INFO',
      category: 'Rain',
      title: '🌦️ Light Rain Expected',
      message: this.getLightRainMessage(weatherData),
      priority: 9,
      timestamp: new Date(),
      data: {
        weather_type: 'light_rain',
        rain_intensity: weatherData.rainIntensity,
        precipitation_probability: weatherData.precipitationProbability
      }
    });
  }

  return normalNotifications;
}

/**
 * Check if weather conditions are pleasant
 */
private isPleasantWeather(data: WeatherData): boolean {
  return (
    data.temperature >= 24 && data.temperature <= 30 &&  // Comfortable temperature
    data.humidity <= 70 &&                               // Not too humid
    data.rainIntensity <= 0.1 &&                        // No significant rain
    data.windSpeed <= 6 &&                              // Light breeze
    data.cloudCover <= 50                               // Mostly clear
  );
}

/**
 * Check if weather is partly cloudy but pleasant
 */
private isPartlyCloudyWeather(data: WeatherData): boolean {
  return (
    data.temperature >= 22 && data.temperature <= 32 &&
    data.cloudCover > 50 && data.cloudCover <= 80 &&
    data.rainIntensity <= 0.5 &&
    data.windSpeed <= 8
  );
}

/**
 * Check if it's light rain (not heavy enough for warnings)
 */
private isLightRainWeather(data: WeatherData): boolean {
  return (
    data.rainIntensity > 0.1 && data.rainIntensity < 2.5 &&  // Light rain only
    data.precipitationProbability >= 60 &&
    data.windSpeed <= 10  // Not stormy
  );
}

/**
 * Generate pleasant weather messages
 */
private getPleasantWeatherMessage(data: WeatherData): string {
  const temp = Math.round(data.temperature);
  const messages = [
    `Perfect weather ahead! Temperature: ${temp}°C with clear skies. Great for outdoor activities! 🌞`,
    `Beautiful day expected with ${temp}°C and sunny conditions. Perfect for going out! ☀️`,
    `Lovely weather coming up! ${temp}°C with comfortable conditions. Enjoy the outdoors! 🌤️`,
    `Clear skies and ${temp}°C temperature ahead. Perfect day for any outdoor plans! 🌟`
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Generate partly cloudy messages
 */
private getPartlyCloudyMessage(data: WeatherData): string {
  const temp = Math.round(data.temperature);
  return `Partly cloudy conditions expected with ${temp}°C. Pleasant weather for most activities. ⛅`;
}

/**
 * Generate light rain messages
 */
private getLightRainMessage(data: WeatherData): string {
  const temp = Math.round(data.temperature);
  const rainChance = Math.round(data.precipitationProbability);
  return `Light rain expected (${rainChance}% chance) with ${temp}°C. Don't forget your umbrella! 🌦️`;
}

/**
 * Get all conditions including normal weather (for forecasts)
 */
public checkAllWeatherConditions(weatherData: WeatherData, includeNormal: boolean = false): WeatherNotification[] {
  // Get existing critical/warning conditions
  const criticalConditions = this.checkWeatherConditions(weatherData);

  if (includeNormal && criticalConditions.length === 0) {
    // Only show normal conditions if no critical/warning conditions exist
    const normalConditions = this.checkNormalWeatherConditions(weatherData);
    return normalConditions;
  }

  return criticalConditions;
}
```

---

## 🔧 **Step 2: Unified Weather Processor**

**File:** `c:\Users\Paul\Rescuenect\Backend\supabase\functions\_shared\unified-weather-processor.ts`

**CREATE THIS NEW FILE:**

```typescript
import { WeatherNotificationSystem, type WeatherData, type WeatherNotification } from './weather-notification-core.ts';
import { getUserTokens, getWeatherData, saveNotificationHistory } from './firestore-client.ts';
import { sendFCMNotification } from './fcm-client.ts';

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
      console.log(`No weather data available for ${location} (${config.type})`);
      return;
    }

    // Check weather conditions
    const notifications = this.weatherNotifier.checkAllWeatherConditions(
      weatherData as WeatherData,
      config.includeNormalConditions
    );

    if (notifications.length === 0) {
      console.log(`No weather conditions to notify for ${location}`);
      return;
    }

    // Send notifications for each condition found
    for (const notification of notifications) {
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

      case 'forecast_3h':
        // Get hourly data and find the entry closest to 3 hours from now
        const hourlyData = await getWeatherData(location, 'hourly');
        return this.extractForecastData(hourlyData, 3);

      case 'forecast_tomorrow':
        // Get daily data for tomorrow
        const dailyData = await getWeatherData(location, 'daily');
        return this.extractTomorrowData(dailyData);

      default:
        throw new Error(`Unknown notification type: ${config.type}`);
    }
  }

  /**
   * Extract forecast data for specific hours ahead
   */
  private extractForecastData(hourlyData: any, hoursAhead: number): Record<string, unknown> | null {
    if (!hourlyData || !Array.isArray(hourlyData.hourly)) {
      return null;
    }

    const targetTime = new Date();
    targetTime.setHours(targetTime.getHours() + hoursAhead);

    // Find the closest hourly entry to our target time
    const closestEntry = hourlyData.hourly.find((entry: any) => {
      const entryTime = new Date(entry.time);
      return Math.abs(entryTime.getTime() - targetTime.getTime()) < 3600000; // Within 1 hour
    });

    return closestEntry?.values || null;
  }

  /**
   * Extract tomorrow's weather data
   */
  private extractTomorrowData(dailyData: any): Record<string, unknown> | null {
    if (!dailyData || !Array.isArray(dailyData.daily)) {
      return null;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowEntry = dailyData.daily.find((entry: any) => {
      const entryDate = new Date(entry.time);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === tomorrow.getTime();
    });

    return tomorrowEntry?.values || null;
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
      console.log(`No FCM tokens found for ${location} (${config.targetAudience})`);
      return;
    }

    // Create notification content with time context
    const notificationContent = this.createNotificationContent(notification, config);

    console.log(`📱 Sending ${notification.level} notification to ${tokens.length} users in ${location}`);

    // Send FCM notification
    const fcmResult = await sendFCMNotification(notificationContent, tokens);

    if (fcmResult.success > 0) {
      // Save to notification history
      await saveNotificationHistory(
        {
          title: notificationContent.title,
          body: notificationContent.body,
          type: 'weather',
          level: notification.level.toLowerCase() as any,
          category: notification.category.toLowerCase(),
          data: {
            weather_condition: notification.category,
            condition_type: config.type,
            forecast_time: config.type !== 'current' ? this.getForecastTimeString(config) : undefined,
            ...notification.data,
          },
        },
        {
          location: location,
          audience: config.targetAudience,
          weather_zone: location,
          source: 'weather_api',
          notification_type: config.type,
          weather_category: notification.category.toLowerCase(),
        },
        fcmResult.success,
        fcmResult.errors
      );

      result.notifications_sent++;
      result.notifications_details.push({
        location: location,
        level: notification.level,
        category: notification.category,
        recipients: fcmResult.success,
        title: notificationContent.title,
      });

      console.log(`✅ ${notification.level} notification sent to ${fcmResult.success} users in ${location}`);
    } else {
      console.log(`⚠️ Failed to send notification to ${location}: No successful deliveries`);
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
```

---

## 🔧 **Step 3: Unified Current Weather Notification Function**

**File:** `c:\Users\Paul\Rescuenect\Backend\supabase\functions\unified-weather-notification\index.ts`

**CREATE THIS NEW FUNCTION:**

```typescript
import { serve } from 'serve';
import { UnifiedWeatherProcessor } from '../_shared/unified-weather-processor.ts';

console.log('🌤️ Unified Weather Notification Function Loaded');

serve(async (req: Request) => {
  const startTime = performance.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  console.log('🔍 Processing current weather notifications...');

  try {
    const processor = new UnifiedWeatherProcessor();

    const result = await processor.processWeatherNotifications({
      type: 'current',
      includeNormalConditions: false, // Don't include normal conditions for current weather
      targetAudience: 'both', // Send to both admin and users
    });

    const processingTime = Math.round(performance.now() - startTime);

    const response = {
      success: result.success,
      type: 'current_weather',
      notifications_sent: result.notifications_sent,
      locations_processed: result.locations_processed,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString(),
      message: `Current weather notifications: ${result.notifications_sent} sent across ${result.locations_processed} locations`,
      details: result.notifications_details,
      errors: result.errors,
    };

    console.log('✅ Current weather notifications completed:', response);

    return new Response(JSON.stringify(response), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ Current weather notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        type: 'current_weather',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
```

---

## 🔧 **Step 4: 3-Hour Forecast Notification Function**

**File:** `c:\Users\Paul\Rescuenect\Backend\supabase\functions\weather-forecast-notification\index.ts`

**CREATE THIS NEW FUNCTION:**

```typescript
import { serve } from 'serve';
import { UnifiedWeatherProcessor } from '../_shared/unified-weather-processor.ts';

console.log('📅 Weather Forecast Notification Function Loaded (3-hour ahead)');

serve(async (req: Request) => {
  const startTime = performance.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  console.log('🔍 Processing 3-hour forecast weather notifications...');

  try {
    const processor = new UnifiedWeatherProcessor();

    const result = await processor.processWeatherNotifications({
      type: 'forecast_3h',
      includeNormalConditions: true, // Include normal conditions for forecasts
      targetAudience: 'both',
      forecastHoursAhead: 3,
    });

    const processingTime = Math.round(performance.now() - startTime);

    const response = {
      success: result.success,
      type: 'forecast_3h',
      notifications_sent: result.notifications_sent,
      locations_processed: result.locations_processed,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString(),
      forecast_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      message: `3-hour forecast notifications: ${result.notifications_sent} sent across ${result.locations_processed} locations`,
      details: result.notifications_details,
      errors: result.errors,
    };

    console.log('✅ 3-hour forecast notifications completed:', response);

    return new Response(JSON.stringify(response), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ 3-hour forecast notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        type: 'forecast_3h',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
```

---

## 🔧 **Step 5: Tomorrow Weather Notification Function**

**File:** `c:\Users\Paul\Rescuenect\Backend\supabase\functions\weather-tomorrow-notification\index.ts`

**CREATE THIS NEW FUNCTION:**

```typescript
import { serve } from 'serve';
import { UnifiedWeatherProcessor } from '../_shared/unified-weather-processor.ts';

console.log('🌅 Tomorrow Weather Notification Function Loaded');

serve(async (req: Request) => {
  const startTime = performance.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  console.log('🔍 Processing tomorrow weather notifications...');

  try {
    const processor = new UnifiedWeatherProcessor();

    const result = await processor.processWeatherNotifications({
      type: 'forecast_tomorrow',
      includeNormalConditions: true, // Include normal conditions for tomorrow's weather
      targetAudience: 'both',
    });

    const processingTime = Math.round(performance.now() - startTime);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = {
      success: result.success,
      type: 'forecast_tomorrow',
      notifications_sent: result.notifications_sent,
      locations_processed: result.locations_processed,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString(),
      forecast_date: tomorrow.toISOString().split('T')[0],
      message: `Tomorrow's weather notifications: ${result.notifications_sent} sent across ${result.locations_processed} locations`,
      details: result.notifications_details,
      errors: result.errors,
    };

    console.log('✅ Tomorrow weather notifications completed:', response);

    return new Response(JSON.stringify(response), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ Tomorrow weather notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        type: 'forecast_tomorrow',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
```

---

## 📅 **Step 6: Create Deno Configuration Files**

### **Unified Weather Notification Deno Config:**

**File:** `c:\Users\Paul\Rescuenect\Backend\supabase\functions\unified-weather-notification\deno.json`

```json
{
  "imports": {
    "serve": "https://deno.land/std@0.168.0/http/server.ts",
    "firebase-admin/app": "npm:firebase-admin@11.8.0/app",
    "firebase-admin/firestore": "npm:firebase-admin@11.8.0/firestore",
    "firebase-admin/messaging": "npm:firebase-admin@11.8.0/messaging"
  },
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": false
  }
}
```

### **Forecast Notification Deno Config:**

**File:** `c:\Users\Paul\Rescuenect\Backend\supabase\functions\weather-forecast-notification\deno.json`

```json
{
  "imports": {
    "serve": "https://deno.land/std@0.168.0/http/server.ts",
    "firebase-admin/app": "npm:firebase-admin@11.8.0/app",
    "firebase-admin/firestore": "npm:firebase-admin@11.8.0/firestore",
    "firebase-admin/messaging": "npm:firebase-admin@11.8.0/messaging"
  },
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": false
  }
}
```

### **Tomorrow Weather Deno Config:**

**File:** `c:\Users\Paul\Rescuenect\Backend\supabase\functions\weather-tomorrow-notification\deno.json`

```json
{
  "imports": {
    "serve": "https://deno.land/std@0.168.0/http/server.ts",
    "firebase-admin/app": "npm:firebase-admin@11.8.0/app",
    "firebase-admin/firestore": "npm:firebase-admin@11.8.0/firestore",
    "firebase-admin/messaging": "npm:firebase-admin@11.8.0/messaging"
  },
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": false
  }
}
```

---

## 🚀 **Step 7: Deployment & Setup**

### **1. Deploy the New Functions:**

```bash
npx supabase functions deploy unified-weather-notification
npx supabase functions deploy weather-forecast-notification
npx supabase functions deploy weather-tomorrow-notification
```

### **2. Set Up Cron Jobs:**

**Current Weather (every 30 minutes):**

```sql
SELECT cron.schedule('unified-weather-current', '*/30 * * * *', 'https://your-project-ref.supabase.co/functions/v1/unified-weather-notification');
```

**3-Hour Forecast (4 times daily):**

```sql
SELECT cron.schedule('weather-forecast-3h', '0 6,12,18,22 * * *', 'https://your-project-ref.supabase.co/functions/v1/weather-forecast-notification');
```

**Tomorrow Weather (once daily at 8 PM):**

```sql
SELECT cron.schedule('weather-tomorrow', '0 20 * * *', 'https://your-project-ref.supabase.co/functions/v1/weather-tomorrow-notification');
```

### **3. Remove Old Functions (After Testing):**

```bash
# Once you've tested the new system, remove the old separate functions:
npx supabase functions delete notification-critical
npx supabase functions delete notification-warning
npx supabase functions delete notification-info
npx supabase functions delete notification-advisory
```

---

## 🧪 **Step 8: Testing**

### **Test Current Weather:**

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/unified-weather-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### **Test 3-Hour Forecast:**

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/weather-forecast-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### **Test Tomorrow Weather:**

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/weather-tomorrow-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 🎯 **System Benefits:**

✅ **Unified Logic**: One system handles all weather notification levels automatically  
✅ **Smart Conditions**: Automatically detects and sends appropriate level (critical/warning/info)  
✅ **Forecast Support**: Includes pleasant weather for upcoming conditions  
✅ **Flexible Schema**: Enhanced notifications collection supports all notification types  
✅ **Better UX**: Users get contextual notifications ("rain upcoming at 9:00 PM")  
✅ **Centralized Storage**: All notifications stored in one collection for easy UI display  
✅ **Scalable**: Easy to add new notification types or modify conditions

**Your weather notification system is now unified and much more powerful! 🌟**
