import { supabase } from '@/lib/supabase';

const MANAGEMENT_API_BASE =
  process.env.SUPABASE_MANAGEMENT_API_BASE || 'https://api.supabase.com';
const MANAGEMENT_TOKEN =
  process.env.SUPABASE_MANAGEMENT_ACCESS_TOKEN ||
  process.env.SUPABASE_ACCESS_TOKEN ||
  '';
const DEFAULT_SERVER_WAKEUP_URL = 'https://rescuenect-backend.onrender.com';
const SERVER_WAKEUP_FUNCTION = 'server-wakeup';
const SERVER_WAKEUP_JOB_NAME = 'server-wakeup-every-13-minutes';
const SERVER_WAKEUP_CRON = '*/13 * * * *';
const SERVER_WAKEUP_INTERVAL_MINUTES = 13;

type SupabaseHealthStatus =
  | 'ok'
  | 'warning'
  | 'error'
  | 'unknown'
  | 'not_configured';

type ManagementFunction = {
  id?: string;
  slug?: string;
  name?: string;
  status?: string;
  version?: number;
  created_at?: number;
  updated_at?: number;
  verify_jwt?: boolean;
  import_map?: boolean;
  entrypoint_path?: string;
  import_map_path?: string;
  ezbr_sha256?: string;
};

type ManagementBucket = {
  id?: string;
  name?: string;
  owner?: string;
  public?: boolean;
  created_at?: string;
  updated_at?: string;
  file_size_limit?: number | null;
  allowed_mime_types?: string[] | null;
};

type LogRow = {
  timestamp?: string;
  event_message?: string;
  path?: string;
  status_code?: number | string;
};

type FunctionLogSummary = {
  recentInvocations: number;
  recentErrors: number;
  lastInvocationAt: string | null;
  lastStatusCode: number | null;
  lastErrorMessage: string | null;
  logs: LogRow[];
};

type BucketLogSummary = {
  recentRequests: number;
  recentErrors: number;
  lastRequestAt: string | null;
  lastStatusCode: number | null;
  lastErrorMessage: string | null;
  logs: LogRow[];
};

const nowIso = () => new Date().toISOString();

const projectRefFromUrl = (): string | null => {
  if (process.env.SUPABASE_PROJECT_REF)
    return process.env.SUPABASE_PROJECT_REF.trim();

  try {
    const host = new URL(process.env.SUPABASE_URL || '').hostname;
    const [projectRef] = host.split('.');
    return projectRef || null;
  } catch {
    return null;
  }
};

const normalizeTimestamp = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'number')
    return new Date(
      value > 10_000_000_000 ? value : value * 1000,
    ).toISOString();
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  }
  return null;
};

const toNumberOrNull = (value: unknown): number | null => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const statusCodeFromLog = (row?: LogRow): number | null => {
  if (!row) return null;

  const explicitStatus = toNumberOrNull(row.status_code);
  if (explicitStatus !== null) return explicitStatus;

  const message = String(row.event_message || '');
  const statusMatch =
    message.match(/\|\s*([1-5]\d{2})\s*\|/) ||
    message.match(/\bHTTP\s+([1-5]\d{2})\b/i) ||
    message.match(/\bstatus(?:_code)?\s*[:=]\s*([1-5]\d{2})\b/i);
  return statusMatch ? Number(statusMatch[1]) : null;
};

const statusFromCode = (statusCode: number | null): SupabaseHealthStatus => {
  if (statusCode === null) return 'unknown';
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warning';
  return 'ok';
};

const sqlEscape = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const parseFunctionSlug = (row: LogRow): string | null => {
  const source = `${row.path || ''} ${row.event_message || ''}`;
  const match = source.match(/\/functions\/v1\/([^/?\s|]+)/i);
  return match?.[1] ?? null;
};

const parseBucketName = (row: LogRow): string | null => {
  const source = `${row.path || ''} ${row.event_message || ''}`;
  const match = source.match(
    /\/storage\/v1\/(?:object|render|s3)\/(?:public\/|sign\/|list\/)?([^/?\s|]+)/i,
  );
  return match?.[1] ?? null;
};

