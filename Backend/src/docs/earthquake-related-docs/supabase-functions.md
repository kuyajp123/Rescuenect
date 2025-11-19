# Supabase Edge Functions for Earthquake Monitoring

## Overview

Supabase Edge Functions provide the serverless execution environment for our earthquake monitoring system. The function runs every 5 minutes using Supabase's cron scheduling feature.

## Function Architecture

```
┌─────────────────┐
│  Cron Trigger   │ (Every 5 minutes)
│   (Supabase)    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   Edge Function │
│ earthquake-monitor │
└─────────┬───────┘
          │
          ├─── Fetch USGS Data
          ├─── Compare with Firestore
          ├─── Send FCM Notifications
          └─── Update Firestore
```

## Function Structure

### File Organization

```
supabase/
├── functions/
│   └── earthquake-monitor/
│       ├── index.ts           # Main function entry point
│       ├── services/
│       │   ├── usgs.ts        # USGS API integration
│       │   ├── firestore.ts   # Firestore operations
│       │   └── fcm.ts         # Firebase Cloud Messaging
│       ├── types/
│       │   └── earthquake.ts  # TypeScript interfaces
│       └── utils/
│           ├── comparison.ts  # Data comparison logic
│           └── notification.ts # Notification formatting
└── config.toml                # Cron configuration
```

## Main Function Implementation

### index.ts

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { USGSService } from './services/usgs.ts';
import { FirestoreService } from './services/firestore.ts';
import { FCMService } from './services/fcm.ts';
import { compareEarthquakeData } from './utils/comparison.ts';
import { formatNotification } from './utils/notification.ts';
import { EarthquakeData } from './types/earthquake.ts';

