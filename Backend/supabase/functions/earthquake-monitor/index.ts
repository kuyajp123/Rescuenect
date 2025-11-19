import { serve } from 'serve';
import { fetchUSGSEarthquakes, processEarthquakeData, shouldNotify } from '../_shared/earthquake-utils.ts';
import { sendEarthquakeNotification } from '../_shared/fcm-client.ts';
import {
  getExistingEarthquakes,
  getUserTokens,
  saveEarthquakesToFirestore,
  saveNotificationHistory,
} from '../_shared/firestore-client.ts';
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

    // Debug: Log details about each earthquake and why it was/wasn't selected for notification
    newEarthquakes.forEach(eq => {
      const shouldSendNotification = shouldNotify(eq);
      console.log(
        `📋 Earthquake ${eq.id}: Mag ${eq.magnitude}, Distance ${eq.distance_km}km, Notify: ${shouldSendNotification}`
      );
    });

    let notificationsSent = 0;
    const notificationResults = [];

    // Step 6: Send notifications for qualifying earthquakes
    for (const earthquake of notifiableEarthquakes) {
      try {
        // Get all user tokens (both admin and users for earthquake alerts)
        const { tokens } = await getUserTokens('both');

        if (tokens.length === 0) {
          console.log(`⚠️ No FCM tokens found for earthquake ${earthquake.id} - checking database collections...`);
          continue;
        }

        console.log(`📱 Sending earthquake notification to ${tokens.length} users`);

        // Send FCM notification using your existing function
        const fcmResult = await sendEarthquakeNotification(earthquake, tokens);

        if (fcmResult.success > 0) {
          // Only save notification history and increment counter if notifications were actually sent
          try {
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
                // Remove weatherZone since it's undefined for earthquake notifications
              },
              fcmResult.success,
              fcmResult.errors
            );

            console.log(`💾 Notification history saved for earthquake ${earthquake.id}`);
          } catch (historyError) {
            console.error(`⚠️ Failed to save notification history for ${earthquake.id}:`, historyError);
            // Don't fail the whole process if history saving fails
          }

          earthquake.notification_sent = true;
          notificationsSent++; // Only increment if notifications were actually sent

          console.log(`✅ Notification sent for earthquake ${earthquake.id} to ${fcmResult.success} users`);
        } else {
          console.log(`⚠️ No notifications sent for earthquake ${earthquake.id} (0 successful deliveries)`);
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

    // Step 7: Save all new earthquakes to database
    await saveEarthquakesToFirestore(newEarthquakes as unknown as Array<{ [key: string]: unknown; id: string }>);
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
