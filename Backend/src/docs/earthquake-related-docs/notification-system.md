# Firebase Cloud Messaging (FCM) Notification System

## Overview

The FCM notification system delivers real-time earthquake alerts to all registered users and administrators. The system categorizes earthquakes by severity and sends appropriate notifications with user-friendly messages.

## Notification Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Edge Function │────│   FCM Service   │────│   Mobile Apps   │
│  (New Earthquake)│    │   (Firebase)    │    │ (Push Notifications)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ├─── Format Message ────┤                       │
         ├─── Set Priority ──────┤                       │
         ├─── Target Audience ───┤                       │
         └─── Send Notification ─┴─── Deliver to Users ──┘
```

## Earthquake Severity Classification

### Magnitude-Based Classification

| Magnitude | Classification | Priority  | Notification               | Icon |
| --------- | -------------- | --------- | -------------------------- | ---- |
| < 2.0     | Micro          | None      | No notification            | -    |
| 2.0 - 2.9 | Minor          | Low       | Silent notification        | 🟢   |
| 3.0 - 3.9 | Minor          | Low       | Silent with vibration      | 🟡   |
| 4.0 - 4.9 | Light          | Medium    | Standard notification      | 🟠   |
| 5.0 - 5.9 | Moderate       | High      | High priority + sound      | 🔴   |
| 6.0 - 6.9 | Strong         | Critical  | Critical alert + vibration | 🚨   |
| 7.0 - 7.9 | Major          | Critical  | Emergency alert + siren    | ⚠️   |
| 8.0+      | Great          | Emergency | Emergency broadcast        | 🆘   |

## Notification Message Templates

### Template Structure

```typescript
interface NotificationTemplate {
  title: string;
  body: string;
  icon: string;
  priority: 'low' | 'normal' | 'high';
  sound: string;
  vibration: number[];
  color: string;
  category: string;
}
```

### Message Templates by Severity

#### Minor Earthquakes (2.0 - 3.9)

```typescript
const minorTemplate = {
  title: '🟡 Minor Earthquake Detected',
  body: 'A magnitude {magnitude} earthquake occurred {location}. No immediate action required.',
  icon: 'earthquake_minor',
  priority: 'low',
  sound: 'default',
  vibration: [200, 100, 200],
  color: '#FFA500',
  category: 'earthquake_minor',
};
```

#### Light Earthquakes (4.0 - 4.9)

```typescript
const lightTemplate = {
  title: '🟠 Earthquake Alert - Magnitude {magnitude}',
  body: 'A magnitude {magnitude} earthquake occurred {location} at {time}. Stay alert and follow safety protocols.',
  icon: 'earthquake_light',
  priority: 'normal',
  sound: 'notification',
  vibration: [300, 200, 300, 200, 300],
  color: '#FF8C00',
  category: 'earthquake_light',
};
```

#### Moderate Earthquakes (5.0 - 5.9)

```typescript
const moderateTemplate = {
  title: '🔴 Strong Earthquake Alert - Magnitude {magnitude}',
  body: '⚠️ A magnitude {magnitude} earthquake occurred {location}. Take immediate safety precautions. Drop, Cover, and Hold On!',
  icon: 'earthquake_moderate',
  priority: 'high',
  sound: 'alert',
  vibration: [500, 300, 500, 300, 500],
  color: '#FF4500',
  category: 'earthquake_moderate',
};
```

#### Strong Earthquakes (6.0 - 6.9)

```typescript
const strongTemplate = {
  title: '🚨 CRITICAL EARTHQUAKE ALERT - Magnitude {magnitude}',
  body: '🆘 CRITICAL: Magnitude {magnitude} earthquake {location}. IMMEDIATE ACTION REQUIRED. Seek shelter immediately! Drop, Cover, Hold On!',
  icon: 'earthquake_strong',
  priority: 'high',
  sound: 'emergency',
  vibration: [1000, 500, 1000, 500, 1000],
  color: '#DC143C',
  category: 'earthquake_critical',
};
```

#### Major/Great Earthquakes (7.0+)

```typescript
const majorTemplate = {
  title: '🆘 EMERGENCY EARTHQUAKE ALERT - Magnitude {magnitude}',
  body: '🚨 EMERGENCY: Major earthquake magnitude {magnitude} {location}. EXTREME DANGER! Follow emergency procedures immediately. Evacuate if necessary!',
  icon: 'earthquake_emergency',
  priority: 'high',
  sound: 'emergency_siren',
  vibration: [1000, 200, 1000, 200, 1000, 200, 1000],
  color: '#8B0000',
  category: 'earthquake_emergency',
};
```

## FCM Service Implementation

### FCM Service Class

```typescript
// services/fcm.ts
export class FCMService {
  private static readonly FCM_URL = 'https://fcm.googleapis.com/fcm/send';
  private static readonly SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');

