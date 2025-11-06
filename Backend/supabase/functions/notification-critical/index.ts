import { serve } from 'serve';
import { NotificationProcessor, NotificationConfig } from '../_shared/notification-engine.ts';

console.log('🚨 Critical Notification Function Loaded');

const processor = new NotificationProcessor();

serve(async (req: Request) => {
  const startTime = performance.now();

  // Handle CORS preflight requests
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

  // Only allow POST requests for processing
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        allowedMethods: ['POST'],
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  console.log('🚨 Processing CRITICAL weather notifications...');

  try {
    // Configuration for critical notifications
    const config: NotificationConfig = {
      level: 'CRITICAL',
      maxNotificationsPerLocation: 5, // Allow multiple critical alerts
      cooldownPeriod: 10, // 10 minutes minimum between same type
      targetAudience: 'both', // Notify everyone for critical conditions
    };

    const results = await processor.processNotificationsForLevel(config);
    const processingTime = Math.round(performance.now() - startTime);

    const response = {
      success: true,
      level: 'CRITICAL',
      results: results,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      message: `Critical notifications: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`,
    };

    console.log('✅ Critical notifications processed:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ Critical notification error:', error);

    const errorResponse = {
      success: false,
      level: 'CRITICAL',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
