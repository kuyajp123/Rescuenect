# Earthquake System Troubleshooting Guide

## Overview

This troubleshooting guide provides solutions for common issues that may occur in the earthquake monitoring system. It covers problems across all system components including USGS API, Supabase Edge Functions, Firestore, FCM, and mobile app integration.

## Common Issues and Solutions

## 1. USGS API Issues

### Issue: USGS API Returns 500 Internal Server Error

**Symptoms:**

- Edge function logs show "USGS API request failed: 500"
- No earthquake data being fetched
- System continues to retry but fails

**Possible Causes:**

- USGS server maintenance
- Temporary service outage
- Malformed request parameters

**Solutions:**

```typescript
// Implement exponential backoff retry
async function fetchUSGSWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(USGS_URL + '?' + params);
      if (response.ok) return await response.json();

      if (response.status >= 500) {
        // Server error - retry with backoff
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
```

**Monitoring:**

```bash
# Check USGS service status
curl -I "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=14.2919325&longitude=120.7752839&maxradiuskm=150"

# Monitor function logs
supabase functions logs earthquake-monitor --level error
```

### Issue: USGS API Returns Empty Results

**Symptoms:**

- Function completes successfully but reports 0 earthquakes
- No notifications sent despite expecting earthquake activity

**Possible Causes:**

- No earthquakes in the specified radius/timeframe
- Wrong coordinate parameters
- API parameter formatting issues

**Debugging Steps:**

1. **Verify Parameters:**

```bash
# Test with manual API call
curl "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=14.2919325&longitude=120.7752839&maxradiuskm=150&minmagnitude=2.0"
```

2. **Check Coordinate Validity:**

```typescript
// Validate coordinates are within expected range
function validateCoordinates(lat: number, lng: number) {
  if (lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude: ${lat}`);
  }
  if (lng < -180 || lng > 180) {
    throw new Error(`Invalid longitude: ${lng}`);
  }
}
```

3. **Expand Search Parameters:**

```typescript
// Temporarily increase radius for testing
const params = new URLSearchParams({
  format: 'geojson',
  latitude: '14.2919325',
  longitude: '120.7752839',
  maxradiuskm: '300', // Increased from 150
  minmagnitude: '1.0', // Lower threshold
});
```

### Issue: USGS API Rate Limiting

**Symptoms:**

- HTTP 429 responses
- Intermittent failures during high-frequency testing

**Solutions:**

```typescript
// Implement rate limiting
class RateLimiter {
  private lastRequest = 0;
  private minInterval = 60000; // 1 minute between requests

  async throttle() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequest = Date.now();
  }
}
```

## 2. Supabase Edge Function Issues

### Issue: Function Timeout

**Symptoms:**

- Function execution exceeds timeout limit
- Partial execution with incomplete operations
- "Function timeout" errors in logs

**Solutions:**

1. **Optimize Function Performance:**

```typescript
// Use Promise.all for parallel operations
async function optimizedFlow() {
  const [usgsData, existingData] = await Promise.all([fetchUSGSData(), getExistingEarthquakes()]);

  // Process in smaller batches
  const batchSize = 5;
  for (let i = 0; i < newEarthquakes.length; i += batchSize) {
    const batch = newEarthquakes.slice(i, i + batchSize);
    await Promise.all([sendNotificationsBatch(batch), saveEarthquakesBatch(batch)]);
  }
}
```

2. **Increase Function Timeout:**

```toml
# supabase/functions/earthquake-monitor/config.toml
[functions.earthquake-monitor]
timeout = 300 # 5 minutes (default is 60 seconds)
memory = 512  # Increase memory if needed
```

### Issue: Function Cold Start Delays

**Symptoms:**

- First execution after idle period takes longer
- Inconsistent execution times
- Timeout on first run after inactivity

**Solutions:**

1. **Implement Warm-up Function:**

```typescript
// Create a separate function for keep-alive
serve(async req => {
  if (req.url.includes('/health')) {
    return new Response('OK', { status: 200 });
  }

  // Regular earthquake monitoring logic
});
```

2. **Add Health Check Cron:**

```toml
# Additional cron for warm-up
[functions.health-check]
schedule = "*/2 * * * *" # Every 2 minutes
```

### Issue: Environment Variables Not Loading

**Symptoms:**

- "undefined" values for environment variables
- Authentication failures
- Missing configuration

**Debugging Steps:**

1. **Verify Environment Variables:**

```bash
# List all secrets
supabase secrets list

