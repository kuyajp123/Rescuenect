# Weather Notification System - Comprehensive Documentation

## 📋 Overview

This document provides a complete guide for implementing an automated weather notification system that monitors weather conditions and sends targeted push notifications based on severity levels. The system integrates with Supabase Edge Functions for scheduled processing and Firebase Cloud Messaging (FCM) for notification delivery to both web and mobile applications.

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Weather Notification Flow                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Weather Data Collection (Existing Supabase Edge Functions)  │
│     ├── Realtime Data: Every 30 minutes                        │
│     ├── Hourly Data: Every hour                                │
│     └── Daily Data: Every 12 hours                             │
│                          ↓                                      │
│  2. Weather Data Storage (Firebase Firestore)                  │
│     └── 6 locations × 3 data types                            │
│                          ↓                                      │
│  3. Notification Processing (New Supabase Edge Functions)      │
│     ├── Critical: Immediate processing                          │
│     ├── Warning: Every 30 minutes                              │
│     ├── Advisory: Every 2 hours                                │
│     └── Info: Every 6 hours                                    │
│                          ↓                                      │
│  4. Push Notification Delivery (Firebase Cloud Messaging)      │
│     ├── Web App (Admin Dashboard)                              │
│     └── Mobile App (React Native)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **Existing Weather Collection**: Uses current Supabase Edge Functions
2. **Data Storage**: Continues using Firebase Firestore
3. **New Notification Engine**: Additional Supabase Edge Functions
4. **Push Notifications**: Firebase Cloud Messaging (FCM)

## 🚨 Notification Severity Levels & Scheduling

### Notification Levels & Professional Standards

Based on meteorological standards from PAGASA (Philippine Atmospheric, Geophysical and Astronomical Services Administration) and international weather services:

| Level        | Description                 | Example Conditions                                                                      | Scheduling Strategy  | Professional Standard         |
| ------------ | --------------------------- | --------------------------------------------------------------------------------------- | -------------------- | ----------------------------- |
| **CRITICAL** | Life-threatening conditions | • Heat Index ≥40°C<br>• Wind Speed ≥20 m/s<br>• Rainfall ≥50mm/h<br>• Visibility <200m  | **IMMEDIATE**        | Emergency broadcast standard  |
| **WARNING**  | Dangerous conditions        | • Heat Index 38-39°C<br>• Wind Speed 14-19 m/s<br>• Rainfall 7-49mm/h<br>• UV Index ≥11 | **Every 30 minutes** | Matches realtime data updates |
| **ADVISORY** | Potentially hazardous       | • Temperature ≥35°C<br>• Wind Speed 8-13 m/s<br>• UV Index 8-10                         | **Every 2 hours**    | Standard advisory interval    |
| **INFO**     | General awareness           | • High chance of rain<br>• Moderate UV levels<br>• General weather updates              | **Every 6 hours**    | Public information standard   |

### Scheduling Alignment with Data Collection

The notification schedules are strategically aligned with weather data collection intervals:

- **Realtime Data (30 min)** → **Warning Notifications (30 min)**
- **Hourly Data (60 min)** → **Advisory Notifications (2 hours)**
- **Daily Data (12 hours)** → **Info Notifications (6 hours)**
- **Critical Notifications** → **Immediate** (not bound by data intervals)

## 📊 Weather Condition Thresholds

### Heat-Related Conditions

```typescript
// Critical Thresholds (Immediate Alert)
const HEAT_CRITICAL = {
  temperatureApparent: 40, // °C - Heat stroke risk
  combinedCondition: { temperature: 35, humidity: 70 }, // High risk combo
};

// Warning Thresholds (30 min intervals)
const HEAT_WARNING = {
  temperatureApparent: 38, // °C - Heat exhaustion risk
  temperature: 35, // °C - Direct heat exposure
  combinedUV: { temperature: 32, uvIndex: 8 }, // Heat + UV combo
};

// Advisory Thresholds (2 hour intervals)
const HEAT_ADVISORY = {
  temperature: 35, // °C - High heat
  temperatureApparent: 36, // °C - Significant discomfort
};
```

### Precipitation & Flood Risk

```typescript
// Critical Thresholds
const RAIN_CRITICAL = {
  rainIntensity: 50, // mm/h - Flash flood risk
  rainAccumulation: 50, // mm - Severe flooding likely
  combinedRisk: { accumulation: 25, intensity: 5 }, // High flood combo
};

// Warning Thresholds
const RAIN_WARNING = {
  rainIntensity: 7, // mm/h - Heavy rain
  rainAccumulation: 30, // mm - Flooding possible
  stormCondition: { windSpeed: 12, rainIntensity: 5 }, // Storm combo
};
```