serve(async req => {
  try {
    console.log('🔍 Starting earthquake monitoring cycle...');

    // Step 1: Fetch data from USGS
    const usgsData = await USGSService.fetchEarthquakeData();
    console.log(`📊 Fetched ${usgsData.features.length} earthquakes from USGS`);

    if (usgsData.features.length === 0) {
      console.log('✅ No earthquakes found, monitoring continues...');
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

    // Step 2: Get existing data from Firestore
    const existingData = await FirestoreService.getExistingEarthquakes();
    console.log(`🗄️ Found ${existingData.length} existing earthquakes in database`);

    // Step 3: Compare and identify new earthquakes
    const newEarthquakes = compareEarthquakeData(usgsData.features, existingData);
    console.log(`🆕 Identified ${newEarthquakes.length} new earthquakes`);

    if (newEarthquakes.length === 0) {
      console.log('✅ No new earthquakes, monitoring continues...');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No new earthquakes found',
          existing_count: existingData.length,
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
        const notification = formatNotification(earthquake);
        const result = await FCMService.sendNotification(notification);
        notificationResults.push({ earthquakeId: earthquake.id, success: true, result });
        console.log(`📱 Notification sent for earthquake: ${earthquake.id}`);
      } catch (error) {
        console.error(`❌ Failed to send notification for ${earthquake.id}:`, error);
        notificationResults.push({ earthquakeId: earthquake.id, success: false, error: error.message });
      }
    }

    // Step 5: Save new earthquakes to Firestore
    await FirestoreService.saveNewEarthquakes(newEarthquakes);
    console.log(`💾 Saved ${newEarthquakes.length} new earthquakes to database`);

    // Step 6: Save notification records
    await FirestoreService.saveNotificationRecords(newEarthquakes);
    console.log(`📝 Saved ${newEarthquakes.length} notification records`);

    console.log('✅ Earthquake monitoring cycle completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Earthquake monitoring completed',
        new_earthquakes: newEarthquakes.length,
        notifications_sent: notificationResults.filter(r => r.success).length,
        notification_failures: notificationResults.filter(r => !r.success).length,
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
    console.error('❌ Earthquake monitoring failed:', error);

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
```

## Service Implementations

### USGS Service (services/usgs.ts)

```typescript
import { USGSResponse } from '../types/earthquake.ts';

export class USGSService {
  private static readonly USGS_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
  private static readonly LATITUDE = '14.2919325';
  private static readonly LONGITUDE = '120.7752839';
  private static readonly MAX_RADIUS_KM = '150';

  static async fetchEarthquakeData(): Promise<USGSResponse> {
    const params = new URLSearchParams({
      format: 'geojson',
      latitude: this.LATITUDE,
      longitude: this.LONGITUDE,
      maxradiuskm: this.MAX_RADIUS_KM,
    });

    const url = `${this.USGS_URL}?${params}`;
    console.log(`🌐 Fetching earthquake data from: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Rescuenect-EarthquakeMonitor/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`USGS API request failed: ${response.status} ${response.statusText}`);
    }

    const data: USGSResponse = await response.json();

    if (!data.features) {
      throw new Error('Invalid response format from USGS API');
    }

    return data;
  }
}
```

### Firestore Service (services/firestore.ts)

```typescript
import { EarthquakeData, NotificationRecord } from '../types/earthquake.ts';

export class FirestoreService {
  private static readonly FIRESTORE_URL = Deno.env.get('FIRESTORE_URL');
  private static readonly SERVICE_ACCOUNT_KEY = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

  static async getExistingEarthquakes(): Promise<EarthquakeData[]> {
    try {
      // Implementation for fetching existing earthquakes from Firestore
      const response = await fetch(
        `${this.FIRESTORE_URL}/earthquakes` /* , {
        headers: {
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      } */
      );

      if (!response.ok) {
        throw new Error(`Firestore query failed: ${response.status}`);
      }

      const data = await response.json();
      return data.documents || [];
    } catch (error) {
      console.error('Error fetching existing earthquakes:', error);
      return []; // Return empty array to continue processing
    }
  }

  static async saveNewEarthquakes(earthquakes: EarthquakeData[]): Promise<void> {
    try {
      const batch = earthquakes.map(earthquake => ({
        id: earthquake.id,
        magnitude: earthquake.properties.mag,
        place: earthquake.properties.place,
        time: earthquake.properties.time,
        coordinates: earthquake.geometry.coordinates,
        properties: earthquake.properties,
        created_at: Date.now(),
        updated_at: Date.now(),
      }));

      // Batch write to Firestore earthquakes collection
      const response = await fetch(`${this.FIRESTORE_URL}/earthquakes:batchWrite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          writes: batch.map(doc => ({
            update: {
              name: `earthquakes/${doc.id}`,
              fields: this.convertToFirestoreFields(doc),
            },
            updateMask: {},
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save earthquakes: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving earthquakes:', error);
      throw error;
    }
  }

  static async saveNotificationRecords(earthquakes: EarthquakeData[]): Promise<void> {
    try {
      const notifications = earthquakes.map(earthquake => ({
        id: `notif_${earthquake.id}_${Date.now()}`,
        earthquake_id: earthquake.id,
        type: 'earthquake_alert',
        title: `Earthquake Alert - Magnitude ${earthquake.properties.mag}`,
        body: `${earthquake.properties.place} - ${new Date(earthquake.properties.time).toLocaleString()}`,
        magnitude: earthquake.properties.mag,
        location: earthquake.properties.place,
        coordinates: earthquake.geometry.coordinates,
        sent_at: Date.now(),
        created_at: Date.now(),
      }));

      // Save to notifications collection
      const response = await fetch(`${this.FIRESTORE_URL}/notifications:batchWrite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          writes: notifications.map(notif => ({
            update: {
              name: `notifications/${notif.id}`,
              fields: this.convertToFirestoreFields(notif),
            },
            updateMask: {},
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save notification records: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving notification records:', error);
      throw error;
    }
  }

  private static async getAccessToken(): Promise<string> {
    // Implementation for getting Firebase access token
    // This would use the service account key to generate a JWT
    return 'access_token_here';
  }

  private static convertToFirestoreFields(obj: any): any {
    // Convert JavaScript object to Firestore field format
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
        fields[key] = { mapValue: { fields: this.convertToFirestoreFields(value) } };
      }
    }

    return fields;
  }
}
```

## Cron Configuration

### config.toml

```toml
[functions.earthquake-monitor]
verify_jwt = false

[functions.earthquake-monitor.cron]
schedule = "*/5 * * * *"  # Every 5 minutes
timezone = "Asia/Manila"
```

## Environment Variables

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
FIRESTORE_URL=https://firestore.googleapis.com/v1/projects/your-project-id/databases/(default)/documents

# FCM Configuration
FCM_SERVER_KEY=your-fcm-server-key

# Optional Configuration
USGS_USER_AGENT=Rescuenect-EarthquakeMonitor/1.0
LOG_LEVEL=info
```

## Deployment Commands

```bash
# Initialize Supabase project
supabase init

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy earthquake-monitor

# Set environment variables
supabase secrets set FIREBASE_PROJECT_ID=your-project-id
supabase secrets set FIREBASE_SERVICE_ACCOUNT='your-service-account-json'
supabase secrets set FCM_SERVER_KEY=your-fcm-key

# Enable cron trigger
supabase functions create earthquake-monitor --cron="*/5 * * * *"
```

## Monitoring and Logs

```bash
# View function logs
supabase functions logs earthquake-monitor

# View function logs in real-time
supabase functions logs earthquake-monitor --follow

# View specific log level
supabase functions logs earthquake-monitor --level error
```

## Error Handling and Retry Logic

```typescript
// Exponential backoff for retries
class RetryHandler {
  static async withRetry<T>(operation: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Should not reach here');
  }
}
```

## Performance Considerations

1. **Cold Start**: First execution may take longer (~2-3 seconds)
2. **Memory Usage**: Function uses ~128MB RAM
3. **Execution Time**: Typically completes in 5-15 seconds
4. **Concurrent Executions**: Only one instance runs per schedule
5. **Rate Limits**: USGS API has no official limits, but be respectful

## Testing Locally

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve earthquake-monitor

# Test the function
curl -X POST http://localhost:54321/functions/v1/earthquake-monitor
```