# Check specific secret
supabase secrets get FIREBASE_PROJECT_ID
```

2. **Add Debug Logging:**

```typescript
serve(async req => {
  console.log('Environment check:');
  console.log('FIREBASE_PROJECT_ID:', Deno.env.get('FIREBASE_PROJECT_ID') ? 'SET' : 'MISSING');
  console.log('FCM_SERVER_KEY:', Deno.env.get('FCM_SERVER_KEY') ? 'SET' : 'MISSING');

  // ... rest of function
});
```

3. **Reset and Recreate Secrets:**

```bash
# Delete and recreate problematic secrets
supabase secrets unset FIREBASE_PROJECT_ID
supabase secrets set FIREBASE_PROJECT_ID=your-actual-project-id
```

## 3. Firestore Issues

### Issue: Permission Denied Errors

**Symptoms:**

- "Permission denied" errors in function logs
- Failed writes to Firestore collections
- Authentication failures

**Solutions:**

1. **Verify Service Account Permissions:**

```json
{
  "bindings": [
    {
      "role": "roles/datastore.user",
      "members": ["serviceAccount:your-service-account@project.iam.gserviceaccount.com"]
    },
    {
      "role": "roles/firebase.admin",
      "members": ["serviceAccount:your-service-account@project.iam.gserviceaccount.com"]
    }
  ]
}
```

2. **Check Firestore Security Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow service account access
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. **Validate Service Account Key:**

```typescript
// Test service account authentication
async function testFirestoreAccess() {
  try {
    const token = await getFirebaseAccessToken();
    console.log('Service account authentication successful');

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/earthquakes`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Firestore access test:', response.status);
  } catch (error) {
    console.error('Firestore access failed:', error);
  }
}
```

### Issue: Document Write Failures

**Symptoms:**

- HTTP 400/409 errors when writing documents
- Partial data saves
- Inconsistent document structure

**Solutions:**

1. **Validate Document Structure:**

```typescript
function validateEarthquakeDocument(doc: any) {
  const required = ['id', 'magnitude', 'place', 'time', 'coordinates'];

  for (const field of required) {
    if (!doc[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (typeof doc.magnitude !== 'number' || doc.magnitude < 0) {
    throw new Error(`Invalid magnitude: ${doc.magnitude}`);
  }

  return true;
}
```

2. **Use Batch Writes for Multiple Documents:**

```typescript
async function batchWriteEarthquakes(earthquakes: any[]) {
  const batchWrites = earthquakes.map(earthquake => ({
    update: {
      name: `projects/${PROJECT_ID}/databases/(default)/documents/earthquakes/${earthquake.id}`,
      fields: convertToFirestoreFields(earthquake),
    },
    updateMask: {},
  }));

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:batchWrite`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ writes: batchWrites }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Batch write failed: ${error}`);
  }
}
```

### Issue: Query Performance Problems

**Symptoms:**

- Slow function execution
- Timeout errors on data retrieval
- High latency in earthquake data fetching

**Solutions:**

1. **Create Composite Indexes:**

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
    }
  ]
}
```

2. **Optimize Queries:**

```typescript
// Bad: Fetching all documents
const allEarthquakes = await db.collection('earthquakes').get();

// Good: Use pagination and limits
const recentEarthquakes = await db.collection('earthquakes').orderBy('time', 'desc').limit(100).get();

// Better: Use specific queries
const significantEarthquakes = await db
  .collection('earthquakes')
  .where('magnitude', '>=', 4.0)
  .orderBy('magnitude', 'desc')
  .limit(50)
  .get();
```

## 4. Firebase Cloud Messaging Issues

### Issue: Notification Not Delivered

**Symptoms:**

- FCM returns success but users don't receive notifications
- Low delivery rates
- Notifications work inconsistently

**Debugging Steps:**

1. **Verify FCM Server Key:**

```bash
# Test FCM directly
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "/topics/earthquake_alerts",
    "notification": {
      "title": "Test",
      "body": "Test notification"
    }
  }'