const summarizeFunctionLogs = (logs: LogRow[]): FunctionLogSummary => {
  const sortedLogs = logs.slice(0, 50);
  const lastLog = sortedLogs[0];
  const lastStatusCode = statusCodeFromLog(lastLog);
  const errorLogs = sortedLogs.filter((row) => {
    const statusCode = statusCodeFromLog(row);
    return statusCode !== null && statusCode >= 400;
  });

  return {
    recentInvocations: sortedLogs.length,
    recentErrors: errorLogs.length,
    lastInvocationAt: normalizeTimestamp(lastLog?.timestamp),
    lastStatusCode,
    lastErrorMessage: errorLogs[0]?.event_message ?? null,
    logs: sortedLogs,
  };
};

const summarizeBucketLogs = (logs: LogRow[]): BucketLogSummary => {
  const sortedLogs = logs.slice(0, 50);
  const lastLog = sortedLogs[0];
  const lastStatusCode = statusCodeFromLog(lastLog);
  const errorLogs = sortedLogs.filter((row) => {
    const statusCode = statusCodeFromLog(row);
    return statusCode !== null && statusCode >= 400;
  });

  return {
    recentRequests: sortedLogs.length,
    recentErrors: errorLogs.length,
    lastRequestAt: normalizeTimestamp(lastLog?.timestamp),
    lastStatusCode,
    lastErrorMessage: errorLogs[0]?.event_message ?? null,
    logs: sortedLogs,
  };
};

const serverWakeupEndpoints = (): string[] => {
  const configured = process.env.SERVER_WAKEUP_ENDPOINTS;
  if (!configured) return ['/health'];

  const endpoints = configured
    .split(',')
    .map((endpoint) => endpoint.trim())
    .filter(Boolean)
    .map((endpoint) => (endpoint.startsWith('/') ? endpoint : `/${endpoint}`));

  return endpoints.length ? endpoints : ['/health'];
};

const serverWakeupBackendUrl = () =>
  (
    process.env.SERVER_WAKEUP_URL ||
    process.env.BACKEND_URL ||
    DEFAULT_SERVER_WAKEUP_URL
  ).replace(/\/+$/, '');

const functionStatusFromSummary = (
  deployed: boolean,
  summary: FunctionLogSummary,
): SupabaseHealthStatus => {
  if (!deployed) return 'error';
  if (summary.recentErrors > 0) return 'warning';
  if (summary.recentInvocations === 0) return 'unknown';
  return summary.lastStatusCode === null
    ? 'ok'
    : statusFromCode(summary.lastStatusCode);
};

const bucketStatusFromSummary = (
  reachable: boolean,
  summary: BucketLogSummary,
): SupabaseHealthStatus => {
  if (!reachable) return 'error';
  if (summary.recentErrors > 0) return 'warning';
  return summary.lastStatusCode === null
    ? 'ok'
    : statusFromCode(summary.lastStatusCode);
};

export class SupabaseMonitoringService {
  private static projectRef(): string | null {
    return projectRefFromUrl();
  }

  private static isManagementConfigured(): boolean {
    return Boolean(this.projectRef() && MANAGEMENT_TOKEN);
  }

