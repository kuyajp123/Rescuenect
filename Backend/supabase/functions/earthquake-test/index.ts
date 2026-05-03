import { serve } from 'serve';
import { classifyEarthquakeSeverity, determinePriority, estimateEarthquakeRadii } from '../_shared/earthquake-utils.ts';
import { sendEarthquakeNotification } from '../_shared/fcm-client.ts';
import { getUserTokens, initializeFirebase, saveEarthquakesToFirestore } from '../_shared/firestore-client.ts';
import type { EarthquakeNotificationData } from '../_shared/notification-schema.ts';
import { NotificationService } from '../_shared/notification-service.ts';

console.log('🧪 Earthquake Test Notification Function Loaded');

type Audience = 'admin' | 'users' | 'both';

type EarthquakeTestRequest = {
  audience?: Audience;
  sendPush?: boolean;
  saveNotification?: boolean;
  earthquake?: Partial<EarthquakeTestInput>;
} & Partial<EarthquakeTestInput>;

type EarthquakeTestInput = {
  id?: string;
  magnitude: number;
  place?: string;
  time?: number;
  updated?: number;
  tsunami_warning?: boolean;
  usgs_url?: string;
  latitude?: number;
  longitude?: number;
  depth?: number;
  coordinates?: {
    latitude?: number;
    longitude?: number;
    depth?: number;
    lat?: number;
    lng?: number;
  };
  lat?: number;
  lng?: number;
};

