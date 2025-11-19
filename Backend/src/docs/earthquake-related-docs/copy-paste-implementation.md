# 🔥 COPY-PASTE EARTHQUAKE IMPLEMENTATION GUIDE

This document contains **READY-TO-USE CODE** that leverages your existing infrastructure. Simply copy and paste into the specified files.

## 📁 File Structure Overview

```
Backend/supabase/functions/
├── earthquake-monitor/
│   └── index.ts                    ← Main earthquake monitoring function
├── _shared/
│   ├── fcm-client.ts              ← ✅ EXISTS - We'll add earthquake function
│   ├── firestore-client.js        ← ✅ EXISTS - We'll add earthquake functions
│   ├── types.ts                   ← ✅ EXISTS - We'll add earthquake types
│   └── earthquake-utils.ts        ← 🆕 NEW - Earthquake utilities
└── deno.json                      ← ✅ EXISTS - Already configured
```

---

## 🚀 IMPLEMENTATION STEPS

### Step 1: Add Earthquake Types to Shared Types

**File:** `c:\Users\Paul\Rescuenect\Backend\supabase\functions\_shared\types.ts`

**ADD TO THE BOTTOM OF THE FILE:**

```typescript
// ========================
// EARTHQUAKE SYSTEM TYPES
// ========================

export interface USGSEarthquake {
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
    detail: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [lng, lat, depth]
  };
}

export interface USGSResponse {
  type: 'FeatureCollection';
  features: USGSEarthquake[];
  metadata: {
    count: number;
    status: number;
    generated: number;
    title: string;
  };
}

export interface ProcessedEarthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  updated: number;
  coordinates: {
    longitude: number;
    latitude: number;
    depth: number;
  };
  severity: 'micro' | 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';
  priority: 'low' | 'normal' | 'high' | 'critical';
  tsunami_warning: boolean;
  usgs_url: string;
  distance_km?: number;
  notification_sent: boolean;
  created_at: number;
  updated_at: number;
}

export interface EarthquakeNotificationData {
  type: 'earthquake_alert';
  earthquake_id: string;
  magnitude: string;
  location: string;
  time: string;
  severity: string;
  priority: string;
  usgs_url: string;
  coordinates: string; // JSON string of coordinates
  tsunami_warning: string;
}

export interface EarthquakeMonitorResult {
  success: boolean;
  message: string;
  new_earthquakes: number;
  notifications_sent: number;
  total_processed: number;
  timestamp: string;
  earthquakes?: Array<{
    id: string;
    magnitude: number;
    place: string;
    time: string;
    severity: string;
  }>;
  error?: string;
}
```

---

### Step 2: Add Earthquake Functions to Firestore Client

**File:** `c:\Users\Paul\Rescuenect\Backend\supabase\functions\_shared\firestore-client.ts`

**ADD THESE FUNCTIONS TO THE BOTTOM OF THE FILE (BEFORE THE EXPORT STATEMENTS):**

```typescript
// ========================
// EARTHQUAKE FUNCTIONS
// ========================

/**
 * Get existing earthquakes from Firestore to prevent duplicates
 */
export async function getExistingEarthquakes(limit: number = 100): Promise<string[]> {
  const db = initializeFirebase();

  try {
    const snapshot = await db.collection('earthquakes').orderBy('time', 'desc').limit(limit).get();

    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error fetching existing earthquakes:', error);
    return [];
  }
}

/**
 * Save earthquake data to Firestore
 */
export async function saveEarthquakeToFirestore(earthquake: {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  updated: number;
  coordinates: {
    longitude: number;
    latitude: number;
    depth: number;
  };
  severity: string;
  priority: string;
  tsunami_warning: boolean;
  usgs_url: string;
  notification_sent: boolean;
}): Promise<void> {
  const db = initializeFirebase();

  try {
    await db
      .collection('earthquakes')
      .doc(earthquake.id)
      .set({
        ...earthquake,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
  } catch (error) {
    console.error('Error saving earthquake:', error);
    throw error;
  }
}

/**
 * Save multiple earthquakes to Firestore efficiently
 */
export async function saveEarthquakesToFirestore(earthquakes: any[]): Promise<void> {
  const db = initializeFirebase();
  const batch = db.batch();

  try {
    earthquakes.forEach(earthquake => {
      const docRef = db.collection('earthquakes').doc(earthquake.id);
      batch.set(docRef, {
        ...earthquake,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error saving earthquakes batch:', error);
    throw error;
  }
}

/**
 * Get earthquake statistics for monitoring
 */
export async function getEarthquakeStats(timeframe: 'today' | 'week' | 'month'): Promise<{
  total: number;
  byMagnitude: Record<string, number>;
  bySeverity: Record<string, number>;
  withTsunami: number;
}> {
  const db = initializeFirebase();

  // Calculate date range
  const now = new Date();
  const startTime = new Date();

  switch (timeframe) {
    case 'today':
      startTime.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startTime.setDate(now.getDate() - 7);
      break;
    case 'month':
      startTime.setMonth(now.getMonth() - 1);
      break;
  }

  try {
    const snapshot = await db.collection('earthquakes').where('time', '>=', startTime.getTime()).get();

    const stats = {
      total: 0,
      byMagnitude: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      withTsunami: 0,
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      stats.total++;

      // Count by magnitude range
      const magRange = Math.floor(data.magnitude);
      stats.byMagnitude[`${magRange}-${magRange + 1}`] = (stats.byMagnitude[`${magRange}-${magRange + 1}`] || 0) + 1;

      // Count by severity
      stats.bySeverity[data.severity] = (stats.bySeverity[data.severity] || 0) + 1;

      // Count tsunami warnings
      if (data.tsunami_warning) {
        stats.withTsunami++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching earthquake stats:', error);
    return { total: 0, byMagnitude: {}, bySeverity: {}, withTsunami: 0 };
  }
}
```

