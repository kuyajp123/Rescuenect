import { serve } from 'serve';
import { fetchUSGSEarthquakes, processEarthquakeData, shouldNotify } from '../_shared/earthquake-utils.ts';
import { sendEarthquakeNotification } from '../_shared/fcm-client.ts';
import {
  getExistingEarthquakes,
  getUserTokens,
  initializeFirebase,
  replaceEarthquakesInFirestore,
} from '../_shared/firestore-client.ts';
import type { EarthquakeNotificationData } from '../_shared/notification-schema.ts';
import { NotificationService } from '../_shared/notification-service.ts';
import type { EarthquakeMonitorResult } from '../_shared/types.ts';

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
    // const rawEarthquakes: unknown[] = []; // TEMPORARY DISABLE FETCHING FOR TESTING
    // Step 2: Process earthquake data (even if empty array)
    const processedEarthquakes = rawEarthquakes.map(processEarthquakeData);

    // Step 3: Get existing earthquakes BEFORE replacing database (for notification logic)
    const existingEarthquakes = await getExistingEarthquakes();

    // Step 4: Always replace earthquake database with current USGS data (even if empty)
    await replaceEarthquakesInFirestore(
      processedEarthquakes as unknown as Array<{ [key: string]: unknown; id: string }>,
      existingEarthquakes
    );

    if (rawEarthquakes.length === 0) {
      return createResponse({
        success: true,
        message: 'No earthquakes found in the region - database cleared',
        new_earthquakes: 0,
        notifications_sent: 0,
        total_processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Step 5: Identify new earthquakes (for notifications only)
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

    // Step 6: Filter earthquakes that need notifications
    const notifiableEarthquakes = newEarthquakes.filter(shouldNotify);

    console.log(
      `📢 Found ${newEarthquakes.length} new earthquakes, ${notifiableEarthquakes.length} need notifications`
    );

    let notificationsSent = 0;
    const notificationResults = [];

    // Step 7: Send notifications for qualifying earthquakes
    for (const earthquake of notifiableEarthquakes) {
      try {
        // Get all user tokens (both admin and users for earthquake alerts)
        const { tokens } = await getUserTokens('both');

        if (tokens.length === 0) {
          console.log(`⚠️ No FCM tokens found for earthquake ${earthquake.id}`);
          continue;
        }

        // Send FCM notification using your existing function
        const fcmResult = await sendEarthquakeNotification(earthquake, tokens);

        if (fcmResult.success > 0) {
          // Save notification using new NotificationService
          try {
            const db = initializeFirebase();
            const notificationService = new NotificationService(db);

            // Prepare earthquake notification data
            // Map priority: 'normal' -> 'medium' for schema compatibility
            const mappedPriority: 'critical' | 'high' | 'medium' | 'low' =
              earthquake.priority === 'normal' ? 'medium' : earthquake.priority;

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
              distanceFromNaic: earthquake.distance_km,
            };

            // Prepare delivery status (only add errors if they exist)
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

            // Determine notification title based on severity
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

            // Determine notification message
            const timeString = new Date(earthquake.time).toLocaleString('en-PH', {
              timeZone: 'Asia/Manila',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

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

            // Create the notification in the new schema
            await notificationService.createEarthquakeNotification({
              title: title,
              message: message,
              location: 'central_naic', // Default location for earthquake (affects all of Naic)
              audience: 'both',
              sentTo: fcmResult.success + fcmResult.failure,
              earthquakeData: earthquakeData,
              deliveryStatus: deliveryStatus,
            });

            earthquake.notification_sent = true;
            notificationsSent++; // Only increment if notifications were actually sent

            console.log(`✅ Notification sent for earthquake ${earthquake.id} to ${fcmResult.success} users`);
          } catch (historyError) {
            console.error(`⚠️ Failed to save notification for ${earthquake.id}:`, historyError);
            // Don't fail the whole process if notification saving fails
          }
        }

        notificationResults.push({
          earthquake_id: earthquake.id,
          magnitude: earthquake.magnitude,
          users_notified: fcmResult.success,
          errors: fcmResult.errors,
        });

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

    console.log(
      `✅ Earthquake monitoring completed: ${newEarthquakes.length} new, ${notificationsSent} notifications sent`
    );

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
