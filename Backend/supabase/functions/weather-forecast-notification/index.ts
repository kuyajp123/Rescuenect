import { serve } from 'serve';
import { UnifiedWeatherProcessor } from '../_shared/unified-weather-processor.ts';

console.log('📅 Weather Forecast Notification Function Loaded (3-hour ahead)');

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

  console.log('🔍 Processing 3-hour forecast weather notifications...');

  try {
    const processor = new UnifiedWeatherProcessor();

    const result = await processor.processWeatherNotifications({
      type: 'forecast_3h',
      includeNormalConditions: true, // Include normal conditions for forecasts
      targetAudience: 'both',
      forecastHoursAhead: 3,
    });

    const processingTime = Math.round(performance.now() - startTime);

    const response = {
      success: result.success,
      type: 'forecast_3h',
      notifications_sent: result.notifications_sent,
      locations_processed: result.locations_processed,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString(),
      forecast_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      message: `3-hour forecast notifications: ${result.notifications_sent} sent across ${result.locations_processed} locations`,
      details: result.notifications_details,
      errors: result.errors,
    };

    console.log('✅ 3-hour forecast notifications completed:', response);

    return new Response(JSON.stringify(response), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ 3-hour forecast notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        type: 'forecast_3h',
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
