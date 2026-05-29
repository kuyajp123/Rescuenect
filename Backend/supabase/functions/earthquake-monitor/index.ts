import { serve } from 'serve';
import {
  fetchUSGSEarthquakesForScope,
  mergeClientEarthquakes,
  processEarthquakeDataForScope,
  shouldNotify,
} from '../_shared/earthquake-utils.ts';
import { sendEarthquakeNotification } from '../_shared/fcm-client.ts';
import {
  getActiveEarthquakeClientScopes,
  getExistingEarthquakes,
  getUserTokensByClientId,
  initializeFirebase,
  replaceEarthquakesInFirestore,
} from '../_shared/firestore-client.ts';
import type { EarthquakeNotificationData } from '../_shared/notification-schema.ts';
import { NotificationService } from '../_shared/notification-service.ts';
import type { ClientEarthquakeImpact, EarthquakeMonitorResult, ProcessedEarthquake } from '../_shared/types.ts';

console.log('Earthquake Monitor Function Loaded');

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

  console.log('Starting earthquake monitoring cycle...');

  try {
    const clientScopes = await getActiveEarthquakeClientScopes();
    const processedByClient: ProcessedEarthquake[] = [];

    for (const scope of clientScopes) {
      try {
        const rawEarthquakes = await fetchUSGSEarthquakesForScope(scope);
        processedByClient.push(...rawEarthquakes.map(earthquake => processEarthquakeDataForScope(earthquake, scope)));
      } catch (error) {
        console.error(`Failed to fetch earthquakes for ${scope.clientId}:`, error);
      }
    }

    const processedEarthquakes = mergeClientEarthquakes(processedByClient);
    const existingEarthquakes = await getExistingEarthquakes();

    await replaceEarthquakesInFirestore(
      processedEarthquakes as unknown as Array<{ [key: string]: unknown; id: string }>,
      existingEarthquakes
    );

    if (processedEarthquakes.length === 0) {
      return createResponse({
        success: true,
        message: 'No earthquakes found in active client scopes - database cleared',
        new_earthquakes: 0,
        notifications_sent: 0,
        total_processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    const newEarthquakes = processedEarthquakes.filter(
      earthquake => !existingEarthquakes.some(existing => existing.id === earthquake.id)
    );

    if (newEarthquakes.length === 0) {
      return createResponse({
        success: true,
        message: 'No new earthquakes detected - database updated',
        new_earthquakes: 0,
        notifications_sent: 0,
        total_processed: processedEarthquakes.length,
        timestamp: new Date().toISOString(),
      });
    }

    let notificationsSent = 0;
    const notificationResults: Array<Record<string, unknown>> = [];

    for (const earthquake of newEarthquakes) {
      const impacts = earthquake.clientImpacts || [];

      for (const impact of impacts) {
        if (!shouldNotify(earthquake, impact)) continue;

        try {
          const { tokens, barangays, clientName, weatherLocationKey } = await getUserTokensByClientId(
            'both',
            impact.clientId
          );

          if (tokens.length === 0) {
            console.log(`No FCM tokens found for earthquake ${earthquake.id} and client ${impact.clientId}`);
            continue;
          }

          const fcmResult = await sendEarthquakeNotification(earthquake, tokens);

          if (fcmResult.success > 0) {
            await saveEarthquakeNotification({
              earthquake,
              impact: { ...impact, clientName, weatherLocationKey },
              barangays,
              sentTo: fcmResult.success + fcmResult.failure,
              deliveryStatus: {
                success: fcmResult.success,
                failure: fcmResult.failure,
                errors: fcmResult.errors.length ? fcmResult.errors : undefined,
              },
            });

            earthquake.notification_sent = true;
            notificationsSent++;
          }

          notificationResults.push({
            earthquake_id: earthquake.id,
            clientId: impact.clientId,
            magnitude: earthquake.magnitude,
            users_notified: fcmResult.success,
            errors: fcmResult.errors,
          });

          await delay(1000);
        } catch (error) {
          console.error(`Failed to send notification for ${earthquake.id} and ${impact.clientId}:`, error);
          notificationResults.push({
            earthquake_id: earthquake.id,
            clientId: impact.clientId,
            magnitude: earthquake.magnitude,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    console.log(
      `Earthquake monitoring completed: ${newEarthquakes.length} new, ${notificationsSent} client notifications sent`
    );

    return createResponse({
      success: true,
      message: `Monitoring completed: ${newEarthquakes.length} new earthquakes, ${notificationsSent} client notifications sent`,
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
    console.error('Earthquake monitoring failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Earthquake monitoring failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        new_earthquakes: 0,
        notifications_sent: 0,
        total_processed: 0,
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

async function saveEarthquakeNotification(params: {
  earthquake: ProcessedEarthquake;
  impact: ClientEarthquakeImpact;
  barangays: string[];
  sentTo: number;
  deliveryStatus: { success: number; failure: number; errors?: string[] };
}) {
  const db = initializeFirebase();
  const notificationService = new NotificationService(db);
  const { earthquake, impact } = params;
  const mappedPriority: 'critical' | 'high' | 'medium' | 'low' =
    earthquake.priority === 'normal' ? 'medium' : earthquake.priority;
  const timeString = new Date(earthquake.time).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const title = getEarthquakeTitle(earthquake);
  const message = getEarthquakeMessage(earthquake, timeString);
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
    source: 'usgs',
    clientId: impact.clientId,
    clientName: impact.clientName,
    distanceFromClient: impact.distanceKm,
    distanceFromNaic: impact.clientId === 'naic' ? impact.distanceKm : undefined,
    impact_radii: {
      felt_radius_km: earthquake.impact_radii.felt_radius_km,
      moderate_shaking_radius_km: earthquake.impact_radii.moderate_shaking_radius_km,
      strong_shaking_radius_km: earthquake.impact_radii.strong_shaking_radius_km,
    },
  };

  await notificationService.createEarthquakeNotification({
    title,
    message,
    location: impact.weatherLocationKey,
    clientId: impact.clientId,
    barangays: params.barangays,
    audience: 'both',
    sentTo: params.sentTo,
    earthquakeData,
    deliveryStatus: params.deliveryStatus,
  });
}

function getEarthquakeTitle(earthquake: ProcessedEarthquake): string {
  if (earthquake.tsunami_warning) return `Tsunami warning - magnitude ${earthquake.magnitude} earthquake`;
  if (earthquake.magnitude >= 6.0) return `Critical earthquake - magnitude ${earthquake.magnitude}`;
  if (earthquake.magnitude >= 5.0) return `Strong earthquake - magnitude ${earthquake.magnitude}`;
  if (earthquake.magnitude >= 4.0) return `Earthquake alert - magnitude ${earthquake.magnitude}`;
  return `Minor earthquake - magnitude ${earthquake.magnitude}`;
}

function getEarthquakeMessage(earthquake: ProcessedEarthquake, timeString: string): string {
  if (earthquake.tsunami_warning) {
    return `Tsunami threat: Magnitude ${earthquake.magnitude} earthquake ${earthquake.place} at ${timeString}. Move to higher ground immediately.`;
  }
  if (earthquake.magnitude >= 6.0) {
    return `Critical: Magnitude ${earthquake.magnitude} earthquake ${earthquake.place} at ${timeString}. Take immediate shelter.`;
  }
  if (earthquake.magnitude >= 5.0) {
    return `Strong earthquake detected: Magnitude ${earthquake.magnitude} ${earthquake.place} at ${timeString}. Take safety precautions.`;
  }
  if (earthquake.magnitude >= 4.0) {
    return `Magnitude ${earthquake.magnitude} earthquake occurred ${earthquake.place} at ${timeString}. Stay alert and follow safety protocols.`;
  }
  return `Minor earthquake detected: Magnitude ${earthquake.magnitude} ${earthquake.place} at ${timeString}.`;
}

function createResponse(data: EarthquakeMonitorResult): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