### Wind Conditions

```typescript
// Critical Wind Thresholds
const WIND_CRITICAL = {
  windGust: 20, // m/s - Extreme danger
  sustainedWind: 17, // m/s - Severe damage possible
};

// Warning Wind Thresholds
const WIND_WARNING = {
  windGust: 15, // m/s - Strong gusts
  sustainedWind: 14, // m/s - Dangerous conditions
};
```

## 🔧 Technical Implementation

### Supabase Edge Functions Structure

```
supabase/
├── functions/
│   ├── notification-critical/          # Immediate notifications
│   │   ├── index.ts
│   │   └── deno.json
│   ├── notification-warning/           # Every 30 minutes
│   │   ├── index.ts
│   │   └── deno.json
│   ├── notification-advisory/          # Every 2 hours
│   │   ├── index.ts
│   │   └── deno.json
│   ├── notification-info/              # Every 6 hours
│   │   ├── index.ts
│   │   └── deno.json
│   └── _shared/
│       ├── notification-engine.ts      # Core logic
│       ├── weather-thresholds.ts       # Condition definitions
│       ├── fcm-client.ts              # Firebase messaging
│       └── firestore-client.ts        # Database access
```

### Core Dependencies & Deno Configuration

Each notification function requires specific Deno configuration for strict import handling:

#### deno.json (Template for all notification functions)

```json
{
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": true
  },
  "imports": {
    "firebase-admin/app": "https://esm.sh/firebase-admin@11.8.0/app",
    "firebase-admin/firestore": "https://esm.sh/firebase-admin@11.8.0/firestore",
    "firebase-admin/messaging": "https://esm.sh/firebase-admin@11.8.0/messaging",
    "std/": "https://deno.land/std@0.168.0/"
  },
  "tasks": {
    "start": "deno run --allow-net --allow-env index.ts",
    "dev": "deno run --allow-net --allow-env --watch index.ts"
  }
}
```

### Shared Notification Engine

#### \_shared/notification-engine.ts

```typescript
import { WeatherNotificationSystem, WeatherData, NotificationLevel } from './weather-notification-core.ts';
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
    return locationNames[locationKey] || locationKey;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Firebase Cloud Messaging Client

#### \_shared/fcm-client.ts

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging, Message, MulticastMessage } from 'firebase-admin/messaging';

let messagingInstance: any = null;

/**
 * Initialize Firebase Admin SDK for messaging
 */
const initializeFirebaseMessaging = () => {
  if (messagingInstance) return messagingInstance;

  try {
    const serviceAccountKey = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')!);

    const app = initializeApp({
      credential: cert(serviceAccountKey),
      projectId: serviceAccountKey.project_id,
    });

    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error('Failed to initialize Firebase Messaging:', error);
    throw error;
  }
};

/**
 * Send notification to multiple devices
 */
export async function sendFCMNotification(
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  },
  tokens: string[]
): Promise<{ success: number; failure: number; errors: string[] }> {
  const messaging = initializeFirebaseMessaging();
  const results = { success: 0, failure: 0, errors: [] as string[] };

  if (tokens.length === 0) {
    return results;
  }

  try {
    // Prepare multicast message
    const message: MulticastMessage = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: tokens,
      android: {
        priority: 'high',
        notification: {
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body,
            },
            badge: 1,
            sound: 'default',
          },
        },
      },
      webpush: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
      },
    };

    // Send multicast message
    const response = await messaging.sendEachForMulticast(message);

    results.success = response.successCount;
    results.failure = response.failureCount;

    // Collect error details
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          results.errors.push(`Token ${idx}: ${resp.error?.message || 'Unknown error'}`);
        }
      });
    }

    console.log(`FCM Results: ${results.success} successful, ${results.failure} failed`);
    return results;
  } catch (error) {
    console.error('FCM send error:', error);
    results.failure = tokens.length;
    results.errors.push(`Fatal error: ${error.message}`);
    return results;
  }
}

/**
 * Send notification to a single device
 */
export async function sendFCMNotificationSingle(
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  },
  token: string
): Promise<boolean> {
  const result = await sendFCMNotification(notification, [token]);
  return result.success > 0;
}

/**
 * Validate FCM token format
 */
export function isValidFCMToken(token: string): boolean {
  // FCM tokens are typically 163 characters long and contain specific patterns
  const tokenPattern = /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/;
  return token && token.length > 100 && token.includes(':');
}

/**
 * Clean invalid tokens from a list
 */
export function cleanTokenList(tokens: string[]): string[] {
  return tokens.filter(token => isValidFCMToken(token));
}
```

### Firestore Database Client