```

2. **Check Topic Subscription:**

```typescript
// Verify topic subscription in mobile app
await FirebaseMessaging.instance.subscribeToTopic('earthquake_alerts');

// Get FCM token for debugging
const token = await FirebaseMessaging.instance.getToken();
console.log('FCM Token:', token);
```

3. **Debug Notification Payload:**

```typescript
function debugNotificationPayload(payload: any) {
  console.log('FCM Payload Debug:');
  console.log('- Target:', payload.to);
  console.log('- Title length:', payload.notification?.title?.length);
  console.log('- Body length:', payload.notification?.body?.length);
  console.log('- Data keys:', Object.keys(payload.data || {}));

  // Validate payload size (FCM limit is 4KB)
  const payloadSize = JSON.stringify(payload).length;
  if (payloadSize > 4096) {
    console.warn(`Payload too large: ${payloadSize} bytes`);
  }
}
```

### Issue: FCM Authentication Errors

**Symptoms:**

- HTTP 401 Unauthorized responses
- "Invalid authentication credentials" errors

**Solutions:**

1. **Regenerate Server Key:**

   - Go to Firebase Console → Project Settings → Cloud Messaging
   - Generate new server key
   - Update environment variable

2. **Switch to Firebase Admin SDK:**

```typescript
// Use Firebase Admin SDK instead of legacy server key
import { getMessaging } from 'firebase-admin/messaging';

const message = {
  topic: 'earthquake_alerts',
  notification: {
    title: 'Earthquake Alert',
    body: 'A magnitude 4.5 earthquake was detected',
  },
  data: {
    earthquake_id: 'us123456',
    magnitude: '4.5',
  },
};

const response = await getMessaging().send(message);
```

### Issue: Notification Format Problems

**Symptoms:**

- Notifications appear malformed on devices
- Missing icons or sounds
- Inconsistent appearance across platforms

**Solutions:**

1. **Platform-Specific Formatting:**

```typescript
const notification = {
  to: '/topics/earthquake_alerts',
  notification: {
    title: formatTitle(earthquake),
    body: formatBody(earthquake),
    icon: 'earthquake_icon',
  },
  // Android-specific
  android: {
    notification: {
      channel_id: 'earthquake_alerts',
      priority: 'high',
      default_sound: true,
      icon: 'ic_earthquake',
      color: '#FF6B35',
    },
  },
  // iOS-specific
  apns: {
    payload: {
      aps: {
        alert: {
          title: formatTitle(earthquake),
          body: formatBody(earthquake),
        },
        sound: 'default',
        badge: 1,
      },
    },
  },
};
```

2. **Validate Message Content:**

```typescript
function validateNotificationContent(notification: any) {
  if (!notification.title || notification.title.length > 100) {
    throw new Error('Invalid title length');
  }

  if (!notification.body || notification.body.length > 500) {
    throw new Error('Invalid body length');
  }

  // Check for special characters that might cause issues
  const problematicChars = /[^\x00-\x7F]/g;
  if (problematicChars.test(notification.title + notification.body)) {
    console.warn('Non-ASCII characters detected in notification');
  }
}
```

## 5. Mobile App Integration Issues

### Issue: App Not Receiving Notifications

**Symptoms:**

- FCM shows successful delivery
- App doesn't display notifications
- Background notifications not working

**Debugging Steps:**

1. **Check App Permissions:**

```dart
// Flutter - Request notification permissions
NotificationSettings settings = await FirebaseMessaging.instance.requestPermission(
  alert: true,
  badge: true,
  sound: true,
  criticalAlert: true,
);

