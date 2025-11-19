# Using Your Existing Shared Infrastructure

## Overview

Your existing `_shared` folder is perfect for the earthquake system! Here's how to integrate it:

## File Structure (Updated)

```
supabase/functions/
├── _shared/                     # ✅ Already exists - REUSE!
│   ├── fcm-client.ts           # ✅ Perfect for earthquake notifications
│   ├── firestore-client.ts     # ✅ Perfect for earthquake data storage
│   └── types.ts                # ✅ Add earthquake types here
└── earthquake-monitor/          # 🆕 New folder for earthquake system
    ├── index.ts                # Main earthquake monitoring function
    ├── services/
    │   └── usgs.ts            # USGS API integration only
    └── utils/
        ├── comparison.ts       # Data comparison logic
        └── notification.ts     # Earthquake notification formatting
```

## Simple Implementation Example

### 1. Main Earthquake Function (earthquake-monitor/index.ts)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// Reuse your existing shared clients! 🎉
import { sendFCMNotification } from '../_shared/fcm-client.ts';
import { saveNotificationHistory } from '../_shared/firestore-client.ts';

serve(async req => {
  try {
    console.log('🔍 Starting earthquake monitoring...');

    // 1. Fetch earthquake data from USGS
    const earthquakes = await fetchUSGSData();

    // 2. Check for new earthquakes (simplified)
    const newEarthquakes = earthquakes.filter(eq => eq.properties.mag >= 4.0);

    if (newEarthquakes.length === 0) {
      return new Response(JSON.stringify({ message: 'No new earthquakes' }));
    }

    // 3. Send notifications using your existing FCM client
    for (const earthquake of newEarthquakes) {
      const notification = {
        title: `🚨 Earthquake Alert - Magnitude ${earthquake.properties.mag}`,
        body: `${earthquake.properties.place} - Stay safe!`,
        data: {
          type: 'earthquake_alert',
          magnitude: earthquake.properties.mag.toString(),
          location: earthquake.properties.place,
        },
      };

      // Get all user tokens (you can modify this based on location/preferences)
      const allTokens = await getAllUserTokens();

      // Use your existing FCM function!
      const result = await sendFCMNotification(notification, allTokens);

      // Use your existing notification history function!
      await saveNotificationHistory(notification, 'earthquake_system', result.success, result.errors);
    }

    console.log(`✅ Processed ${newEarthquakes.length} earthquakes`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: newEarthquakes.length,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('❌ Earthquake monitoring failed:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// Simple USGS data fetcher
async function fetchUSGSData() {
  const url = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
  const params = new URLSearchParams({
    format: 'geojson',
    latitude: '14.2919325',
    longitude: '120.7752839',
    maxradiuskm: '150',
  });

  const response = await fetch(`${url}?${params}`);
  const data = await response.json();
  return data.features || [];
}

// Get all user FCM tokens (adapt this to your needs)
async function getAllUserTokens(): Promise<string[]> {
  // You can modify this to use your existing getUserTokens function
  // or implement location-based filtering for earthquake zones
  const { tokens } = await getUserTokens('both'); // Use your existing function!
  return tokens;
}
```

### 2. Add Earthquake Types to Your Existing types.ts

Add this to your existing `_shared/types.ts`:

```typescript
// Add these earthquake types to your existing types.ts file

export interface EarthquakeData {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  coordinates: {
    longitude: number;
    latitude: number;
    depth: number;
  };
  severity: 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';
  tsunami_warning: boolean;
}

export interface EarthquakeNotification {
  type: 'earthquake_alert';
  earthquake_id: string;
  magnitude: number;
  location: string;
  severity: string;
  timestamp: number;
}
```

### 3. Enhanced FCM Integration

You can enhance your existing `fcm-client.ts` by adding earthquake-specific notification templates:

```typescript
// Add this function to your existing fcm-client.ts

export async function sendEarthquakeNotification(
  earthquake: {
    id: string;
    magnitude: number;
    place: string;
    time: number;
  },
  tokens: string[]
): Promise<{ success: number; failure: number; errors: string[] }> {
  // Determine notification style based on magnitude
  let title = '';
  let priority: 'normal' | 'high' = 'normal';

  if (earthquake.magnitude >= 6.0) {
    title = `🚨 CRITICAL EARTHQUAKE - Magnitude ${earthquake.magnitude}`;
    priority = 'high';
  } else if (earthquake.magnitude >= 5.0) {
    title = `🔴 Strong Earthquake - Magnitude ${earthquake.magnitude}`;
    priority = 'high';
  } else if (earthquake.magnitude >= 4.0) {
    title = `🟠 Earthquake Alert - Magnitude ${earthquake.magnitude}`;
  } else {
    title = `🟡 Minor Earthquake - Magnitude ${earthquake.magnitude}`;
  }

  const notification = {
    title,
    body: `${earthquake.place} - ${new Date(
      earthquake.time
    ).toLocaleTimeString()}. Stay alert and follow safety protocols.`,
    data: {
      type: 'earthquake_alert',
      earthquake_id: earthquake.id,
      magnitude: earthquake.magnitude.toString(),
      location: earthquake.place,
      time: earthquake.time.toString(),
      priority: priority,
    },
  };

  // Use your existing sendFCMNotification function!
  return await sendFCMNotification(notification, tokens);
}
```

## Benefits of This Approach

✅ **Reuses your existing infrastructure** - No duplicate code!
✅ **Consistent Firebase setup** - Same service account, same initialization
✅ **Leverages your existing notification system** - Same user management
✅ **Easy to maintain** - All Firebase logic in one place
✅ **Cost effective** - No additional Firebase projects needed

## Implementation Steps

1. **Create the earthquake-monitor function:**

   ```bash
   supabase functions new earthquake-monitor
   ```

2. **Copy the simple implementation above into the index.ts**

3. **Test locally:**

   ```bash
   supabase functions serve earthquake-monitor
   curl -X POST http://localhost:54321/functions/v1/earthquake-monitor
   ```

4. **Deploy:**

   ```bash
   supabase functions deploy earthquake-monitor
   ```

5. **Set up cron (every 5 minutes):**
   ```bash
   # Add to your supabase config or dashboard
   */5 * * * * # Every 5 minutes
   ```

That's it! The earthquake system will now use your existing FCM and Firestore setup, making it much simpler and more maintainable. 🎉
