import { serve } from 'serve';
import { UnifiedWeatherProcessor } from '../_shared/unified-weather-processor.ts';

console.log('🌅 Tomorrow Weather Notification Function Loaded');

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

  console.log('🔍 Processing tomorrow weather notifications...');

  try {
    const processor = new UnifiedWeatherProcessor();

    const result = await processor.processWeatherNotifications({
      type: 'forecast_tomorrow',
      includeNormalConditions: true, // Include normal conditions for tomorrow's weather
      targetAudience: 'both',
    });

    const processingTime = Math.round(performance.now() - startTime);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = {
      success: result.success,
      type: 'forecast_tomorrow',
      notifications_sent: result.notifications_sent,
      locations_processed: result.locations_processed,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString(),
      forecast_date: tomorrow.toISOString().split('T')[0],
      message: `Tomorrow's weather notifications: ${result.notifications_sent} sent across ${result.locations_processed} locations`,
      details: result.notifications_details,
      errors: result.errors,
    };

    console.log('✅ Tomorrow weather notifications completed:', response);

    return new Response(JSON.stringify(response), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ Tomorrow weather notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        type: 'forecast_tomorrow',
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
