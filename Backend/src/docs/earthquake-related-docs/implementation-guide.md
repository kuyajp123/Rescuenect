# Earthquake Monitoring System Implementation Guide

## Prerequisites

Before implementing the earthquake monitoring system, ensure you have the following:

### Required Services and Accounts

1. **Supabase Account**

   - Create account at [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Firebase Project**

   - Create project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Cloud Messaging (FCM)
   - Generate service account key

3. **USGS API Access**
   - No registration required
   - Rate limits apply (use responsibly)

### Development Environment

```bash
# Required tools
node --version    # v16+ required
npm --version     # v8+ required
deno --version    # v1.30+ required

# Install Supabase CLI
npm install -g supabase

# Install Firebase CLI
npm install -g firebase-tools
```

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore
firebase init functions
```

### 1.2 Configure Firestore

Create security rules in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access to earthquake data
    match /earthquakes/{earthquakeId} {
      allow read: if true;
      allow write: if false; // Only server functions can write
    }

    // Authenticated read access to notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server functions can write
    }

    // Admin access for management
    match /{document=**} {
      allow read, write: if request.auth != null &&
        request.auth.token.admin == true;
    }
  }
}
```

### 1.3 Create Firestore Indexes

```bash
# Create indexes for efficient queries
firebase firestore:indexes --dry-run

# Apply indexes from firestore.indexes.json
firebase deploy --only firestore:indexes
```

Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "earthquakes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "time", "order": "DESCENDING" },
        { "fieldPath": "magnitude", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "earthquakes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "magnitude", "order": "DESCENDING" },
        { "fieldPath": "time", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sent_at", "order": "DESCENDING" },
        { "fieldPath": "priority", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 1.4 Configure Firebase Cloud Messaging

1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Generate a new server key
3. Save the server key for later use

## Step 2: Supabase Edge Function Setup

### 2.1 Initialize Supabase Project

```bash
# Create new Supabase project locally
supabase init

# Link to your Supabase project
supabase link --project-ref your-project-reference
```

### 2.2 Create Edge Function Structure

```bash
# Create the earthquake monitor function
supabase functions new earthquake-monitor

# Directory structure will be created:
# supabase/functions/earthquake-monitor/index.ts
```

### 2.3 Implement Edge Function

Create the main function file:

**supabase/functions/earthquake-monitor/index.ts**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types
interface USGSEarthquake {
  id: string;
  type: 'Feature';
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    tsunami: number;
    status: string;
    title: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [lng, lat, depth]
  };
}

interface USGSResponse {
  type: 'FeatureCollection';
  features: USGSEarthquake[];
  metadata: {
    count: number;
    status: number;
  };
}

// Configuration
const USGS_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')!;
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')!;
const FIREBASE_SERVICE_ACCOUNT = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!);

serve(async req => {
  try {
    console.log('🔍 Starting earthquake monitoring cycle...');

    // Step 1: Fetch earthquake data from USGS
    const earthquakeData = await fetchUSGSData();
    console.log(`📊 Fetched ${earthquakeData.features.length} earthquakes`);

    if (earthquakeData.features.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No earthquakes found',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Step 2: Get existing earthquakes from Firestore
    const existingEarthquakes = await getExistingEarthquakes();
    console.log(`🗄️ Found ${existingEarthquakes.length} existing earthquakes`);

    // Step 3: Identify new earthquakes
    const newEarthquakes = earthquakeData.features.filter(
      quake => !existingEarthquakes.some(existing => existing.id === quake.id)
    );
    console.log(`🆕 Identified ${newEarthquakes.length} new earthquakes`);

    if (newEarthquakes.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No new earthquakes',
          existing_count: existingEarthquakes.length,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Step 4: Send notifications for new earthquakes
    const notificationResults = [];
    for (const earthquake of newEarthquakes) {
      try {
        const notificationResult = await sendEarthquakeNotification(earthquake);
        notificationResults.push({
          earthquakeId: earthquake.id,
          success: true,
          result: notificationResult,
        });
      } catch (error) {
        console.error(`❌ Failed to send notification for ${earthquake.id}:`, error);
        notificationResults.push({
          earthquakeId: earthquake.id,
          success: false,
          error: error.message,
        });
      }
    }

    // Step 5: Save new earthquakes to Firestore
    await saveEarthquakesToFirestore(newEarthquakes);

    // Step 6: Save notification records
    await saveNotificationRecords(newEarthquakes, notificationResults);

    console.log('✅ Earthquake monitoring cycle completed');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monitoring cycle completed',
        new_earthquakes: newEarthquakes.length,
        notifications_sent: notificationResults.filter(r => r.success).length,
        timestamp: new Date().toISOString(),
        earthquakes: newEarthquakes.map(eq => ({
          id: eq.id,
          magnitude: eq.properties.mag,
          place: eq.properties.place,
          time: new Date(eq.properties.time).toISOString(),
        })),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Monitoring cycle failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Fetch earthquake data from USGS
async function fetchUSGSData(): Promise<USGSResponse> {
  const params = new URLSearchParams({
    format: 'geojson',
    latitude: '14.2919325',
    longitude: '120.7752839',
    maxradiuskm: '150',
  });

  const response = await fetch(`${USGS_URL}?${params}`, {
    headers: {
      'User-Agent': 'Rescuenect-EarthquakeMonitor/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`USGS API failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Get existing earthquakes from Firestore
async function getExistingEarthquakes(): Promise<{ id: string }[]> {
  try {
    const token = await getFirebaseAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/earthquakes`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Firestore query failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return (data.documents || []).map((doc: any) => ({
      id: doc.name.split('/').pop(),
    }));
  } catch (error) {
    console.error('Error fetching existing earthquakes:', error);
    return [];
  }
}

// Send earthquake notification via FCM
async function sendEarthquakeNotification(earthquake: USGSEarthquake) {
  const magnitude = earthquake.properties.mag;
  const severity = classifyEarthquakeSeverity(magnitude);
  const priority = determinePriority(magnitude);

  // Skip notifications for micro earthquakes
  if (magnitude < 2.0) {
    return { skipped: true, reason: 'Below notification threshold' };
  }

  const notification = {
    to: '/topics/earthquake_alerts',
    priority: priority === 'critical' ? 'high' : 'normal',
    notification: {
      title: formatNotificationTitle(magnitude, severity),
      body: formatNotificationBody(earthquake),
      icon: 'earthquake_icon',
      color: getNotificationColor(severity),
      sound: 'default',
      tag: `earthquake_${earthquake.id}`,
    },
    data: {
      type: 'earthquake_alert',
      earthquake_id: earthquake.id,
      magnitude: magnitude.toString(),
      location: earthquake.properties.place,
      time: earthquake.properties.time.toString(),
      severity: severity,
      usgs_url: earthquake.properties.url,
    },
  };

  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${FCM_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notification),
  });

  if (!response.ok) {
    throw new Error(`FCM failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Save earthquakes to Firestore
async function saveEarthquakesToFirestore(earthquakes: USGSEarthquake[]) {
  const token = await getFirebaseAccessToken();

  for (const earthquake of earthquakes) {
    const doc = {
      id: earthquake.id,
      magnitude: earthquake.properties.mag,
      place: earthquake.properties.place,
      time: earthquake.properties.time,
      updated: earthquake.properties.updated,
      coordinates: {
        longitude: earthquake.geometry.coordinates[0],
        latitude: earthquake.geometry.coordinates[1],
        depth: earthquake.geometry.coordinates[2],
      },
      properties: earthquake.properties,
      created_at: Date.now(),
      updated_at: Date.now(),
      severity_level: classifyEarthquakeSeverity(earthquake.properties.mag),
      notification_sent: true,
    };

    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/earthquakes/${earthquake.id}`;

    await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: convertToFirestoreFields(doc),
      }),
    });
  }
}

// Save notification records
async function saveNotificationRecords(earthquakes: USGSEarthquake[], results: any[]) {
  const token = await getFirebaseAccessToken();

  for (let i = 0; i < earthquakes.length; i++) {
    const earthquake = earthquakes[i];
    const result = results[i];

    const notification = {
      id: `notif_${earthquake.id}_${Date.now()}`,
      earthquake_id: earthquake.id,
      type: 'earthquake_alert',
      title: formatNotificationTitle(earthquake.properties.mag, classifyEarthquakeSeverity(earthquake.properties.mag)),
      body: formatNotificationBody(earthquake),
      magnitude: earthquake.properties.mag,
      location: earthquake.properties.place,
      coordinates: {
        longitude: earthquake.geometry.coordinates[0],
        latitude: earthquake.geometry.coordinates[1],
        depth: earthquake.geometry.coordinates[2],
      },
      earthquake_time: earthquake.properties.time,
      sent_at: Date.now(),
      created_at: Date.now(),
      delivery_status: result.success ? 'sent' : 'failed',
      delivery_attempts: 1,
      fcm_response: result,
      priority: determinePriority(earthquake.properties.mag),
      severity_level: classifyEarthquakeSeverity(earthquake.properties.mag),
      tsunami_warning: earthquake.properties.tsunami === 1,
    };

    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/notifications`;

    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: convertToFirestoreFields(notification),
      }),
    });
  }
}

// Helper functions
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

function formatNotificationTitle(magnitude: number, severity: string): string {
  const icons = {
    minor: '🟡',
    light: '🟠',
    moderate: '🔴',
    strong: '🚨',
    major: '⚠️',
    great: '🆘',
  };

  return `${icons[severity] || '🔶'} Earthquake Alert - Magnitude ${magnitude}`;
}

function formatNotificationBody(earthquake: USGSEarthquake): string {
  const magnitude = earthquake.properties.mag;
  const location = earthquake.properties.place;
  const time = new Date(earthquake.properties.time).toLocaleTimeString();

  if (magnitude >= 6.0) {
    return `🆘 CRITICAL: Magnitude ${magnitude} earthquake ${location}. IMMEDIATE ACTION REQUIRED!`;
  } else if (magnitude >= 5.0) {
    return `⚠️ Strong earthquake detected: Magnitude ${magnitude} ${location} at ${time}. Take safety precautions!`;
  } else if (magnitude >= 4.0) {
    return `A magnitude ${magnitude} earthquake occurred ${location} at ${time}. Stay alert and follow safety protocols.`;
  } else {
    return `Minor earthquake detected: Magnitude ${magnitude} ${location} at ${time}.`;
  }
}

function getNotificationColor(severity: string): string {
  const colors = {
    minor: '#FFA500',
    light: '#FF8C00',
    moderate: '#FF4500',
    strong: '#DC143C',
    major: '#8B0000',
    great: '#8B0000',
  };

  return colors[severity] || '#FF8C00';
}

async function getFirebaseAccessToken(): Promise<string> {
  // This is a simplified version - in production, implement proper JWT generation
  // Using Firebase Admin SDK or service account key
  const jwt = await createFirebaseJWT();
  return jwt;
}

async function createFirebaseJWT(): Promise<string> {
  // Implementation for creating Firebase JWT token
  // This would use the service account key to generate a proper JWT
  // For now, return a placeholder
  return 'your-jwt-token-here';
}

function convertToFirestoreFields(obj: any): any {
  const fields: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { doubleValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = { arrayValue: { values: value.map(v => ({ doubleValue: v })) } };
    } else if (typeof value === 'object' && value !== null) {
      fields[key] = { mapValue: { fields: convertToFirestoreFields(value) } };
    }
  }

  return fields;
}
```

### 2.4 Configure Environment Variables

```bash
# Set environment variables for the function
supabase secrets set FIREBASE_PROJECT_ID=your-project-id
supabase secrets set FCM_SERVER_KEY=your-fcm-server-key
supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

### 2.5 Deploy Edge Function

```bash
# Deploy the function
supabase functions deploy earthquake-monitor

# Verify deployment
supabase functions list
```

## Step 3: Set Up Cron Scheduling

### 3.1 Configure Cron Schedule

Create `supabase/functions/earthquake-monitor/cron.ts`:

```typescript
// This file configures the cron schedule for the earthquake monitor
export const config = {
  schedule: '*/5 * * * *', // Every 5 minutes
  region: 'us-west-1',
  runtime: 'deno',
};
```

### 3.2 Enable Cron Trigger

```bash
# Enable cron trigger for the function
supabase functions create earthquake-monitor --cron="*/5 * * * *"

# Verify cron is enabled
supabase functions logs earthquake-monitor
```

## Step 4: Mobile App Integration

### 4.1 Configure FCM in Mobile App

**Android (android/app/src/main/AndroidManifest.xml)**

```xml
<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

**iOS (ios/Runner/AppDelegate.swift)**

```swift
import Firebase
import UserNotifications

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    FirebaseApp.configure()

    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self
      let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
      UNUserNotificationCenter.current().requestAuthorization(
        options: authOptions,
        completionHandler: {_, _ in })
    } else {
      let settings: UIUserNotificationSettings =
      UIUserNotificationSettings(types: [.alert, .badge, .sound], categories: nil)
      application.registerUserNotificationSettings(settings)
    }

    application.registerForRemoteNotifications()

    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

### 4.2 Subscribe to Earthquake Alerts Topic

**Flutter/React Native**

```dart
// Flutter implementation
import 'package:firebase_messaging/firebase_messaging.dart';

class EarthquakeNotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  static Future<void> initialize() async {
    // Request permission
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      criticalAlert: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Subscribe to earthquake alerts topic
      await _messaging.subscribeToTopic('earthquake_alerts');
      print('✅ Subscribed to earthquake alerts');
    }

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);

    // Handle notification tap
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }

  static void _handleForegroundMessage(RemoteMessage message) {
    print('📱 Received foreground message: ${message.messageId}');

    if (message.data['type'] == 'earthquake_alert') {
      _showEarthquakeAlert(message);
    }
  }

  static Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    print('📱 Received background message: ${message.messageId}');
  }

  static void _handleNotificationTap(RemoteMessage message) {
    print('📱 Notification tapped: ${message.messageId}');

    if (message.data['type'] == 'earthquake_alert') {
      _navigateToEarthquakeDetails(message.data['earthquake_id']);
    }
  }

  static void _showEarthquakeAlert(RemoteMessage message) {
    // Show in-app alert dialog
    // Implementation depends on your UI framework
  }

  static void _navigateToEarthquakeDetails(String earthquakeId) {
    // Navigate to earthquake details screen
    // Implementation depends on your navigation system
  }
}
```

## Step 5: Backend API Integration

### 5.1 Create Earthquake API Endpoints

Create API endpoints in your backend to serve earthquake data to the mobile app:

**controllers/EarthquakeController.ts**

```typescript
import { Request, Response } from 'express';
import { EarthquakeService } from '../services/EarthquakeService';

export class EarthquakeController {
  // Get recent earthquakes
  static async getRecentEarthquakes(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const earthquakes = await EarthquakeService.getRecentEarthquakes(limit);

      res.status(200).json({
        success: true,
        data: earthquakes,
        count: earthquakes.length,
      });
    } catch (error) {
      console.error('Error fetching recent earthquakes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch earthquakes',
      });
    }
  }

  // Get earthquake by ID
  static async getEarthquakeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const earthquake = await EarthquakeService.getEarthquakeById(id);

      if (!earthquake) {
        res.status(404).json({
          success: false,
          error: 'Earthquake not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: earthquake,
      });
    } catch (error) {
      console.error('Error fetching earthquake:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch earthquake',
      });
    }
  }

  // Get earthquake notifications
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const notifications = await EarthquakeService.getNotifications(limit);

      res.status(200).json({
        success: true,
        data: notifications,
        count: notifications.length,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notifications',
      });
    }
  }
}
```

### 5.2 Create Routes

**routes/earthquakeRoutes.ts**

```typescript
import { Router } from 'express';
import { EarthquakeController } from '../controllers/EarthquakeController';

const router = Router();

router.get('/earthquakes/recent', EarthquakeController.getRecentEarthquakes);
router.get('/earthquakes/:id', EarthquakeController.getEarthquakeById);
router.get('/notifications', EarthquakeController.getNotifications);

export default router;
```

## Step 6: Testing the System

### 6.1 Test USGS API Connection

```bash
# Test USGS API directly
curl "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=14.2919325&longitude=120.7752839&maxradiuskm=150"
```

### 6.2 Test Edge Function Locally

```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve earthquake-monitor

# Test the function
curl -X POST http://localhost:54321/functions/v1/earthquake-monitor
```

### 6.3 Test FCM Notifications

Create a test script to send notifications:

```typescript
// test-notification.ts
async function testNotification() {
  const notification = {
    to: '/topics/earthquake_alerts',
    notification: {
      title: '🧪 Test Earthquake Alert',
      body: 'This is a test notification for the earthquake monitoring system.',
      icon: 'earthquake_icon',
    },
    data: {
      type: 'earthquake_alert',
      test: 'true',
    },
  };

  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${FCM_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notification),
  });

  console.log('Test notification result:', await response.json());
}

testNotification();
```

## Step 7: Monitoring and Maintenance

### 7.1 Set Up Logging

```bash
# View function logs
supabase functions logs earthquake-monitor --follow

# Filter logs by level
supabase functions logs earthquake-monitor --level error
```

### 7.2 Set Up Alerts

Create monitoring alerts for:

- Function execution failures
- USGS API failures
- FCM delivery failures
- Database write failures

### 7.3 Regular Maintenance Tasks

1. **Weekly**: Review logs for errors or issues
2. **Monthly**: Analyze notification delivery rates
3. **Quarterly**: Review and update earthquake classification thresholds
4. **Annually**: Audit and clean up old data

## Step 8: Production Deployment

### 8.1 Production Environment Variables

```bash
# Production environment setup
supabase link --project-ref your-production-project

# Set production secrets
supabase secrets set FIREBASE_PROJECT_ID=your-prod-project-id
supabase secrets set FCM_SERVER_KEY=your-prod-fcm-key
supabase secrets set FIREBASE_SERVICE_ACCOUNT='your-prod-service-account'
```

### 8.2 Deploy to Production

```bash
# Deploy function to production
supabase functions deploy earthquake-monitor --project-ref your-production-project

# Verify deployment
supabase functions list --project-ref your-production-project
```

### 8.3 Enable Production Monitoring

1. Set up error tracking (e.g., Sentry)
2. Configure uptime monitoring
3. Set up alerting for system failures
4. Create dashboards for system metrics

## Troubleshooting

### Common Issues

1. **USGS API Timeouts**

   - Implement retry logic with exponential backoff
   - Add timeout configuration to fetch requests

2. **FCM Delivery Failures**

   - Check FCM server key validity
   - Verify topic subscription
   - Review notification payload format

3. **Firestore Write Errors**

   - Check service account permissions
   - Verify document structure
   - Review security rules

4. **Cron Schedule Not Working**
   - Verify cron expression syntax
   - Check function deployment status
   - Review function logs for errors

### Debug Commands

```bash
# Check function status
supabase functions list

# View detailed logs
supabase functions logs earthquake-monitor --level debug

# Test function manually
curl -X POST https://your-project.supabase.co/functions/v1/earthquake-monitor
```

This implementation guide provides a complete step-by-step process to set up your earthquake monitoring system. Follow each step carefully and test thoroughly before deploying to production.
