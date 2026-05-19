import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const DEFAULT_SERVER_URL = 'https://rescuenect-backend.onrender.com';
const DEFAULT_ENDPOINTS = ['/health'];
const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;

type HealthCheckResult = {
  endpoint: string;
  url: string;
  ok: boolean;
  status?: number;
  statusText?: string;
  responseTimeMs: number;
  error?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  const serverUrl = normalizeServerUrl(
    Deno.env.get('SERVER_WAKEUP_URL') ?? Deno.env.get('BACKEND_URL') ?? DEFAULT_SERVER_URL
  );
  const endpoints = getHealthEndpoints();
  const requestTimeoutMs = getRequestTimeoutMs();
  const startedAt = performance.now();

  console.log(`Starting server wakeup for ${serverUrl}: ${endpoints.join(', ')}`);

  const results = await Promise.all(endpoints.map(endpoint => pingEndpoint(serverUrl, endpoint, requestTimeoutMs)));
  const successfulChecks = results.filter(result => result.ok).length;
  const success = successfulChecks > 0;

  return jsonResponse(
    {
      success,
      message: success
        ? `Server wakeup completed with ${successfulChecks}/${results.length} successful health check(s)`
        : 'Server wakeup failed: no health checks succeeded',
      serverUrl,
      endpoints,
      requestTimeoutMs,
      results,
      totalResponseTimeMs: Math.round(performance.now() - startedAt),
      timestamp: new Date().toISOString(),
    },
    success ? 200 : 502
  );
});

function getHealthEndpoints(): string[] {
  const configuredEndpoints = Deno.env.get('SERVER_WAKEUP_ENDPOINTS');

  if (!configuredEndpoints) {
    return DEFAULT_ENDPOINTS;
  }

  const endpoints = configuredEndpoints
    .split(',')
    .map(endpoint => endpoint.trim())
    .filter(Boolean)
    .map(endpoint => (endpoint.startsWith('/') ? endpoint : `/${endpoint}`));

  return endpoints.length > 0 ? endpoints : DEFAULT_ENDPOINTS;
}

function normalizeServerUrl(serverUrl: string): string {
  return serverUrl.replace(/\/+$/, '');
}

function getRequestTimeoutMs(): number {
  const configuredTimeout = Number(Deno.env.get('SERVER_WAKEUP_TIMEOUT_MS'));

  if (Number.isFinite(configuredTimeout) && configuredTimeout > 0) {
    return configuredTimeout;
  }

  return DEFAULT_REQUEST_TIMEOUT_MS;
}

async function pingEndpoint(
  serverUrl: string,
  endpoint: string,
  requestTimeoutMs: number
): Promise<HealthCheckResult> {
  const url = `${serverUrl}${endpoint}`;
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(requestTimeoutMs),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Rescuenect-Supabase-Wakeup/1.0',
      },
    });

    return {
      endpoint,
      url,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTimeMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    return {
      endpoint,
      url,
      ok: false,
      responseTimeMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
