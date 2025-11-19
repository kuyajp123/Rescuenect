import { serve } from 'serve';
import { UnifiedWeatherProcessor } from '../_shared/unified-weather-processor.ts';

console.log('🌤️ Unified Weather Notification Function Loaded');

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

  console.log('🔍 Processing current weather notifications...');

  try {
    const processor = new UnifiedWeatherProcessor();

    const result = await processor.processWeatherNotifications({
      type: 'current',
      includeNormalConditions: true, // Include normal conditions for testing
      targetAudience: 'both', // Send to both admin and users
    });

    const processingTime = Math.round(performance.now() - startTime);

    const response = {
      success: result.success,
      type: 'current_weather',
      notifications_sent: result.notifications_sent,
      locations_processed: result.locations_processed,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString(),
      message: `Current weather notifications: ${result.notifications_sent} sent across ${result.locations_processed} locations`,
      details: result.notifications_details,
      errors: result.errors,
    };

    console.log('✅ Current weather notifications completed:', response);

    return new Response(JSON.stringify(response), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ Current weather notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        type: 'current_weather',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
      }),
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