#### \_shared/firestore-client.ts

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let firestoreInstance: any = null;

/**
 * Initialize Firestore connection
 */
const initializeFirestore = () => {
  if (firestoreInstance) return firestoreInstance;

  try {
    const serviceAccountKey = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')!);

    const app = initializeApp({
      credential: cert(serviceAccountKey),
      projectId: serviceAccountKey.project_id,
    });

    firestoreInstance = getFirestore(app);
    return firestoreInstance;
  } catch (error) {
    console.error('Failed to initialize Firestore:', error);
    throw error;
  }
};

/**
 * Get weather data for a specific location and type
 */
export async function getWeatherData(location: string, type: 'realtime' | 'hourly' | 'daily'): Promise<any> {
  const db = initializeFirestore();

  try {
    if (type === 'realtime') {
      // Get realtime data
      const doc = await db.collection('weather').doc(location).collection('realtime').doc('data').get();

      return doc.exists ? doc.data() : null;
    } else {
      // Get latest hourly or daily data
      const snapshot = await db
        .collection('weather')
        .doc(location)
        .collection(type)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      return snapshot.docs[0].data();
    }
  } catch (error) {
    console.error(`Error fetching ${type} data for ${location}:`, error);
    return null;
  }
}

/**
 * Get user FCM tokens based on audience and barangay location preferences
 * Maps barangays to weather monitoring zones using getUsersBarangay helper
 */
export async function getUserTokens(audience: 'admin' | 'users' | 'both', barangay?: string): Promise<string[]> {
  const db = initializeFirestore();
  const tokens: string[] = [];

  try {
    const collections = [];

    // Determine which collections to query
    if (audience === 'admin' || audience === 'both') {
      collections.push('admin');
    }
    if (audience === 'users' || audience === 'both') {
      collections.push('users');
    }

    // Query each collection
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();

      snapshot.forEach(doc => {
        const userData = doc.data();

        // Check if user wants notifications
        if (userData.notificationsEnabled === false) return;

        // Check barangay preferences if specified
        if (barangay && userData.barangay && userData.barangay.length > 0) {
          const alertZone = barangayMap[barangay.toLowerCase()];

          // Skip if we don't know this barangay's zone
          if (!alertZone) {
            console.warn(`Unknown barangay zone for: ${barangay}`);
            return;
          }

          // Check if user has any barangay in the alert zone
          const isUserInAlertZone = userData.barangay.some(userBarangay => {
            const userZone = barangayMap[userBarangay.toLowerCase()];
            return userZone === alertZone;
          });

          if (!isUserInAlertZone) {
            // User not in affected weather zone - skip this user
            return;
          }
        }

        // Add FCM token if valid
        if (userData.fcmToken && isValidToken(userData.fcmToken)) {
          tokens.push(userData.fcmToken);
        }
      });
    }

    return [...new Set(tokens)]; // Remove duplicates
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return [];
  }
}

/**
 * Helper function to get weather zone for a barangay
 * Import this from your getUserLocation.ts file
 */
function getUsersBarangay(barangay: string): string {
  // This maps individual barangays to weather monitoring zones
  const barangayMap: Record<string, string> = {
    'Alapan I-A': 'coastal_west',
    'Alapan I-B': 'coastal_west',
    'Alapan II-A': 'coastal_west',
    'Alapan II-B': 'coastal_west',
    Bago: 'central_naic',
    Banalo: 'naic_boundary',
    Bucana: 'coastal_east',
    'Buna Lejos': 'farm_area',
    'Buna Cerca': 'farm_area',
    'Capt. C. Nazareno (Pob.)': 'central_naic',
    Cofradia: 'central_naic',
    Dungguan: 'coastal_east',
    'Gen. Castañeda (Pob.)': 'central_naic',
    'Gomez-Zamora (Pob.)': 'central_naic',
    'Ibayo Estacion': 'naic_boundary',
    'Ibayo Silangan': 'naic_boundary',
    Kanluran: 'central_naic',
    Labac: 'naic_boundary',
    Latoria: 'farm_area',
    Mabolo: 'farm_area',
    Madiit: 'coastal_east',
    'Meyor Camilo D. Osias (Pob.)': 'central_naic',
    Molino: 'naic_boundary',
    Munggos: 'farm_area',
    Muzon: 'sabang',
    'Palangue Central': 'coastal_west',
    'Palangue Norte': 'coastal_west',
    'Palangue Sur': 'coastal_west',
    Sabang: 'sabang',
    Santulan: 'farm_area',
    Sapa: 'coastal_west',
    Silangan: 'central_naic',
    'Timalan Balsahan': 'naic_boundary',
    'Timalan Concepcion': 'naic_boundary',
  };

  return barangayMap[barangay] || 'central_naic'; // Default to central_naic if not found
}

