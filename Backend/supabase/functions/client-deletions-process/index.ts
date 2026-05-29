import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const DEFAULT_BACKEND_URL = 'https://rescuenect-backend.onrender.com';
const DEFAULT_TIMEOUT_MS = 120_000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return jsonResponse(null, 204);
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  const secret = Deno.env.get('CLIENT_DELETION_CRON_SECRET') ?? Deno.env.get('CRON_SECRET');
  if (!secret) {
    return jsonResponse({ success: false, error: 'CLIENT_DELETION_CRON_SECRET is not configured' }, 500);
  }

  const url =
    Deno.env.get('CLIENT_DELETION_PROCESS_URL') ??
    `${normalizeBackendUrl(Deno.env.get('BACKEND_URL') ?? DEFAULT_BACKEND_URL)}/internal/scheduled/client-deletions/process`;
  const timeoutMs = getTimeoutMs();
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Rescuenect-Client-Deletion-Scheduler/1.0',
      },
      body: JSON.stringify({ source: 'supabase_scheduled_function' }),
    });
    const text = await response.text();
    const body = parseJson(text);

    return jsonResponse(
      {
        success: response.ok,
        status: response.status,
        responseTimeMs: Math.round(performance.now() - startedAt),
        result: body ?? text,
        timestamp: new Date().toISOString(),
      },
      response.ok ? 200 : 502
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs: Math.round(performance.now() - startedAt),
        timestamp: new Date().toISOString(),
      },
      502
    );
  }
});

function normalizeBackendUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function getTimeoutMs(): number {
  const configuredTimeout = Number(Deno.env.get('CLIENT_DELETION_TIMEOUT_MS'));
  return Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : DEFAULT_TIMEOUT_MS;
}

function parseJson(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