---

### Step 3: Add Earthquake Function to FCM Client

**File:** `c:\Users\Paul\Rescuenect\Backend\supabase\functions\_shared\fcm-client.ts`

**REPLACE THE EXISTING `sendEarthquakeNotification` FUNCTION WITH THIS ENHANCED VERSION:**

```typescript
/**
 * Send earthquake notification with enhanced features
 */
export async function sendEarthquakeNotification(
  earthquake: {
    id: string;
    magnitude: number;
    place: string;
    time: number;
    severity: string;
    priority: string;
    tsunami_warning: boolean;
    usgs_url: string;
    coordinates: {
      longitude: number;
      latitude: number;
      depth: number;
    };
  },
  tokens: string[]
): Promise<{ success: number; failure: number; errors: string[] }> {
  // Skip notifications for micro earthquakes (below 2.0)
  if (earthquake.magnitude < 2.0) {
    return { success: 0, failure: 0, errors: ['Below notification threshold'] };
  }

  // Determine notification style based on magnitude and tsunami warning
  let title = '';
  let emoji = '';
  let priority: 'normal' | 'high' = 'normal';

  if (earthquake.tsunami_warning) {
    title = `🌊 TSUNAMI WARNING - Magnitude ${earthquake.magnitude} Earthquake`;
    emoji = '🌊';
    priority = 'high';
  } else if (earthquake.magnitude >= 6.0) {
    title = `🚨 CRITICAL EARTHQUAKE - Magnitude ${earthquake.magnitude}`;
    emoji = '🚨';
    priority = 'high';
  } else if (earthquake.magnitude >= 5.0) {
    title = `🔴 Strong Earthquake - Magnitude ${earthquake.magnitude}`;
    emoji = '🔴';
    priority = 'high';
  } else if (earthquake.magnitude >= 4.0) {
    title = `🟠 Earthquake Alert - Magnitude ${earthquake.magnitude}`;
    emoji = '🟠';
  } else {
    title = `🟡 Minor Earthquake - Magnitude ${earthquake.magnitude}`;
    emoji = '🟡';
  }

  // Create enhanced body message
  let body = '';
  const timeString = new Date(earthquake.time).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (earthquake.tsunami_warning) {
    body = `🌊 TSUNAMI THREAT: Magnitude ${earthquake.magnitude} earthquake ${earthquake.place} at ${timeString}. MOVE TO HIGHER GROUND IMMEDIATELY!`;
  } else if (earthquake.magnitude >= 6.0) {
    body = `🆘 CRITICAL: Magnitude ${earthquake.magnitude} earthquake ${earthquake.place} at ${timeString}. TAKE IMMEDIATE SHELTER!`;
  } else if (earthquake.magnitude >= 5.0) {
    body = `⚠️ Strong earthquake detected: Magnitude ${earthquake.magnitude} ${earthquake.place} at ${timeString}. Take safety precautions!`;
  } else if (earthquake.magnitude >= 4.0) {
    body = `Magnitude ${earthquake.magnitude} earthquake occurred ${earthquake.place} at ${timeString}. Stay alert and follow safety protocols.`;
  } else {
    body = `Minor earthquake detected: Magnitude ${earthquake.magnitude} ${earthquake.place} at ${timeString}.`;
  }

  const notification = {
    title,
    body,
    data: {
      type: 'earthquake_alert',
      earthquake_id: earthquake.id,
      magnitude: earthquake.magnitude.toString(),
      location: earthquake.place,
      time: earthquake.time.toString(),
      severity: earthquake.severity,
      priority: earthquake.priority,
      tsunami_warning: earthquake.tsunami_warning.toString(),
      usgs_url: earthquake.usgs_url,
      coordinates: JSON.stringify(earthquake.coordinates),
      depth: earthquake.coordinates.depth.toString(),
    },
  };

  // Use your existing sendFCMNotification function!
  return await sendFCMNotification(notification, tokens);
}
```