  static async sendNotification(notification: NotificationPayload): Promise<FCMResponse> {
    try {
      console.log(
        `📱 Sending ${notification.priority} priority notification for magnitude ${notification.magnitude} earthquake`
      );

      const payload = this.buildFCMPayload(notification);

      const response = await fetch(this.FCM_URL, {
        method: 'POST',
        headers: {
          Authorization: `key=${this.SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`FCM request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Notification sent successfully:`, result);

      return {
        success: true,
        messageId: result.message_id,
        response: result,
      };
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private static buildFCMPayload(notification: NotificationPayload): FCMPayload {
    const template = this.getTemplateForMagnitude(notification.magnitude);

    return {
      to: '/topics/earthquake_alerts', // Send to all subscribed users
      priority: notification.priority === 'critical' ? 'high' : 'normal',
      notification: {
        title: this.formatTemplate(template.title, notification),
        body: this.formatTemplate(template.body, notification),
        icon: template.icon,
        color: template.color,
        sound: template.sound,
        tag: `earthquake_${notification.earthquakeId}`, // Prevent duplicate notifications
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      data: {
        type: 'earthquake_alert',
        earthquake_id: notification.earthquakeId,
        magnitude: notification.magnitude.toString(),
        location: notification.location,
        latitude: notification.coordinates.latitude.toString(),
        longitude: notification.coordinates.longitude.toString(),
        depth: notification.coordinates.depth.toString(),
        time: notification.time.toString(),
        severity: notification.severity,
        tsunami_warning: notification.tsunamiWarning.toString(),
        usgs_url: notification.usgsUrl || '',
        timestamp: Date.now().toString(),
      },
      android: {
        priority: notification.priority === 'critical' ? 'high' : 'normal',
        notification: {
          channel_id: `earthquake_${notification.severity}`,
          vibrate_timings: template.vibration,
          default_vibrate_timings: false,
          priority: notification.priority === 'critical' ? 'high' : 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: this.formatTemplate(template.title, notification),
              body: this.formatTemplate(template.body, notification),
            },
            sound: template.sound,
            category: template.category,
            'thread-id': 'earthquake_alerts',
          },
        },
      },
    };
  }

  private static getTemplateForMagnitude(magnitude: number): NotificationTemplate {
    if (magnitude < 2.0) {
      return null; // No notification
    } else if (magnitude < 4.0) {
      return minorTemplate;
    } else if (magnitude < 5.0) {
      return lightTemplate;
    } else if (magnitude < 6.0) {
      return moderateTemplate;
    } else if (magnitude < 7.0) {
      return strongTemplate;
    } else {
      return majorTemplate;
    }
  }

  private static formatTemplate(template: string, notification: NotificationPayload): string {
    return template
      .replace('{magnitude}', notification.magnitude.toString())
      .replace('{location}', notification.location)
      .replace('{time}', new Date(notification.time).toLocaleTimeString())
      .replace('{date}', new Date(notification.time).toLocaleDateString());
  }
}
```

### Notification Payload Interface

```typescript
interface NotificationPayload {
  earthquakeId: string;
  magnitude: number;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
    depth: number;
  };
  time: number;
  severity: 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';
  priority: 'low' | 'normal' | 'high' | 'critical';
  tsunamiWarning: boolean;
  usgsUrl?: string;
}

interface FCMPayload {
  to: string;
  priority: 'normal' | 'high';
  notification: {
    title: string;
    body: string;
    icon: string;
    color: string;
    sound: string;
    tag: string;
    click_action: string;
  };
  data: Record<string, string>;
  android: {
    priority: 'normal' | 'high';
    notification: {
      channel_id: string;
      vibrate_timings: number[];
      default_vibrate_timings: boolean;
      priority: 'default' | 'high';
    };
  };
  apns: {
    payload: {
      aps: {
        alert: {
          title: string;
          body: string;
        };
        sound: string;
        category: string;
        'thread-id': string;
      };
    };
  };
}

interface FCMResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  response?: any;
}
```

## Notification Formatting Utility

```typescript
// utils/notification.ts
export function formatNotification(earthquake: USGSEarthquake): NotificationPayload {
  const magnitude = earthquake.properties.mag;
  const severity = classifyEarthquakeSeverity(magnitude);
  const priority = determinePriority(magnitude);

  return {
    earthquakeId: earthquake.id,
    magnitude: magnitude,
    location: cleanLocationName(earthquake.properties.place),
    coordinates: {
      latitude: earthquake.geometry.coordinates[1],
      longitude: earthquake.geometry.coordinates[0],
      depth: earthquake.geometry.coordinates[2],
    },
    time: earthquake.properties.time,
    severity: severity,
    priority: priority,
    tsunamiWarning: earthquake.properties.tsunami === 1,
    usgsUrl: earthquake.properties.url,
  };
}

function classifyEarthquakeSeverity(magnitude: number): string {
  if (magnitude < 2.0) return 'micro';
  if (magnitude < 4.0) return 'minor';
  if (magnitude < 5.0) return 'light';
  if (magnitude < 6.0) return 'moderate';
  if (magnitude < 7.0) return 'strong';
  if (magnitude < 8.0) return 'major';
  return 'great';
}

function determinePriority(magnitude: number): string {
  if (magnitude < 3.0) return 'low';
  if (magnitude < 5.0) return 'normal';
  if (magnitude < 6.0) return 'high';
  return 'critical';
}

function cleanLocationName(place: string): string {
  // Clean up location names for better readability
  return place
    .replace(/^\d+\s*km\s+/, '') // Remove distance prefix
    .replace(/\s+of\s+/, ' of ')
    .trim();
}
```

## Mobile App Integration

### Android Notification Channels

```kotlin
// Create notification channels for different earthquake severities
fun createNotificationChannels(context: Context) {
    val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    // Minor earthquakes channel
    val minorChannel = NotificationChannel(
        "earthquake_minor",
        "Minor Earthquakes",
        NotificationManager.IMPORTANCE_LOW
    ).apply {
        description = "Minor earthquake alerts (magnitude 2.0-3.9)"
        enableVibration(true)
        vibrationPattern = longArrayOf(200, 100, 200)
        setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), null)
    }

    // Light earthquakes channel
    val lightChannel = NotificationChannel(
        "earthquake_light",
        "Light Earthquakes",
        NotificationManager.IMPORTANCE_DEFAULT
    ).apply {
        description = "Light earthquake alerts (magnitude 4.0-4.9)"
        enableVibration(true)
        vibrationPattern = longArrayOf(300, 200, 300, 200, 300)
        setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), null)
    }

    // Moderate earthquakes channel
    val moderateChannel = NotificationChannel(
        "earthquake_moderate",
        "Moderate Earthquakes",
        NotificationManager.IMPORTANCE_HIGH
    ).apply {
        description = "Moderate earthquake alerts (magnitude 5.0-5.9)"
        enableVibration(true)
        vibrationPattern = longArrayOf(500, 300, 500, 300, 500)
        setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), null)
    }

    // Critical earthquakes channel
    val criticalChannel = NotificationChannel(
        "earthquake_critical",
        "Critical Earthquakes",
        NotificationManager.IMPORTANCE_HIGH
    ).apply {
        description = "Critical earthquake alerts (magnitude 6.0+)"
        enableVibration(true)
        vibrationPattern = longArrayOf(1000, 500, 1000, 500, 1000)
        setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), null)
    }

    notificationManager.createNotificationChannels(listOf(
        minorChannel, lightChannel, moderateChannel, criticalChannel
    ))
}
```

### iOS Notification Categories

```swift
// Configure notification categories for iOS
func setupNotificationCategories() {
    let earthquakeMinorCategory = UNNotificationCategory(
        identifier: "earthquake_minor",
        actions: [],
        intentIdentifiers: [],
        options: []
    )

    let earthquakeLightCategory = UNNotificationCategory(
        identifier: "earthquake_light",
        actions: [
            UNNotificationAction(
                identifier: "view_details",
                title: "View Details",
                options: .foreground
            )
        ],
        intentIdentifiers: [],
        options: []
    )

    let earthquakeModerateCategory = UNNotificationCategory(
        identifier: "earthquake_moderate",
        actions: [
            UNNotificationAction(
                identifier: "view_details",
                title: "View Details",
                options: .foreground
            ),
            UNNotificationAction(
                identifier: "safety_tips",
                title: "Safety Tips",
                options: .foreground
            )
        ],
        intentIdentifiers: [],
        options: .criticalAlert
    )

    let earthquakeCriticalCategory = UNNotificationCategory(
        identifier: "earthquake_critical",
        actions: [
            UNNotificationAction(
                identifier: "emergency_info",
                title: "Emergency Info",
                options: .foreground
            )
        ],
        intentIdentifiers: [],
        options: [.criticalAlert, .customDismissAction]
    )

    UNUserNotificationCenter.current().setNotificationCategories([
        earthquakeMinorCategory,
        earthquakeLightCategory,
        earthquakeModerateCategory,
        earthquakeCriticalCategory
    ])
}
```

## Topic Subscription Management

### User Subscription

```typescript
// Subscribe users to earthquake alerts topic
export async function subscribeToEarthquakeAlerts(fcmToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://iid.googleapis.com/iid/v1:batchAdd', {
      method: 'POST',
      headers: {
        Authorization: `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: '/topics/earthquake_alerts',
        registration_tokens: [fcmToken],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to subscribe to earthquake alerts:', error);
    return false;
  }
}

// Subscribe admin users to admin-specific alerts
export async function subscribeToAdminAlerts(fcmToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://iid.googleapis.com/iid/v1:batchAdd', {
      method: 'POST',
      headers: {
        Authorization: `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: '/topics/earthquake_alerts_admin',
        registration_tokens: [fcmToken],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to subscribe to admin alerts:', error);
    return false;
  }
}
```

## Notification Analytics

### Tracking Delivery

```typescript
interface NotificationAnalytics {
  notification_id: string;
  earthquake_id: string;
  sent_at: number;
  delivery_status: 'sent' | 'delivered' | 'opened' | 'dismissed';
  platform: 'android' | 'ios';
  app_version: string;
  device_model: string;
  user_id?: string;
}

// Track notification delivery
export async function trackNotificationDelivery(
  notificationId: string,
  earthquakeId: string,
  status: string,
  metadata: any
): Promise<void> {
  const analytics: NotificationAnalytics = {
    notification_id: notificationId,
    earthquake_id: earthquakeId,
    sent_at: Date.now(),
    delivery_status: status as any,
    platform: metadata.platform,
    app_version: metadata.appVersion,
    device_model: metadata.deviceModel,
    user_id: metadata.userId,
  };

  // Save to analytics collection
  await db.collection('notification_analytics').add(analytics);
}
```

## Error Handling and Fallbacks

### Retry Logic

```typescript
class NotificationRetryHandler {
  static async sendWithRetry(notification: NotificationPayload, maxRetries: number = 3): Promise<FCMResponse> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Sending notification (attempt ${attempt}/${maxRetries})`);

        const result = await FCMService.sendNotification(notification);

        if (result.success) {
          return result;
        }

        lastError = new Error(result.error);
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}
```

### Fallback Notification Methods

```typescript
// Fallback to SMS for critical earthquakes if FCM fails
export async function sendSMSFallback(notification: NotificationPayload): Promise<void> {
  if (notification.priority !== 'critical') return;

  try {
    const smsMessage = `EARTHQUAKE ALERT: Magnitude ${notification.magnitude} earthquake detected ${notification.location}. Take immediate safety precautions.`;

    // Send SMS to emergency contacts/administrators
    await sendEmergencySMS(smsMessage);
  } catch (error) {
    console.error('SMS fallback failed:', error);
  }
}

// Send email notifications for major earthquakes
export async function sendEmailFallback(notification: NotificationPayload): Promise<void> {
  if (notification.magnitude < 6.0) return;

  try {
    const emailContent = {
      subject: `CRITICAL: Magnitude ${notification.magnitude} Earthquake Alert`,
      body: `
        A magnitude ${notification.magnitude} earthquake has been detected.
        
        Location: ${notification.location}
        Time: ${new Date(notification.time).toLocaleString()}
        Coordinates: ${notification.coordinates.latitude}, ${notification.coordinates.longitude}
        Depth: ${notification.coordinates.depth} km
        Tsunami Warning: ${notification.tsunamiWarning ? 'YES' : 'NO'}
        
        Please ensure all emergency protocols are activated.
        
        USGS Details: ${notification.usgsUrl}
      `,
    };

    await sendEmergencyEmail(emailContent);
  } catch (error) {
    console.error('Email fallback failed:', error);
  }
}
```

## Testing Notifications

### Test Implementation

```typescript
// Test notification with mock earthquake data
export async function testEarthquakeNotification(magnitude: number = 4.5): Promise<void> {
  const mockEarthquake: USGSEarthquake = {
    id: `test_${Date.now()}`,
    type: 'Feature',
    properties: {
      mag: magnitude,
      place: '15 km SW of Test City, Philippines',
      time: Date.now(),
      updated: Date.now(),
      tz: null,
      url: 'https://earthquake.usgs.gov/earthquakes/eventpage/test123',
      detail: 'https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=test123&format=geojson',
      felt: null,
      cdi: null,
      mmi: null,
      alert: null,
      status: 'reviewed',
      tsunami: 0,
      sig: Math.floor(magnitude * 100),
      net: 'us',
      code: 'test123',
      ids: ',test123,',
      sources: ',us,',
      types: ',origin,',
      nst: 25,
      dmin: 10.5,
      rms: 0.8,
      gap: 85,
      magType: 'mb',
      type: 'earthquake',
      title: `M ${magnitude} - Test Earthquake`,
    },
    geometry: {
      type: 'Point',
      coordinates: [120.8377, 13.7424, 10.0],
    },
  };

  const notification = formatNotification(mockEarthquake);
  const result = await FCMService.sendNotification(notification);

  console.log('Test notification result:', result);
}
```

## Monitoring and Metrics

### Key Metrics to Track

1. **Delivery Rate**: Percentage of successfully delivered notifications
2. **Response Time**: Time between earthquake detection and notification delivery
3. **User Engagement**: Open rates, dismissal rates, action clicks
4. **Platform Distribution**: Android vs iOS delivery success rates
5. **Geographic Reach**: Number of users notified by location
6. **Error Rates**: Failed delivery attempts and reasons

### Dashboard Queries

```typescript
// Get notification delivery statistics
const getDeliveryStats = async (timeRange: { start: number; end: number }) => {
  return await db
    .collection('notifications')
    .where('sent_at', '>=', timeRange.start)
    .where('sent_at', '<=', timeRange.end)
    .get();
};

// Get user engagement metrics
const getEngagementStats = async (earthquakeId: string) => {
  return await db.collection('notification_analytics').where('earthquake_id', '==', earthquakeId).get();
};
```

This comprehensive notification system ensures that users receive timely, appropriate, and actionable earthquake alerts based on the severity and characteristics of each seismic event.