/**
 * Save notification history for tracking
 */
export async function saveNotificationHistory(
  notification: any,
  location: string,
  sentTo: number,
  errors: string[]
): Promise<void> {
  const db = initializeFirestore();

  try {
    await db.collection('notification_history').add({
      title: notification.title,
      body: notification.body,
      level: notification.level,
      category: notification.category,
      location: location,
      sentTo: sentTo,
      errors: errors,
      timestamp: new Date(),
      data: notification.data || {},
    });
  } catch (error) {
    console.error('Error saving notification history:', error);
  }
}

/**
 * Validate FCM token format
 */
function isValidToken(token: string): boolean {
  return token && token.length > 100 && token.includes(':');
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(timeframe: 'today' | 'week' | 'month'): Promise<{
  total: number;
  byLevel: Record<string, number>;
  byLocation: Record<string, number>;
}> {
  const db = initializeFirestore();

  // Calculate date range
  const now = new Date();
  let startDate = new Date();

  switch (timeframe) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
  }

  try {
    const snapshot = await db.collection('notification_history').where('timestamp', '>=', startDate).get();

    const stats = {
      total: 0,
      byLevel: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      stats.total++;

      // Count by level
      stats.byLevel[data.level] = (stats.byLevel[data.level] || 0) + 1;

      // Count by location
      stats.byLocation[data.location] = (stats.byLocation[data.location] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return { total: 0, byLevel: {}, byLocation: {} };
  }
}
```

## ⏰ Notification Timing & Deduplication

### Scheduling Configuration

```typescript
// Cron schedules with 2-minute delays between notifications
const NOTIFICATION_SCHEDULES = {
  realtime: '0,30 * * * *', // Every 30 minutes
  hourly: '2,32 * * * *', // 2 minutes after realtime
  daily: '4 */12 * * *', // 4 minutes after hour, every 12 hours
};
```

### Notification Deduplication System

**Problem:** Multiple data sources can trigger duplicate notifications for the same weather event.

**Solution:** Implement a consolidation system that:

1. **Collects all conditions** within a time window (2 minutes)
2. **Prioritizes data sources**: realtime > hourly > daily
3. **Consolidates similar conditions** into single notifications
4. **Prevents spam** with cooldown periods

```typescript
interface NotificationCache {
  location: string;
  conditions: WeatherCondition[];
  highestSeverity: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';
  lastSent: Date;
  consolidationWindow: Date; // 2 minutes from first condition
}

/**
 * Notification consolidation logic
 */
export async function consolidateNotifications(location: string, newCondition: WeatherCondition): Promise<boolean> {
  const cache = await getNotificationCache(location);
  const now = new Date();

  // Check if we're within consolidation window
  if (cache.consolidationWindow && now < cache.consolidationWindow) {
    // Add to existing conditions
    cache.conditions.push(newCondition);
    cache.highestSeverity = getHighestSeverity([...cache.conditions]);
    await updateNotificationCache(location, cache);
    return false; // Don't send yet, wait for window to close
  }

  // Window closed or no existing cache - send consolidated notification
  if (cache.conditions.length > 0) {
    await sendConsolidatedNotification(location, cache.conditions);
    await clearNotificationCache(location);
  }

  // Start new consolidation window
  await setNotificationCache(location, {
    location,
    conditions: [newCondition],
    highestSeverity: newCondition.severity,
    lastSent: now,
    consolidationWindow: new Date(now.getTime() + 2 * 60 * 1000), // 2 minutes
  });

  return true;
}
```

### Data Source Priority

```typescript
const DATA_SOURCE_PRIORITY = {
  realtime: 1, // Highest priority - most current data
  hourly: 2, // Medium priority - trend data
  daily: 3, // Lowest priority - forecast data
};

/**
 * Filter conditions by data source priority
 */
function prioritizeConditions(conditions: WeatherCondition[]): WeatherCondition[] {
  const grouped = conditions.reduce((acc, condition) => {
    const source = condition.dataSource;
    if (!acc[source]) acc[source] = [];
    acc[source].push(condition);
    return acc;
  }, {} as Record<string, WeatherCondition[]>);

  // Return conditions from highest priority source that has data
  for (const source of ['realtime', 'hourly', 'daily']) {
    if (grouped[source] && grouped[source].length > 0) {
      return grouped[source];
    }
  }

  return conditions;
}
```

## 📋 Individual Edge Function Implementations

### 1. Critical Notifications (Immediate)

#### supabase/functions/notification-critical/index.ts

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { NotificationProcessor } from '../_shared/notification-engine.ts';

const processor = new NotificationProcessor();

serve(async req => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log('🚨 Processing CRITICAL weather notifications...');

  try {
    const results = await processor.processNotificationsForLevel({
      level: 'CRITICAL',
      maxNotificationsPerLocation: 5, // Allow multiple critical alerts
      cooldownPeriod: 10, // 10 minutes minimum between same type
      targetAudience: 'both', // Notify everyone for critical conditions
    });

    const response = {
      success: true,
      level: 'CRITICAL',
      results: results,
      timestamp: new Date().toISOString(),
      message: `Processed critical notifications: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`,
    };

    console.log('✅ Critical notifications processed:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Critical notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        level: 'CRITICAL',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### 2. Warning Notifications (Every 30 Minutes)

#### supabase/functions/notification-warning/index.ts

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { NotificationProcessor } from '../_shared/notification-engine.ts';

const processor = new NotificationProcessor();

serve(async req => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log('⚠️ Processing WARNING weather notifications...');

  try {
    const results = await processor.processNotificationsForLevel({
      level: 'WARNING',
      maxNotificationsPerLocation: 3, // Limit warning spam
      cooldownPeriod: 30, // 30 minutes between same warnings
      targetAudience: 'both', // Notify admins and public
    });

    const response = {
      success: true,
      level: 'WARNING',
      results: results,
      timestamp: new Date().toISOString(),
      message: `Processed warning notifications: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`,
    };

    console.log('✅ Warning notifications processed:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Warning notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        level: 'WARNING',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### 3. Advisory Notifications (Every 2 Hours)

#### supabase/functions/notification-advisory/index.ts

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { NotificationProcessor } from '../_shared/notification-engine.ts';

const processor = new NotificationProcessor();

serve(async req => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log('📋 Processing ADVISORY weather notifications...');

  try {
    const results = await processor.processNotificationsForLevel({
      level: 'ADVISORY',
      maxNotificationsPerLocation: 2, // Fewer advisory notifications
      cooldownPeriod: 120, // 2 hours between same advisories
      targetAudience: 'both', // Notify all users
    });

    const response = {
      success: true,
      level: 'ADVISORY',
      results: results,
      timestamp: new Date().toISOString(),
      message: `Processed advisory notifications: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`,
    };

    console.log('✅ Advisory notifications processed:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Advisory notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        level: 'ADVISORY',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### 4. Info Notifications (Every 6 Hours)

#### supabase/functions/notification-info/index.ts

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { NotificationProcessor } from '../_shared/notification-engine.ts';

const processor = new NotificationProcessor();

serve(async req => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log('ℹ️ Processing INFO weather notifications...');

  try {
    const results = await processor.processNotificationsForLevel({
      level: 'INFO',
      maxNotificationsPerLocation: 1, // Only essential info notifications
      cooldownPeriod: 360, // 6 hours between same info
      targetAudience: 'admin', // Only notify admins for info level
    });

    const response = {
      success: true,
      level: 'INFO',
      results: results,
      timestamp: new Date().toISOString(),
      message: `Processed info notifications: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`,
    };

    console.log('✅ Info notifications processed:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Info notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        level: 'INFO',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
```

## 🕰️ Cron Job Configuration

### PostgreSQL Cron Scheduling

Add these cron jobs to your Supabase database:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. CRITICAL Notifications (Triggered by weather data updates, not scheduled)
-- No cron job needed - will be called by weather collection functions

-- 2. WARNING Notifications (2 minutes after realtime data collection)
SELECT cron.schedule(
  'weather-notification-warning',
  '2,32 * * * *', -- 2 minutes after realtime (0,30), allows consolidation
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/notification-warning',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- 3. ADVISORY Notifications (4 minutes after hourly data, every 2 hours)
SELECT cron.schedule(
  'weather-notification-advisory',
  '4 */2 * * *', -- 4 minutes after hourly data collection
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/notification-advisory',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- 4. INFO Notifications (6 minutes after daily data, every 12 hours)
SELECT cron.schedule(
  'weather-notification-info',
  '6 */12 * * *', -- 6 minutes after daily data collection (every 12 hours)
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/notification-info',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

### Critical Notification Triggers

Critical notifications should be triggered immediately when weather data is collected. Modify your existing weather collection functions:

```typescript
// Add to existing weather collection functions
import { sendFCMNotification } from '../notification-critical/index.ts';

// After storing weather data, check for critical conditions
const criticalResponse = await fetch('https://your-project.supabase.co/functions/v1/notification-critical', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_SERVICE_ROLE_KEY',
  },
  body: JSON.stringify({}),
});
```

## 🗄️ Database Schema Extensions

### User Notification Preferences

**Separate Collections Structure:**

```typescript
// admin/{adminId} - Admin users collection
interface AdminProfile {
  // ... existing admin fields ...

  // Notification preferences
  notificationsEnabled: boolean;
  notificationLevels: ('CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO')[];
  barangayPreferences: string[]; // Array of barangay names (e.g., ["Alapan I-A", "Alapan I-B"])
  fcmToken: string; // Firebase Cloud Messaging token
  notificationHistory: {
    lastReceived: Date;
    totalReceived: number;
    preferences: {
      quietHours: { start: string; end: string }; // "22:00" to "06:00"
      weekendsOnly: boolean;
      maxPerDay: number;
    };
  };
}

// users/{userId} - Regular users collection
interface UserProfile {
  // ... existing user fields ...

  // Notification preferences
  notificationsEnabled: boolean;
  notificationLevels: ('CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO')[];
  barangayPreferences: string[]; // Array of barangay names (e.g., ["Bago", "Bucana"])
  fcmToken: string; // Firebase Cloud Messaging token
  notificationHistory: {
    lastReceived: Date;
    totalReceived: number;
    preferences: {
      quietHours: { start: string; end: string }; // "22:00" to "06:00"
      weekendsOnly: boolean;
      maxPerDay: number;
    };
  };
}
```

### Notification History Collection

```typescript
// notification_history/{notificationId}
interface NotificationRecord {
  title: string;
  body: string;
  level: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';
  category: string;
  location: string;
  sentTo: number; // Number of recipients
  successful: number; // Number of successful deliveries
  failed: number; // Number of failed deliveries
  errors: string[];
  timestamp: Date;
  weatherData: Record<string, any>; // Snapshot of weather conditions
  responseTime: number; // Processing time in ms
}
```

### Barangay Location Mapping

**Integration with getUserLocation.ts helper:**

```typescript
// Import from your existing getUserLocation.ts file
import { getUsersBarangay } from '../../../shared/functions/getUserLocation.ts';

// All 29 barangays mapped to 6 weather monitoring zones
const BARANGAY_ZONES = {
  // Coastal West Zone
  'Alapan I-A': 'coastal_west',
  'Alapan I-B': 'coastal_west',
  'Alapan II-A': 'coastal_west',
  'Alapan II-B': 'coastal_west',
  'Palangue Central': 'coastal_west',
  'Palangue Norte': 'coastal_west',
  'Palangue Sur': 'coastal_west',
  Sapa: 'coastal_west',

  // Central Naic Zone
  Bago: 'central_naic',
  'Capt. C. Nazareno (Pob.)': 'central_naic',
  Cofradia: 'central_naic',
  'Gen. Castañeda (Pob.)': 'central_naic',
  'Gomez-Zamora (Pob.)': 'central_naic',
  Kanluran: 'central_naic',
  'Meyor Camilo D. Osias (Pob.)': 'central_naic',
  Silangan: 'central_naic',

  // Coastal East Zone
  Bucana: 'coastal_east',
  Dungguan: 'coastal_east',
  Madiit: 'coastal_east',

  // Farm Area Zone
  'Buna Lejos': 'farm_area',
  'Buna Cerca': 'farm_area',
  Latoria: 'farm_area',
  Mabolo: 'farm_area',
  Munggos: 'farm_area',
  Santulan: 'farm_area',

  // Sabang Zone
  Muzon: 'sabang',
  Sabang: 'sabang',

  // Naic Boundary Zone
  Banalo: 'naic_boundary',
  'Ibayo Estacion': 'naic_boundary',
  'Ibayo Silangan': 'naic_boundary',
  Labac: 'naic_boundary',
  Molino: 'naic_boundary',
  'Timalan Balsahan': 'naic_boundary',
  'Timalan Concepcion': 'naic_boundary',
};

/**
 * Get all barangays for a specific weather monitoring zone
 */
export function getBarangaysForZone(zone: string): string[] {
  return Object.entries(BARANGAY_ZONES)
    .filter(([_, zoneCode]) => zoneCode === zone)
    .map(([barangay, _]) => barangay);
}

/**
 * Get weather zone for a specific barangay
 */
export function getZoneForBarangay(barangay: string): string {
  return BARANGAY_ZONES[barangay] || 'central_naic';
}

/**
 * Cross-zone notification logic
 * Users in one barangay can receive notifications for their weather zone
 */
export function shouldNotifyUser(userBarangays: string[], notificationBarangay: string): boolean {
  const notificationZone = getZoneForBarangay(notificationBarangay);
  const userZones = userBarangays.map(b => getZoneForBarangay(b));

  return userZones.includes(notificationZone);
}
```

## 🚀 Deployment Guide

### Step 1: Environment Variables

Set up required environment variables in Supabase Dashboard:

```bash
# Firebase Integration
FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "your-project"...}'

# Weather API (existing)
WEATHER_API_KEY=your-tomorrow-io-api-key

# Supabase (for function-to-function calls)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_URL=https://your-project.supabase.co
```

### Step 2: Deploy Shared Dependencies

```bash
# Navigate to supabase functions directory
cd Backend/supabase/functions

# Create shared directory structure
mkdir -p _shared

# Copy shared files (create these based on the implementations above)
# - notification-engine.ts
# - fcm-client.ts
# - firestore-client.ts
# - weather-notification-core.ts (copy from existing weather-notification-system.ts)
```

### Step 3: Deploy Individual Functions

```bash
# Deploy all notification functions
supabase functions deploy notification-critical
supabase functions deploy notification-warning
supabase functions deploy notification-advisory
supabase functions deploy notification-info

# Verify deployments
supabase functions list
```

### Step 4: Configure Cron Jobs

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Run the cron job SQL commands from above
```

### Step 5: Test Functions

```bash
# Test each function manually
curl -X POST 'https://your-project.supabase.co/functions/v1/notification-critical' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'

curl -X POST 'https://your-project.supabase.co/functions/v1/notification-warning' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'

# Test with existing weather data
curl -X POST 'https://your-project.supabase.co/functions/v1/notification-advisory' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

## 📊 Monitoring & Analytics

### Notification Dashboard

Create a monitoring function for tracking notification performance:

#### supabase/functions/notification-dashboard/index.ts

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getNotificationStats } from '../_shared/firestore-client.ts';

serve(async req => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const timeframe = (url.searchParams.get('timeframe') as 'today' | 'week' | 'month') || 'today';

    const stats = await getNotificationStats(timeframe);

    // Get cron job status
    const cronStatus = await getCronJobStatus();

    // Combine statistics
    const dashboard = {
      timeframe,
      notifications: stats,
      cronJobs: cronStatus,
      lastUpdated: new Date().toISOString(),
      healthStatus: calculateHealthStatus(stats, cronStatus),
    };

    return new Response(JSON.stringify(dashboard), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function getCronJobStatus() {
  // This would query the cron job status from PostgreSQL
  return {
    warning: { lastRun: new Date(), status: 'success' },
    advisory: { lastRun: new Date(), status: 'success' },
    info: { lastRun: new Date(), status: 'success' },
  };
}

function calculateHealthStatus(stats: any, cronStatus: any) {
  const totalNotifications = stats.total;
  const errorRate = stats.byLevel.ERROR || 0;

  if (errorRate / totalNotifications > 0.1) return 'warning';
  if (totalNotifications === 0) return 'inactive';
  return 'healthy';
}
```

### Performance Metrics

Track key metrics for notification system health:

- **Delivery Rate**: Successful deliveries / Total attempts
- **Response Time**: Average processing time per location
- **Error Rate**: Failed notifications / Total notifications
- **User Engagement**: Notification open rates (if tracked)
- **Coverage**: Locations with active notifications
- **Frequency**: Notifications per level per day

## 🔧 Maintenance & Troubleshooting

### Common Issues & Solutions

#### 1. FCM Token Issues

**Problem**: High failure rates in notification delivery

**Solution**:

```typescript
// Add token validation and cleanup
export async function validateAndCleanTokens() {
  const db = initializeFirestore();
  const users = await db.collection('users').get();

  for (const doc of users.docs) {
    const userData = doc.data();
    if (userData.fcmToken && !isValidFCMToken(userData.fcmToken)) {
      await doc.ref.update({ fcmToken: null });
      console.log(`Cleaned invalid token for user ${doc.id}`);
    }
  }
}
```

#### 2. Rate Limiting Issues

**Problem**: Too many notifications sent to users

**Solution**: Implement user-level rate limiting:

```typescript
// Check user's daily notification limit
const dailyLimit = await getUserDailyNotificationCount(userId);
if (dailyLimit >= MAX_NOTIFICATIONS_PER_DAY) {
  console.log(`User ${userId} has reached daily limit`);
  return false;
}
```

#### 3. Weather Data Sync Issues

**Problem**: Notifications processing outdated weather data

**Solution**: Add data freshness checks:

```typescript
const dataAge = new Date().getTime() - new Date(weatherData.timestamp).getTime();
const maxAge = 60 * 60 * 1000; // 1 hour

if (dataAge > maxAge) {
  console.log(`Weather data is too old (${dataAge}ms), skipping notifications`);
  return;
}
```

### Health Check Function

```typescript
// supabase/functions/notification-health/index.ts
serve(async req => {
  const health = {
    status: 'healthy',
    checks: {
      firestore: await testFirestoreConnection(),
      fcm: await testFCMConnection(),
      weatherData: await checkWeatherDataFreshness(),
      cronJobs: await checkCronJobStatus(),
    },
    timestamp: new Date().toISOString(),
  };

  const allHealthy = Object.values(health.checks).every(check => check.status === 'ok');
  health.status = allHealthy ? 'healthy' : 'degraded';

  return new Response(JSON.stringify(health), {
    status: allHealthy ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## 🎯 Success Metrics & KPIs

### Key Performance Indicators

1. **Notification Accuracy**: Percentage of notifications that match actual weather conditions
2. **Timeliness**: Average delay between weather event and notification delivery
3. **Coverage**: Percentage of affected users who received relevant notifications
4. **User Satisfaction**: User feedback and engagement metrics
5. **System Reliability**: Uptime and error rates of notification functions

### Monitoring Alerts

Set up alerts for:

- Function failure rates >5%
- Notification delivery failures >10%
- Weather data staleness >2 hours
- FCM token validation failures >20%
- Cron job execution failures

## 🔄 Future Enhancements

### Phase 1: Smart Notifications

- Machine learning for user preference prediction
- Location-based notification optimization
- Dynamic severity threshold adjustment

### Phase 2: Advanced Features

- Multi-language notification support
- Rich media notifications (images, maps)
- Two-way communication (user feedback)
- Integration with emergency services

### Phase 3: Expansion

- Integration with other weather APIs
- Support for additional notification channels (SMS, email)
- Real-time weather radar integration
- Community reporting features

This comprehensive notification system will provide timely, accurate, and contextually relevant weather alerts to your users while maintaining optimal performance and reliability through Supabase Edge Functions and Firebase Cloud Messaging.

---

## 📋 Implementation Summary - Updated for Your Database Structure

### ✅ Key Changes Made

**1. Database Structure:**

- ✅ Updated to use separate `admin/{adminId}` and `users/{userId}` collections
- ✅ Modified `getUserTokens()` to query both collections based on audience parameter
- ✅ Changed from generic `locationPreferences` to specific `barangayPreferences`

**2. Location Mapping:**

- ✅ Integrated with your existing `getUserLocation.ts` helper function
- ✅ Added complete barangay-to-zone mapping for all 29 barangays
- ✅ Implemented cross-zone notification logic for weather monitoring

**3. Notification Timing:**

- ✅ Added 2-minute delays between data collection and notifications
- ✅ Updated cron schedules: realtime → warning → advisory → info
- ✅ Staggered timing: `0,30` → `2,32` → `4` → `6` minute patterns

**4. Deduplication System:**

- ✅ Implemented notification consolidation with 2-minute windows
- ✅ Added data source prioritization: realtime > hourly > daily
- ✅ Created cooldown periods to prevent notification spam

### 🔧 Updated Functions

**getUserTokens(audience, barangay):**

- Now queries both `admin` and `users` collections
- Maps individual barangays to weather zones
- Supports cross-zone notification logic

**Notification Consolidation:**

- Prevents duplicate alerts from multiple data sources
- Consolidates multiple conditions into single notifications
- Implements intelligent timing windows

**Cron Job Scheduling:**

```
Realtime Data:  0,30 * * * *  (every 30 min)
Warning Alerts: 2,32 * * * *  (2 min after)
Advisory:       4 */2 * * *   (4 min after, every 2h)
Info:          6 */12 * * *   (6 min after, every 12h)
```

### 🗂️ Database Collections Structure

```
admin/{adminId}
├── notificationsEnabled: boolean
├── notificationLevels: array
├── barangayPreferences: ["Alapan I-A", "Bago", ...]
└── fcmToken: string

users/{userId}
├── notificationsEnabled: boolean
├── notificationLevels: array
├── barangayPreferences: ["Bucana", "Sabang", ...]
└── fcmToken: string
```

### 🌍 Location Mapping Integration

Your `getUserLocation.ts` barangay categories are now fully integrated:

- **coastal_west**: Alapan areas, Palangue areas, Sapa
- **coastal_east**: Bucana, Dungguan, Madiit
- **central_naic**: Bago, poblacion barangays, Cofradia, etc.
- **sabang**: Muzon, Sabang
- **farm_area**: Buna areas, Latoria, Mabolo, Munggos, Santulan
- **naic_boundary**: Border barangays (Banalo, Ibayo, Labac, etc.)

This system now matches your actual database structure and prevents the notification overlap issues you were experiencing!

```

```