---

### Step 4: Create Earthquake Utilities

**File:** `c:\Users\Paul\Rescuenect\Backend\supabase\functions\_shared\earthquake-utils.ts`

**CREATE THIS NEW FILE:**

```typescript
import type { USGSEarthquake, ProcessedEarthquake } from './types.ts';

// Philippines center coordinates for distance calculation
const PHILIPPINES_CENTER = { lat: 14.2919325, lng: 120.7752839 };

/**
 * Fetch earthquake data from USGS API
 */
export async function fetchUSGSEarthquakes(): Promise<USGSEarthquake[]> {
  const params = new URLSearchParams({
    format: 'geojson',
    latitude: PHILIPPINES_CENTER.lat.toString(),
    longitude: PHILIPPINES_CENTER.lng.toString(),
    maxradiuskm: '150', // 150km radius around Philippines center
    minmagnitude: '1.5', // Only get earthquakes above 1.5 magnitude
    orderby: 'time',
    limit: '50', // Limit to 50 most recent
  });

  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`;

  console.log('🌐 Fetching from USGS:', url);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Rescuenect-EarthquakeMonitor/1.0 (+https://rescuenect.com)',
    },
  });

  if (!response.ok) {
    throw new Error(`USGS API failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.features || [];
}

/**
 * Process raw USGS earthquake data
 */
export function processEarthquakeData(earthquake: USGSEarthquake): ProcessedEarthquake {
  const magnitude = earthquake.properties.mag;
  const severity = classifyEarthquakeSeverity(magnitude);
  const priority = determinePriority(magnitude);

  return {
    id: earthquake.id,
    magnitude: magnitude,
    place: earthquake.properties.place,
    time: earthquake.properties.time,
    updated: earthquake.properties.updated,
    coordinates: {
      longitude: earthquake.geometry.coordinates[0],
      latitude: earthquake.geometry.coordinates[1],
      depth: earthquake.geometry.coordinates[2],
    },
    severity: severity,
    priority: priority,
    tsunami_warning: earthquake.properties.tsunami === 1,
    usgs_url: earthquake.properties.url,
    distance_km: calculateDistance(
      PHILIPPINES_CENTER.lat,
      PHILIPPINES_CENTER.lng,
      earthquake.geometry.coordinates[1],
      earthquake.geometry.coordinates[0]
    ),
    notification_sent: false,
    created_at: Date.now(),
    updated_at: Date.now(),
  };
}

/**
 * Classify earthquake severity based on magnitude
 */
export function classifyEarthquakeSeverity(magnitude: number): ProcessedEarthquake['severity'] {
  if (magnitude < 2.0) return 'micro';
  if (magnitude < 4.0) return 'minor';
  if (magnitude < 5.0) return 'light';
  if (magnitude < 6.0) return 'moderate';
  if (magnitude < 7.0) return 'strong';
  if (magnitude < 8.0) return 'major';
  return 'great';
}

/**
 * Determine notification priority based on magnitude
 */
export function determinePriority(magnitude: number): ProcessedEarthquake['priority'] {
  if (magnitude < 3.0) return 'low';
  if (magnitude < 5.0) return 'normal';
  if (magnitude < 6.0) return 'high';
  return 'critical';
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Filter earthquakes that should trigger notifications
 */
export function shouldNotify(earthquake: ProcessedEarthquake): boolean {
  // Don't notify for micro earthquakes
  if (earthquake.magnitude < 2.0) return false;

  // Always notify for strong earthquakes
  if (earthquake.magnitude >= 5.0) return true;

  // Always notify for tsunami warnings
  if (earthquake.tsunami_warning) return true;

  // Notify for moderate earthquakes closer to populated areas
  if (earthquake.magnitude >= 4.0 && earthquake.distance_km && earthquake.distance_km <= 50) return true;

  // Notify for minor earthquakes very close to populated areas
  if (earthquake.magnitude >= 3.0 && earthquake.distance_km && earthquake.distance_km <= 20) return true;

  return false;
}

/**
 * Format earthquake time for display
 */
export function formatEarthquakeTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get emoji for earthquake severity
 */
export function getEarthquakeEmoji(severity: string, tsunamiWarning: boolean): string {
  if (tsunamiWarning) return '🌊';

  switch (severity) {
    case 'micro':
      return '🔵';
    case 'minor':
      return '🟡';
    case 'light':
      return '🟠';
    case 'moderate':
      return '🔴';
    case 'strong':
      return '🚨';
    case 'major':
      return '⚠️';
    case 'great':
      return '🆘';
    default:
      return '🔶';
  }
}
```

---

### Step 5: Main Earthquake Monitor Function

**File:** `c:\Users\Paul\Rescuenect\Backend\supabase\functions\earthquake-monitor\index.ts`

**REPLACE ALL CONTENT WITH:**

```typescript
import { serve } from 'serve';
import { sendEarthquakeNotification } from '../_shared/fcm-client.ts';
import {
  getUserTokens,
  saveNotificationHistory,
  getExistingEarthquakes,
  saveEarthquakesToFirestore,
} from '../_shared/firestore-client.ts';
import { fetchUSGSEarthquakes, processEarthquakeData, shouldNotify } from '../_shared/earthquake-utils.ts';
import type { EarthquakeMonitorResult, ProcessedEarthquake } from '../_shared/types.ts';

console.log('🌍 Earthquake Monitor Function Loaded');

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

  console.log('🔍 Starting earthquake monitoring cycle...');

  try {
    // Step 1: Fetch earthquake data from USGS
    const rawEarthquakes = await fetchUSGSEarthquakes();
    console.log(`📊 Fetched ${rawEarthquakes.length} earthquakes from USGS`);

    if (rawEarthquakes.length === 0) {
      return createResponse({
        success: true,
        message: 'No earthquakes found in the region',
        new_earthquakes: 0,
        notifications_sent: 0,
        total_processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Step 2: Process earthquake data
    const processedEarthquakes = rawEarthquakes.map(processEarthquakeData);
    console.log(`⚙️ Processed ${processedEarthquakes.length} earthquakes`);

    // Step 3: Get existing earthquakes to prevent duplicates
    const existingIds = await getExistingEarthquakes(200);
    console.log(`🗄️ Found ${existingIds.length} existing earthquakes in database`);

    // Step 4: Identify new earthquakes
    const newEarthquakes = processedEarthquakes.filter(earthquake => !existingIds.includes(earthquake.id));
    console.log(`🆕 Identified ${newEarthquakes.length} new earthquakes`);

    if (newEarthquakes.length === 0) {
      return createResponse({
        success: true,
        message: 'No new earthquakes detected',
        new_earthquakes: 0,
        notifications_sent: 0,
        total_processed: processedEarthquakes.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Step 5: Filter earthquakes that need notifications
    const notifiableEarthquakes = newEarthquakes.filter(shouldNotify);
    console.log(`🔔 ${notifiableEarthquakes.length} earthquakes need notifications`);

    let notificationsSent = 0;
    const notificationResults = [];

    // Step 6: Send notifications for qualifying earthquakes
    for (const earthquake of notifiableEarthquakes) {
      try {
        // Get all user tokens (both admin and users for earthquake alerts)
        const { tokens } = await getUserTokens('both');

        if (tokens.length === 0) {
          console.log(`No users to notify for earthquake ${earthquake.id}`);
          continue;
        }

        console.log(`📱 Sending earthquake notification to ${tokens.length} users`);

        // Send FCM notification using your existing function
        const fcmResult = await sendEarthquakeNotification(earthquake, tokens);

        // Save notification history using your updated function
        await saveNotificationHistory(
          {
            title: `🚨 Earthquake Alert - Magnitude ${earthquake.magnitude}`,
            body: `${earthquake.place} - Stay alert and follow safety protocols.`,
            type: 'earthquake',
            level:
              earthquake.priority === 'critical' ? 'critical' : earthquake.priority === 'high' ? 'warning' : 'info',
            category: 'seismic',
            data: {
              earthquake_id: earthquake.id,
              magnitude: earthquake.magnitude,
              severity: earthquake.severity,
              tsunami_warning: earthquake.tsunami_warning,
            },
          },
          {
            location: 'Philippines',
            audience: 'both',
            magnitude: earthquake.magnitude,
            depth: earthquake.coordinates.depth,
            coordinates: {
              lat: earthquake.coordinates.latitude,
              lng: earthquake.coordinates.longitude,
            },
            source: 'USGS',
          },
          fcmResult.success,
          fcmResult.errors
        );

        earthquake.notification_sent = true;
        notificationsSent++;

        notificationResults.push({
          earthquake_id: earthquake.id,
          magnitude: earthquake.magnitude,
          users_notified: fcmResult.success,
          errors: fcmResult.errors,
        });

        console.log(`✅ Notification sent for earthquake ${earthquake.id} to ${fcmResult.success} users`);

        // Rate limiting between notifications
        await delay(1000);
      } catch (error) {
        console.error(`❌ Failed to send notification for earthquake ${earthquake.id}:`, error);
        notificationResults.push({
          earthquake_id: earthquake.id,
          magnitude: earthquake.magnitude,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Step 7: Save all new earthquakes to database
    await saveEarthquakesToFirestore(newEarthquakes);
    console.log(`💾 Saved ${newEarthquakes.length} new earthquakes to database`);

    const processingTime = Math.round(performance.now() - startTime);
    console.log(`⏱️ Monitoring cycle completed in ${processingTime}ms`);

    return createResponse({
      success: true,
      message: `Monitoring completed: ${newEarthquakes.length} new earthquakes, ${notificationsSent} notifications sent`,
      new_earthquakes: newEarthquakes.length,
      notifications_sent: notificationsSent,
      total_processed: processedEarthquakes.length,
      timestamp: new Date().toISOString(),
      earthquakes: newEarthquakes.map(eq => ({
        id: eq.id,
        magnitude: eq.magnitude,
        place: eq.place,
        time: new Date(eq.time).toISOString(),
        severity: eq.severity,
      })),
    });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ Earthquake monitoring failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
      } as EarthquakeMonitorResult),
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

/**
 * Create standardized response
 */
function createResponse(data: EarthquakeMonitorResult): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Utility delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 🔧 ENVIRONMENT VARIABLES

Make sure these are set in your Supabase project:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON=your_base64_encoded_firebase_service_account
```

---

## 📅 CRON SETUP

### Option 1: Via Supabase Dashboard

1. Go to **Edge Functions** → **Crons**
2. Add new cron job:
   - **Name**: `earthquake-monitor`
   - **Function**: `earthquake-monitor`
   - **Cron Expression**: `*/5 * * * *` (every 5 minutes)

### Option 2: Via SQL (Run in Supabase SQL Editor)

```sql
SELECT cron.schedule('earthquake-monitor', '*/5 * * * *', 'https://your-project-ref.supabase.co/functions/v1/earthquake-monitor');
```

---

## 🧪 TESTING

### Test the function manually:

```bash
# Test from your project root
curl -X POST https://your-project-ref.supabase.co/functions/v1/earthquake-monitor \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Expected Response:

```json
{
  "success": true,
  "message": "Monitoring completed: 2 new earthquakes, 1 notifications sent",
  "new_earthquakes": 2,
  "notifications_sent": 1,
  "total_processed": 5,
  "timestamp": "2024-11-19T10:30:00.000Z",
  "earthquakes": [
    {
      "id": "us7000abcd",
      "magnitude": 4.2,
      "place": "15 km NE of Manila, Philippines",
      "time": "2024-11-19T10:25:00.000Z",
      "severity": "light"
    }
  ]
}
```

---

## 🎯 KEY BENEFITS OF THIS IMPLEMENTATION

✅ **Reuses your existing infrastructure** - No duplicate code
✅ **Leverages your FCM setup** - Uses your existing `sendFCMNotification`
✅ **Uses your Firestore client** - Consistent database operations
✅ **Follows your patterns** - Matches your notification system structure
✅ **Ready to deploy** - Just copy, paste, and run
✅ **Production ready** - Includes error handling, rate limiting, and logging

---

## 📋 CHECKLIST

- [ ] Copy types to `_shared/types.ts`
- [ ] Add functions to `_shared/firestore-client.ts`
- [ ] Update `_shared/fcm-client.ts` with enhanced earthquake function
- [ ] Create `_shared/earthquake-utils.ts`
- [ ] Replace `earthquake-monitor/index.ts` content
- [ ] Set up cron job for every 5 minutes
- [ ] Test the function
- [ ] Monitor logs for any issues

**That's it! Your earthquake monitoring system is ready to go! 🚀**