  private static async managementGet<T>(
    path: string,
    params?: Record<string, string | string[] | number | undefined>,
  ): Promise<T> {
    if (!this.projectRef())
      throw new Error('SUPABASE_PROJECT_REF or SUPABASE_URL is not configured');
    if (!MANAGEMENT_TOKEN)
      throw new Error('SUPABASE_MANAGEMENT_ACCESS_TOKEN is not configured');

    const url = new URL(`${MANAGEMENT_API_BASE}${path}`);
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, item));
        return;
      }
      url.searchParams.set(key, String(value));
    });

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${MANAGEMENT_TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Supabase API ${response.status}: ${body || response.statusText}`,
      );
    }

    return (await response.json()) as T;
  }

  private static async listFunctions(): Promise<ManagementFunction[]> {
    const projectRef = this.projectRef();
    if (!projectRef || !MANAGEMENT_TOKEN) return [];
    return this.managementGet<ManagementFunction[]>(
      `/v1/projects/${projectRef}/functions`,
    );
  }

  private static async getFunction(
    slug: string,
  ): Promise<ManagementFunction | null> {
    const projectRef = this.projectRef();
    if (!projectRef || !MANAGEMENT_TOKEN) return null;
    return this.managementGet<ManagementFunction>(
      `/v1/projects/${projectRef}/functions/${encodeURIComponent(slug)}`,
    );
  }

  private static async listBuckets(): Promise<ManagementBucket[]> {
    const projectRef = this.projectRef();

    if (projectRef && MANAGEMENT_TOKEN) {
      try {
        return await this.managementGet<ManagementBucket[]>(
          `/v1/projects/${projectRef}/storage/buckets`,
        );
      } catch {
        // Fall back to the service-role storage API below.
      }
    }

    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw new Error(error.message);
    return (data ?? []) as ManagementBucket[];
  }

  private static async getStorageConfig(): Promise<Record<
    string,
    unknown
  > | null> {
    const projectRef = this.projectRef();
    if (!projectRef || !MANAGEMENT_TOKEN) return null;

    try {
      return await this.managementGet<Record<string, unknown>>(
        `/v1/projects/${projectRef}/config/storage`,
      );
    } catch {
      return null;
    }
  }

  private static async getServiceHealth(): Promise<Record<string, unknown>[]> {
    const projectRef = this.projectRef();
    if (!projectRef || !MANAGEMENT_TOKEN) return [];

    try {
      return await this.managementGet<Record<string, unknown>[]>(
        `/v1/projects/${projectRef}/health`,
        {
          services: ['auth', 'db', 'pooler', 'realtime', 'rest', 'storage'],
          timeout_ms: 3000,
        },
      );
    } catch {
      return [];
    }
  }

  private static async queryLogs(
    sql: string,
    hoursBack = 24,
  ): Promise<LogRow[]> {
    const projectRef = this.projectRef();
    if (!projectRef || !MANAGEMENT_TOKEN) return [];

    const end = new Date();
    const start = new Date(end.getTime() - hoursBack * 60 * 60 * 1000);

    try {
      const response = await this.managementGet<{ result?: LogRow[] }>(
        `/v1/projects/${projectRef}/analytics/endpoints/logs.all`,
        {
          sql,
          iso_timestamp_start: start.toISOString(),
          iso_timestamp_end: end.toISOString(),
        },
      );
      return Array.isArray(response.result) ? response.result : [];
    } catch {
      return [];
    }
  }

  private static async getFunctionLogs(slug?: string): Promise<LogRow[]> {
    const where = slug
      ? `where r.path like '%/functions/v1/${sqlEscape(slug)}%'`
      : '';
    const sql = `
      select datetime(t.timestamp) as timestamp, t.event_message, r.path as path, response.status_code as status_code
      from function_edge_logs as t
      cross join unnest(t.metadata) as metadata
      cross join unnest(metadata.request) as r
      cross join unnest(metadata.response) as response
      ${where}
      order by t.timestamp desc
      limit ${slug ? 100 : 1000}
    `;

    const nestedRows = await this.queryLogs(sql);
    if (nestedRows.length) return nestedRows;

    return this.queryLogs(`
      select datetime(timestamp) as timestamp, event_message
      from function_edge_logs
      ${slug ? `where event_message like '%${sqlEscape(slug)}%'` : ''}
      order by timestamp desc
      limit ${slug ? 100 : 1000}
    `);
  }

  private static async getStorageLogs(bucket?: string): Promise<LogRow[]> {
    const where = bucket
      ? `where r.path like '%/storage/v1/%/${sqlEscape(bucket)}%'`
      : '';
    const sql = `
      select datetime(t.timestamp) as timestamp, t.event_message, r.path as path, response.status_code as status_code
      from storage_logs as t
      cross join unnest(t.metadata) as metadata
      cross join unnest(metadata.request) as r
      cross join unnest(metadata.response) as response
      ${where}
      order by t.timestamp desc
      limit ${bucket ? 100 : 1000}
    `;

    const nestedRows = await this.queryLogs(sql);
    if (nestedRows.length) return nestedRows;

    return this.queryLogs(`
      select datetime(timestamp) as timestamp, event_message
      from storage_logs
      ${bucket ? `where event_message like '%${sqlEscape(bucket)}%'` : ''}
      order by timestamp desc
      limit ${bucket ? 100 : 1000}
    `);
  }

  private static async getBucketReachability(bucketName: string): Promise<{
    reachable: boolean;
    sampleCount: number;
    error: string | null;
  }> {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });

    if (error) {
      return { reachable: false, sampleCount: 0, error: error.message };
    }

    return { reachable: true, sampleCount: data?.length ?? 0, error: null };
  }

  static async getOverview(): Promise<Record<string, unknown>> {
    const projectRef = this.projectRef();
    const [
      functions,
      buckets,
      storageConfig,
      serviceHealth,
      functionLogs,
      storageLogs,
      serverWakeup,
    ] = await Promise.all([
      this.listFunctions().catch(() => []),
      this.listBuckets().catch(() => []),
      this.getStorageConfig(),
      this.getServiceHealth(),
      this.getFunctionLogs(),
      this.getStorageLogs(),
      this.getServerWakeupStatus(),
    ]);

    const functionLogsBySlug = new Map<string, LogRow[]>();
    functionLogs.forEach((row) => {
      const slug = parseFunctionSlug(row);
      if (!slug) return;
      functionLogsBySlug.set(slug, [
        ...(functionLogsBySlug.get(slug) ?? []),
        row,
      ]);
    });

    const bucketLogsByName = new Map<string, LogRow[]>();
    storageLogs.forEach((row) => {
      const bucketName = parseBucketName(row);
      if (!bucketName) return;
      bucketLogsByName.set(bucketName, [
        ...(bucketLogsByName.get(bucketName) ?? []),
        row,
      ]);
    });

    const functionStatuses = functions
      .map((fn) => {
        const slug = String(fn.slug || fn.name || fn.id || '');
        const logs = summarizeFunctionLogs(functionLogsBySlug.get(slug) ?? []);
        const deployed = fn.status === 'ACTIVE';
        const status = functionStatusFromSummary(deployed, logs);

        return {
          id: fn.id ?? null,
          slug,
          name: fn.name || slug,
          deployed,
          status,
          platformStatus: fn.status ?? 'unknown',
          version: fn.version ?? null,
          verifyJwt: fn.verify_jwt ?? null,
          importMap: fn.import_map ?? null,
          entrypointPath: fn.entrypoint_path ?? null,
          importMapPath: fn.import_map_path ?? null,
          createdAt: normalizeTimestamp(fn.created_at),
          updatedAt: normalizeTimestamp(fn.updated_at),
          ...logs,
          logs: undefined,
        };
      })
      .filter((item) => item.slug);

    const bucketStatuses = await Promise.all(
      buckets
        .map((bucket) => ({
          ...bucket,
          name: String(bucket.name || bucket.id || ''),
        }))
        .filter((bucket) => bucket.name)
        .map(async (bucket) => {
          const [reachability, logs] = await Promise.all([
            this.getBucketReachability(bucket.name),
            Promise.resolve(
              summarizeBucketLogs(bucketLogsByName.get(bucket.name) ?? []),
            ),
          ]);
          const status = bucketStatusFromSummary(reachability.reachable, logs);

          return {
            id: bucket.id || bucket.name,
            name: bucket.name,
            public: bucket.public ?? false,
            owner: bucket.owner ?? null,
            createdAt: bucket.created_at ?? null,
            updatedAt: bucket.updated_at ?? null,
            fileSizeLimit: bucket.file_size_limit ?? null,
            allowedMimeTypes: bucket.allowed_mime_types ?? null,
            reachable: reachability.reachable,
            sampleCount: reachability.sampleCount,
            checkError: reachability.error,
            status,
            ...logs,
            logs: undefined,
          };
        }),
    );

    return {
      configured: Boolean(projectRef),
      managementConfigured: this.isManagementConfigured(),
      projectRef,
      lastCheckedAt: nowIso(),
      serviceHealth,
      storageConfig,
      functions: functionStatuses,
      storage: bucketStatuses,
      serverWakeup,
    };
  }

  static async getFunctionDetail(
    slug: string,
  ): Promise<Record<string, unknown>> {
    const [fn, logs] = await Promise.all([
      this.getFunction(slug),
      this.getFunctionLogs(slug),
    ]);
    const analytics = fn?.id
      ? await this.getFunctionAnalytics(String(fn.id)).catch((error) => ({
          error: String(error),
        }))
      : null;
    const summary = summarizeFunctionLogs(logs);

    return {
      projectRef: this.projectRef(),
      lastCheckedAt: nowIso(),
      function: fn
        ? {
            id: fn.id ?? null,
            slug: fn.slug ?? slug,
            name: fn.name ?? slug,
            deployed: fn.status === 'ACTIVE',
            platformStatus: fn.status ?? 'unknown',
            version: fn.version ?? null,
            verifyJwt: fn.verify_jwt ?? null,
            importMap: fn.import_map ?? null,
            entrypointPath: fn.entrypoint_path ?? null,
            importMapPath: fn.import_map_path ?? null,
            createdAt: normalizeTimestamp(fn.created_at),
            updatedAt: normalizeTimestamp(fn.updated_at),
          }
        : null,
      status: !fn
        ? 'error'
        : functionStatusFromSummary(fn.status === 'ACTIVE', summary),
      summary,
      analytics,
      logs,
    };
  }

  static async getStorageDetail(
    bucketName: string,
  ): Promise<Record<string, unknown>> {
    const [buckets, storageConfig, logs, reachability] = await Promise.all([
      this.listBuckets().catch(() => []),
      this.getStorageConfig(),
      this.getStorageLogs(bucketName),
      this.getBucketReachability(bucketName),
    ]);
    const bucket =
      buckets.find(
        (item) => item.name === bucketName || item.id === bucketName,
      ) ?? null;
    const summary = summarizeBucketLogs(logs);

    return {
      projectRef: this.projectRef(),
      lastCheckedAt: nowIso(),
      bucket,
      storageConfig,
      reachable: reachability.reachable,
      sampleCount: reachability.sampleCount,
      checkError: reachability.error,
      status: bucketStatusFromSummary(reachability.reachable, summary),
      summary,
      logs,
    };
  }

  private static async getFunctionAnalytics(
    functionId: string,
  ): Promise<Record<string, unknown> | null> {
    const projectRef = this.projectRef();
    if (!projectRef || !MANAGEMENT_TOKEN) return null;

    return this.managementGet<Record<string, unknown>>(
      `/v1/projects/${projectRef}/analytics/endpoints/functions.combined-stats`,
      {
        interval: '1day',
        function_id: functionId,
      },
    );
  }

  static async getServerWakeupStatus(): Promise<Record<string, unknown>> {
    const baseStatus = {
      jobName: SERVER_WAKEUP_JOB_NAME,
      cron: SERVER_WAKEUP_CRON,
      intervalMinutes: SERVER_WAKEUP_INTERVAL_MINUTES,
      backendUrl: serverWakeupBackendUrl(),
      endpoints: serverWakeupEndpoints(),
      functionSlug: SERVER_WAKEUP_FUNCTION,
      lastCheckedAt: nowIso(),
    };

    const logs = await this.getFunctionLogs(SERVER_WAKEUP_FUNCTION);
    const summary = summarizeFunctionLogs(logs);

    const { data, error } = await supabase.rpc('get_server_wakeup_status');
    if (error) {
      return {
        ...baseStatus,
        enabled: false,
        rpcAvailable: false,
        setupRequired: true,
        message: error.message,
        summary,
        logs,
      };
    }

    return {
      ...baseStatus,
      ...(typeof data === 'object' && data ? data : {}),
      rpcAvailable: true,
      setupRequired: false,
      summary,
      logs,
    };
  }

  static async setServerWakeupEnabled(
    enabled: boolean,
  ): Promise<Record<string, unknown>> {
    const { data, error } = await supabase.rpc('set_server_wakeup_enabled', {
      p_enabled: enabled,
    });
    if (error) throw new Error(error.message);
    return {
      ...(await this.getServerWakeupStatus()),
      ...(typeof data === 'object' && data ? data : {}),
    };
  }

  static async runServerWakeup(): Promise<Record<string, unknown>> {
    const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
    const supabaseKey =
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      '';
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_KEY are required to run server-wakeup',
      );
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/${SERVER_WAKEUP_FUNCTION}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'super_admin_dashboard',
          triggeredAt: nowIso(),
        }),
      },
    );

    const bodyText = await response.text();
    let body: unknown = bodyText;
    try {
      body = JSON.parse(bodyText);
    } catch {
      // Keep the raw response body.
    }

    if (!response.ok) {
      throw new Error(
        `server-wakeup failed with ${response.status}: ${bodyText || response.statusText}`,
      );
    }

    return {
      ok: response.ok,
      status: response.status,
      body,
      triggeredAt: nowIso(),
    };
  }
}