if (settings.authorizationStatus != AuthorizationStatus.authorized) {
  print('User declined or has not accepted permission');
}
```

2. **Verify Background Handler:**

```dart
// Register background message handler
FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Handling background message: ${message.messageId}');
}
```

3. **Debug Message Reception:**

```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('Received message: ${message.messageId}');
  print('Title: ${message.notification?.title}');
  print('Body: ${message.notification?.body}');
  print('Data: ${message.data}');
});
```

### Issue: Notification Channel Problems (Android)

**Symptoms:**

- Notifications don't show despite successful delivery
- No sound or vibration
- Wrong notification importance

**Solutions:**

1. **Create Proper Notification Channels:**

```kotlin
private fun createNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val earthquakeChannel = NotificationChannel(
            "earthquake_alerts",
            "Earthquake Alerts",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Earthquake detection notifications"
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 500, 200, 500)
            setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                null
            )
        }

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(earthquakeChannel)
    }
}
```

2. **Debug Channel Status:**

```kotlin
fun debugNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val notificationManager = getSystemService(NotificationManager::class.java)
        val channels = notificationManager.notificationChannels

        for (channel in channels) {
            Log.d("NotificationDebug", "Channel: ${channel.id}")
            Log.d("NotificationDebug", "Importance: ${channel.importance}")
            Log.d("NotificationDebug", "Sound: ${channel.sound}")
        }
    }
}
```

## 6. System Monitoring and Alerts

### Setting Up Monitoring

1. **Function Monitoring:**

```typescript
// Add monitoring metrics to function
serve(async req => {
  const startTime = Date.now();

  try {
    // Function logic here

    // Success metrics
    console.log(`Function completed in ${Date.now() - startTime}ms`);
  } catch (error) {
    // Error metrics
    console.error('Function failed:', error);

    // Send alert to monitoring service
    await sendAlert({
      level: 'error',
      message: error.message,
      function: 'earthquake-monitor',
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
});
```

2. **Health Check Endpoint:**

```typescript
// Add health check to function
if (req.url.includes('/health')) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      usgs_api: await checkUSGSAPI(),
      firestore: await checkFirestore(),
      fcm: await checkFCM(),
    },
  };

  return new Response(JSON.stringify(health), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### Alert Configuration

```yaml
# alerting-rules.yml
groups:
  - name: earthquake-system
    rules:
      - alert: EarthquakeFunctionDown
        expr: up{job="earthquake-monitor"} == 0
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: 'Earthquake monitoring function is down'

      - alert: HighErrorRate
        expr: rate(errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'High error rate in earthquake system'
```

## Emergency Recovery Procedures

### Complete System Failure

1. **Immediate Actions:**

   - Check system status dashboard
   - Review recent function logs
   - Verify all external service status (USGS, Firebase)

2. **Recovery Steps:**

```bash
# Redeploy function
supabase functions deploy earthquake-monitor --project-ref your-project

# Reset environment variables
supabase secrets set FIREBASE_PROJECT_ID=your-project-id
supabase secrets set FCM_SERVER_KEY=your-server-key

# Test function manually
curl -X POST https://your-project.supabase.co/functions/v1/earthquake-monitor

# Check logs
supabase functions logs earthquake-monitor --level error
```

3. **Validation:**
   - Verify function executes successfully
   - Test notification delivery
   - Confirm data writes to Firestore

### Data Recovery

```typescript
// Recover missing earthquake data
async function recoverMissingData(startDate: Date, endDate: Date) {
  console.log(`Recovering data from ${startDate} to ${endDate}`);

  // Fetch historical data from USGS
  const params = new URLSearchParams({
    format: 'geojson',
    latitude: '14.2919325',
    longitude: '120.7752839',
    maxradiuskm: '150',
    starttime: startDate.toISOString(),
    endtime: endDate.toISOString(),
  });

  const response = await fetch(`${USGS_URL}?${params}`);
  const data = await response.json();

  // Save recovered data
  await saveEarthquakesToFirestore(data.features);

  console.log(`Recovered ${data.features.length} earthquakes`);
}
```

## Contact Information

### Support Escalation

- **Level 1**: Check logs and restart function
- **Level 2**: Review configuration and external services
- **Level 3**: Contact system administrator
- **Emergency**: Implement manual notification system

### Key Contacts

- **System Administrator**: admin@rescuenect.com
- **Firebase Support**: Firebase Console → Support
- **Supabase Support**: Supabase Dashboard → Support
- **USGS API Issues**: https://earthquake.usgs.gov/contactus/

This troubleshooting guide should help resolve most common issues with the earthquake monitoring system. For issues not covered here, consult the system logs and contact the appropriate support channels.
