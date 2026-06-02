import { serve } from 'serve';
import {
  fetchUSGSEarthquakesForScope,
  getEarthquakeEventAgeMinutes,
  getEarthquakeHistoryConfig,
  isEarthquakeEventFresh,
  mergeClientEarthquakes,
  processEarthquakeDataForScope,
  shouldNotify,
} from '../_shared/earthquake-utils.ts';
import { sendEarthquakeNotification } from '../_shared/fcm-client.ts';
import {
  getActiveEarthquakeClientScopes,
  reserveEarthquakeNotification,
  getExistingEarthquakes,
  getUserTokensByClientId,
  initializeFirebase,
  replaceEarthquakesInFirestore,
  updateEarthquakeNotificationReservation,
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
    const now = Date.now();
    const historyConfig = getEarthquakeHistoryConfig();
    const clientScopes = await getActiveEarthquakeClientScopes();
    const processedByClient: ProcessedEarthquake[] = [];

    for (const scope of clientScopes) {
      try {
        const rawEarthquakes = await fetchUSGSEarthquakesForScope(scope, { now });
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
        message: `No earthquakes found in active client scopes for the last ${historyConfig.historyLookbackDays} day(s) - history cache cleared`,
        new_earthquakes: 0,
        notifications_sent: 0,
        total_processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    const newEarthquakes = processedEarthquakes.filter(
      earthquake => !existingEarthquakes.some(existing => existing.id === earthquake.id)
    );
    const newEarthquakeIds = new Set(newEarthquakes.map(earthquake => earthquake.id));
    const notificationEarthquakes = processedEarthquakes.filter(
      earthquake => newEarthquakeIds.has(earthquake.id) || isEarthquakeEventFresh(earthquake)
    );

    let notificationsSent = 0;
    const notificationResults: Array<Record<string, unknown>> = [];

    for (const earthquake of notificationEarthquakes) {
      const impacts = earthquake.clientImpacts || [];

      for (const impact of impacts) {
        if (!shouldNotify(earthquake, impact)) continue;

        let reservedNotificationId: string | null = null;
        let inAppNotificationSaved = false;

        try {
          const { tokens, barangays, clientName, weatherLocationKey } = await getUserTokensByClientId(
            'both',
            impact.clientId
          );

          const reservation = await reserveEarthquakeNotification({
            clientId: impact.clientId,
            clientName,
            earthquakeId: earthquake.id,
            eventTime: earthquake.time,
            magnitude: earthquake.magnitude,
            place: earthquake.place,
          });

          reservedNotificationId = reservation.notificationId;

          if (!reservation.reserved) {
            notificationResults.push({
              earthquake_id: earthquake.id,
              clientId: impact.clientId,
              magnitude: earthquake.magnitude,
              duplicate_skipped: true,
            });
            continue;
          }

          const initialDeliveryStatus = buildDeliveryStatus({
            success: 0,
            failure: 0,
            errors: [],
          });

          await saveEarthquakeNotification({
            notificationId: reservation.notificationId,
            earthquake,
            impact: { ...impact, clientName, weatherLocationKey },
            barangays,
            sentTo: 0,
            deliveryStatus: initialDeliveryStatus,
          });

          inAppNotificationSaved = true;
          earthquake.notification_sent = true;
          notificationsSent++;

          await updateEarthquakeNotificationReservation(reservation.notificationId, {
            status: 'sent',
            sentAt: Date.now(),
            sentTo: 0,
            deliveryStatus: initialDeliveryStatus,
            inAppNotificationSaved: true,
            pushStatus: tokens.length > 0 ? 'pending' : 'skipped_no_tokens',
          });

          let fcmResult: { success: number; failure: number; errors: string[] } = {
            success: 0,
            failure: 0,
            errors: [],
          };

          if (tokens.length > 0) {
            try {
              fcmResult = await sendEarthquakeNotification(earthquake, tokens);
            } catch (pushError) {
              fcmResult = {
                success: 0,
                failure: tokens.length,
                errors: [pushError instanceof Error ? pushError.message : 'Unknown FCM error'],
              };
              console.error(`Earthquake push failed for ${earthquake.id} and ${impact.clientId}:`, pushError);
            }

            const pushDeliveryStatus = buildDeliveryStatus(fcmResult);
            const sentTo = fcmResult.success + fcmResult.failure;

            await updateEarthquakeNotificationDelivery(reservation.notificationId, sentTo, pushDeliveryStatus);
            await updateEarthquakeNotificationReservation(reservation.notificationId, {
              status: 'sent',
              sentAt: Date.now(),
              sentTo,
              deliveryStatus: pushDeliveryStatus,
              inAppNotificationSaved: true,
              pushStatus: fcmResult.success > 0 ? 'sent' : 'failed',
              pushAttemptedAt: Date.now(),
            });
          } else {
            console.log(
              `No FCM tokens found for earthquake ${earthquake.id} and client ${impact.clientId}; saved in-app notification only`
            );
          }

          notificationResults.push({
            earthquake_id: earthquake.id,
            clientId: impact.clientId,
            magnitude: earthquake.magnitude,
            in_app_notification_saved: true,
            push_success: fcmResult.success,
            push_failure: fcmResult.failure,
            errors: fcmResult.errors,
          });

          await delay(1000);
        } catch (error) {
          console.error(`Failed to send notification for ${earthquake.id} and ${impact.clientId}:`, error);
          if (reservedNotificationId) {
            try {
              await updateEarthquakeNotificationReservation(reservedNotificationId, {
                status: inAppNotificationSaved ? 'sent' : 'failed',
                reason: error instanceof Error ? error.message : 'Unknown error',
                inAppNotificationSaved,
              });
            } catch (reservationError) {
              console.error(`Failed to update earthquake dedupe reservation ${reservedNotificationId}:`, reservationError);
            }
          }
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
      `Earthquake monitoring completed: ${newEarthquakes.length} new, ${notificationEarthquakes.length} notification candidate(s), ${notificationsSent} client notifications sent`
    );

    return createResponse({
      success: true,
      message: `History cache updated: ${newEarthquakes.length} newly discovered earthquake record(s), ${notificationsSent} fresh client notification(s) sent`,
      new_earthquakes: newEarthquakes.length,
      notifications_sent: notificationsSent,
      total_processed: processedEarthquakes.length,
      timestamp: new Date().toISOString(),
      earthquakes: newEarthquakes.map(eq => ({
        id: eq.id,
        magnitude: eq.magnitude,
        place: eq.place,
        time: new Date(eq.time).toISOString(),
        age_minutes: getEarthquakeEventAgeMinutes(eq.time),
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
  notificationId: string;
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
    eventTime: earthquake.time,
    eventTimeIso: new Date(earthquake.time).toISOString(),
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
    impact_radii: {
      felt_radius_km: earthquake.impact_radii.felt_radius_km,
      moderate_shaking_radius_km: earthquake.impact_radii.moderate_shaking_radius_km,
      strong_shaking_radius_km: earthquake.impact_radii.strong_shaking_radius_km,
    },
  };

  if (impact.clientId === 'naic') {
    earthquakeData.distanceFromNaic = impact.distanceKm;
  }

  await notificationService.createEarthquakeNotification({
    notificationId: params.notificationId,
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

function buildDeliveryStatus(fcmResult: { success: number; failure: number; errors: string[] }): {
  success: number;
  failure: number;
  errors?: string[];
} {
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

  return deliveryStatus;
}

async function updateEarthquakeNotificationDelivery(
  notificationId: string,
  sentTo: number,
  deliveryStatus: { success: number; failure: number; errors?: string[] }
): Promise<void> {
  const db = initializeFirebase();
  await db.collection('notifications').doc(notificationId).set(
    {
      sentTo,
      deliveryStatus,
      pushAttemptedAt: Date.now(),
    },
    { merge: true }
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