serve(async (req: Request) => {
  const startTime = performance.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(),
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      {
        success: false,
        message: 'Method not allowed',
        timestamp: new Date().toISOString(),
      },
      405
    );
  }

  const role = getSupabaseJwtRole(req);
  if (role !== 'service_role') {
    return jsonResponse(
      {
        success: false,
        message: 'Forbidden (service_role required)',
        timestamp: new Date().toISOString(),
      },
      403
    );
  }

  let body: EarthquakeTestRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      {
        success: false,
        message: 'Invalid JSON body',
        timestamp: new Date().toISOString(),
      },
      400
    );
  }

  const input = (body.earthquake ?? body) as Partial<EarthquakeTestInput>;
  const magnitude = Number(input.magnitude);
  if (!Number.isFinite(magnitude)) {
    return jsonResponse(
      {
        success: false,
        message: '`magnitude` must be a number',
        timestamp: new Date().toISOString(),
      },
      400
    );
  }

  const now = Date.now();
  const earthquakeId = (typeof input.id === 'string' ? input.id.trim() : '') || `mock-${now}`;

  const latitude =
    input.latitude ??
    input.lat ??
    input.coordinates?.latitude ??
    input.coordinates?.lat ??
    14.2919325; // Naic center
  const longitude =
    input.longitude ??
    input.lng ??
    input.coordinates?.longitude ??
    input.coordinates?.lng ??
    120.7752839; // Naic center
  const depth = Math.abs(input.depth ?? input.coordinates?.depth ?? 10);

  const time = typeof input.time === 'number' ? input.time : now;
  const updated = typeof input.updated === 'number' ? input.updated : time;
  const place = (typeof input.place === 'string' ? input.place.trim() : '') || 'TEST: Near Naic, Cavite';
  const tsunamiWarning = Boolean(input.tsunami_warning);
  const usgsUrl = (typeof input.usgs_url === 'string' ? input.usgs_url.trim() : '') || 'https://earthquake.usgs.gov/';

  const severity = classifyEarthquakeSeverity(magnitude);
  const priority = determinePriority(magnitude);
  const radii = estimateEarthquakeRadii(magnitude, depth);

  const earthquake = {
    id: earthquakeId,
    magnitude,
    place,
    time,
    updated,
    coordinates: {
      latitude,
      longitude,
      depth,
    },
    severity,
    priority,
    tsunami_warning: tsunamiWarning,
    usgs_url: usgsUrl,
    impact_radii: {
      felt_radius_km: radii.feltRadiusKmRounded,
      moderate_shaking_radius_km: radii.moderateRadiusKmRounded,
      strong_shaking_radius_km: radii.strongRadiusKmRounded,
      estimation_params: radii.params,
    },
    notification_sent: false,
  };

  const audience: Audience =
    body.audience === 'admin' || body.audience === 'users' || body.audience === 'both' ? body.audience : 'admin';
  const sendPush = body.sendPush ?? true;
  const saveNotification = body.saveNotification ?? true;

  try {
    const { tokens } = await getUserTokens(audience);

    const fcmResult = sendPush
      ? await sendEarthquakeNotification(earthquake, tokens)
      : { success: 0, failure: 0, errors: [] as string[] };

    let notificationId: string | null = null;

    if (saveNotification) {
      const db = initializeFirebase();
      const notificationService = new NotificationService(db);

      const mappedPriority: 'critical' | 'high' | 'medium' | 'low' = priority === 'normal' ? 'medium' : priority;

      const earthquakeData: EarthquakeNotificationData = {
        earthquakeId: earthquake.id,
        magnitude: earthquake.magnitude,
        place: earthquake.place,
        coordinates: {
          latitude: earthquake.coordinates.latitude,
          longitude: earthquake.coordinates.longitude,
          depth: earthquake.coordinates.depth,
        },
        severity: earthquake.severity,
        tsunamiWarning: earthquake.tsunami_warning,
        priority: mappedPriority,
        usgsUrl: earthquake.usgs_url,
        source: 'manual',
        impact_radii: {
          felt_radius_km: earthquake.impact_radii.felt_radius_km,
          moderate_shaking_radius_km: earthquake.impact_radii.moderate_shaking_radius_km,
          strong_shaking_radius_km: earthquake.impact_radii.strong_shaking_radius_km,
        },
      };

      const deliveryStatus: {
        success: number;
        failure: number;
        errors?: string[];
      } = {
        success: fcmResult.success,
        failure: fcmResult.failure,
      };

      if (fcmResult.errors.length > 0) {
        deliveryStatus.errors = fcmResult.errors;
      }

      const { title, message } = buildEarthquakeTitleAndMessage(earthquake);

      notificationId = await notificationService.createEarthquakeNotification({
        title,
        message,
        location: 'central_naic',
        audience,
        sentTo: sendPush ? fcmResult.success + fcmResult.failure : 0,
        earthquakeData,
        deliveryStatus: sendPush ? deliveryStatus : undefined,
      });

      // ALSO save the mock earthquake to the 'earthquakes' collection so it appears on the dashboard map
      await saveEarthquakesToFirestore([earthquake]);
    }

    const processingTime = Math.round(performance.now() - startTime);

    return jsonResponse(
      {
        success: true,
        message: 'Earthquake test notification processed',
        audience,
        tokens_found: tokens.length,
        push_sent: sendPush,
        notification_saved: saveNotification,
        notification_id: notificationId,
        fcm: fcmResult,
        earthquake: {
          id: earthquake.id,
          magnitude: earthquake.magnitude,
          place: earthquake.place,
          time: new Date(earthquake.time).toISOString(),
          severity: earthquake.severity,
          priority: earthquake.priority,
          tsunami_warning: earthquake.tsunami_warning,
          coordinates: earthquake.coordinates,
        },
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ Earthquake test notification failed:', error);

    return jsonResponse(
      {
        success: false,
        message: 'Earthquake test notification failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

function buildEarthquakeTitleAndMessage(earthquake: {
  magnitude: number;
  place: string;
  time: number;
  tsunami_warning: boolean;
}) {
  const timeString = new Date(earthquake.time).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let title = '';
  if (earthquake.tsunami_warning) {
    title = `🌊 TSUNAMI WARNING - Magnitude ${earthquake.magnitude} Earthquake`;
  } else if (earthquake.magnitude >= 6.0) {
    title = `🚨 CRITICAL EARTHQUAKE - Magnitude ${earthquake.magnitude}`;
  } else if (earthquake.magnitude >= 5.0) {
    title = `🔴 Strong Earthquake - Magnitude ${earthquake.magnitude}`;
  } else if (earthquake.magnitude >= 4.0) {
    title = `🟠 Earthquake Alert - Magnitude ${earthquake.magnitude}`;
  } else {
    title = `🟡 Minor Earthquake - Magnitude ${earthquake.magnitude}`;
  }

  let message = '';
  if (earthquake.tsunami_warning) {
    message = `🌊 TSUNAMI THREAT: Magnitude ${earthquake.magnitude} earthquake ${earthquake.place} at ${timeString}. MOVE TO HIGHER GROUND IMMEDIATELY!`;
  } else if (earthquake.magnitude >= 6.0) {
    message = `🆘 CRITICAL: Magnitude ${earthquake.magnitude} earthquake ${earthquake.place} at ${timeString}. TAKE IMMEDIATE SHELTER!`;
  } else if (earthquake.magnitude >= 5.0) {
    message = `⚠️ Strong earthquake detected: Magnitude ${earthquake.magnitude} ${earthquake.place} at ${timeString}. Take safety precautions!`;
  } else if (earthquake.magnitude >= 4.0) {
    message = `Magnitude ${earthquake.magnitude} earthquake occurred ${earthquake.place} at ${timeString}. Stay alert and follow safety protocols.`;
  } else {
    message = `Minor earthquake detected: Magnitude ${earthquake.magnitude} ${earthquake.place} at ${timeString}.`;
  }

  return { title, message };
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    },
  });
}

function getSupabaseJwtRole(req: Request): string | null {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1].trim();
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payloadJson = decodeBase64Url(parts[1]);
    const payload = JSON.parse(payloadJson) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  return atob(padded);
}

/*
  Local test:

  1) Start Supabase (from Backend/):
     supabase start
     supabase functions serve earthquake-test

  2) Invoke with service role JWT (never put this in frontend code):

     curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/earthquake-test' ^
       --header 'Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY' ^
       --header 'Content-Type: application/json' ^
       --data '{
         "audience": "admin",
         "sendPush": true,
         "saveNotification": true,
         "magnitude": 5.4,
         "place": "TEST: 10 km ENE of Naic, Cavite",
         "latitude": 14.32,
         "longitude": 120.84,
         "depth": 12,
         "tsunami_warning": false
       }'
*/
