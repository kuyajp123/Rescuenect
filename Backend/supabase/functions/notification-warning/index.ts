import { serve } from 'serve';
import { NotificationProcessor, NotificationConfig } from '../_shared/notification-engine.ts';

console.log('⚠️ Warning Notification Function Loaded');

const processor = new NotificationProcessor();

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

  console.log('⚠️ Processing WARNING weather notifications...');

  try {
    const config: NotificationConfig = {
      level: 'WARNING',
      maxNotificationsPerLocation: 3, // Limit warning spam
      cooldownPeriod: 30, // 30 minutes between same warnings
      targetAudience: 'both', // Notify admins and public
    };

    const results = await processor.processNotificationsForLevel(config);
    const processingTime = Math.round(performance.now() - startTime);

    const response = {
      success: true,
      level: 'WARNING',
      results: results,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      message: `Warning notifications: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`,
    };

    console.log('✅ Warning notifications processed:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ Warning notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        level: 'WARNING',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTimeMs: processingTime,
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
