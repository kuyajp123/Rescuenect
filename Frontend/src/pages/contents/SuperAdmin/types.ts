export type ClientCoverageBarangay = {
  barangayCode: string | null;
  barangayLabel: string;
  value: string;
  isActive: boolean;
  latitude?: number | null;
  longitude?: number | null;
  verified?: boolean;
};

export type ClientMapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type ClientMapSettings = {
  centerLatitude: number | null;
  centerLongitude: number | null;
  minZoom: number;
  zoom: number;
  maxZoom: number;
  maxBounds: ClientMapBounds | null;
  boundarySource?: string | null;
  boundaryVerified: boolean;
  boundaryUpdatedAt?: unknown;
};

export type ClientEarthquakeSettings = {
  radiusKm: number;
  minMagnitude: number;
};

export type ClientLguStatus = 'draft' | 'active' | 'inactive' | 'deletion_scheduled' | 'deleting' | 'deleted';
export type SupabaseHealthStatus = 'ok' | 'warning' | 'error' | 'unknown' | 'not_configured';

export type LguRequest = {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  lguName: string;
  officeDepartment: string;
  requesterName: string;
  requesterPosition: string;
  requesterEmail: string;
  requesterPhone: string;
  regionCode?: string;
  regionName: string;
  provinceCode?: string;
  provinceName: string;
  municipalityCode?: string;
  municipalityName: string;
  municipalityType: 'municipality' | 'city';
  proposedWeatherLatitude?: number | null;
  proposedWeatherLongitude?: number | null;
  selectedBarangays: ClientCoverageBarangay[];
  barangaysVerified?: boolean;
  notes?: string;
  reviewedBy?: string | null;
  reviewedAt?: unknown;
  reviewNote?: string | null;
  clientId?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ClientLgu = {
  id: string;
  name: string;
  type?: 'municipality' | 'city';
  status: ClientLguStatus;
  adminCount?: number;
  regionCode?: string | null;
  regionName?: string | null;
  provinceCode?: string;
  provinceName: string;
  municipalityCode?: string;
  municipalityName: string;
  municipalityType?: 'municipality' | 'city';
  weatherLocationKey: string;
  weatherLatitude: number | null;
  weatherLongitude: number | null;
  mapSettings: ClientMapSettings;
  earthquakeSettings: ClientEarthquakeSettings;
  barangays: ClientCoverageBarangay[];
  requestId?: string | null;
  deletionScheduledAt?: unknown;
  deletionEffectiveAt?: unknown;
  deletionRequestedBy?: string | null;
  deletionReason?: string | null;
  deletionCancelledAt?: unknown;
  deletionStatus?: string | null;
};

export type AdminUser = {
  uid: string;
  invitationId?: string | null;
  isPendingInvitation?: boolean;
  email: string;
  role: 'super_admin' | 'lgu_admin';
  clientId: string | null;
  clientName?: string | null;
  status: 'active' | 'inactive' | 'pending';
  clientStatus?: ClientLguStatus | null;
  clientDeletionEffectiveAt?: unknown;
};

export type ClientDeletionPreview = {
  canDelete: boolean;
  canScheduleDeletion: boolean;
  warnings: string[];
  dependencies: Record<string, number>;
};

export type ClientDeletionJob = {
  id: string;
  clientId: string;
  clientName: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  deletionEffectiveAt: unknown;
  deletionScheduledAt?: unknown;
  deletionRequestedBy?: string | null;
  deletionReason?: string | null;
  progress?: Record<string, number>;
  errors?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ArchivedClientDocument = {
  id: string;
  originalId: string;
  originalPath: string;
  data: Record<string, unknown>;
};

export type ClientArchiveSummary = {
  id: string;
  clientId: string;
  clientName: string;
  provinceName?: string | null;
  municipalityName?: string | null;
  status: 'archived';
  counts: Record<string, number>;
  deletionReason?: string | null;
  deletionRequestedBy?: string | null;
  deletionScheduledAt?: unknown;
  deletionEffectiveAt?: unknown;
  archivedAt?: unknown;
  permanentlyDeletedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ClientArchive = ClientArchiveSummary & {
  client: Partial<ClientLgu> & Record<string, unknown>;
  request: Record<string, unknown> | null;
  deletion: Record<string, unknown>;
  job: Record<string, unknown>;
  collections: Record<string, ArchivedClientDocument[]>;
};

export type SystemStatus = {
  status: 'healthy' | 'degraded';
  timestamp: string;
  backend: { uptime: number; memory: { heapUsed: number; heapTotal: number } };
  firebase: { connected: boolean };
  psgc: { configured: boolean; cacheEntries: number; status: string };
  weather: { configured: boolean; status: string };
  earthquake: { status: string };
};

export type SupabaseFunctionMonitor = {
  id: string | null;
  slug: string;
  name: string;
  deployed: boolean;
  status: SupabaseHealthStatus;
  platformStatus: string;
  version: number | null;
  verifyJwt: boolean | null;
  importMap?: boolean | null;
  entrypointPath?: string | null;
  importMapPath?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  recentInvocations: number;
  recentErrors: number;
  lastInvocationAt: string | null;
  lastStatusCode: number | null;
  lastErrorMessage: string | null;
};

export type SupabaseStorageMonitor = {
  id: string;
  name: string;
  public: boolean;
  owner?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  fileSizeLimit?: number | null;
  allowedMimeTypes?: string[] | null;
  reachable: boolean;
  sampleCount: number;
  checkError: string | null;
  status: SupabaseHealthStatus;
  recentRequests: number;
  recentErrors: number;
  lastRequestAt: string | null;
  lastStatusCode: number | null;
  lastErrorMessage: string | null;
};

export type SupabaseLogRow = {
  timestamp?: string;
  event_message?: string;
  path?: string;
  status_code?: number | string;
};

export type ServerWakeupStatus = {
  enabled: boolean;
  scheduled?: boolean;
  rpcAvailable?: boolean;
  setupRequired?: boolean;
  message?: string;
  jobId?: number | null;
  jobName: string;
  cron: string;
  intervalMinutes: number;
  backendUrl: string;
  endpoints: string[];
  functionSlug: string;
  lastCheckedAt: string;
  summary?: {
    recentInvocations: number;
    recentErrors: number;
    lastInvocationAt: string | null;
    lastStatusCode: number | null;
    lastErrorMessage: string | null;
  };
  logs?: SupabaseLogRow[];
};

export type SupabaseMonitoringOverview = {
  configured: boolean;
  managementConfigured: boolean;
  projectRef: string | null;
  lastCheckedAt: string;
  serviceHealth: Array<Record<string, unknown>>;
  storageConfig: Record<string, unknown> | null;
  functions: SupabaseFunctionMonitor[];
  storage: SupabaseStorageMonitor[];
  serverWakeup: ServerWakeupStatus;
  error?: string;
};

export type SupabaseFunctionDetail = {
  projectRef: string | null;
  lastCheckedAt: string;
  function: (Partial<SupabaseFunctionMonitor> & { slug?: string; name?: string }) | null;
  status: SupabaseHealthStatus;
  summary: Pick<
    SupabaseFunctionMonitor,
    'recentInvocations' | 'recentErrors' | 'lastInvocationAt' | 'lastStatusCode' | 'lastErrorMessage'
  >;
  analytics: Record<string, unknown> | null;
  logs: SupabaseLogRow[];
};

export type SupabaseStorageDetail = {
  projectRef: string | null;
  lastCheckedAt: string;
  bucket: Record<string, unknown> | null;
  storageConfig: Record<string, unknown> | null;
  reachable: boolean;
  sampleCount: number;
  checkError: string | null;
  status: SupabaseHealthStatus;
  summary: Pick<
    SupabaseStorageMonitor,
    'recentRequests' | 'recentErrors' | 'lastRequestAt' | 'lastStatusCode' | 'lastErrorMessage'
  >;
  logs: SupabaseLogRow[];
};

export type ClientDetailResponse = {
  client: ClientLgu;
  request: LguRequest | null;
  admins: AdminUser[];
};

export type ClientChangeRequest = {
  id: string;
  clientId: string;
  clientName?: string | null;
  type: 'weather_coordinates' | 'map_settings' | 'barangay_coverage' | 'client_info' | 'admin_invite' | 'boundary_update';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  currentSnapshot: Record<string, unknown>;
  proposedChanges: Record<string, unknown>;
  requestedBy: string;
  requestedByEmail?: string | null;
  requestedAt?: unknown;
  reviewedBy?: string | null;
  reviewedAt?: unknown;
  reviewNote?: string | null;
  appliedAt?: unknown;
  cancelledAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type OperationLog = {
  id: string;
  action: string;
  actionLabel: string;
  targetType: string;
  targetId?: string | null;
  targetName?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  actorUid: string;
  actorEmail?: string | null;
  actorRole: 'super_admin' | 'lgu_admin' | 'system';
  status: 'success' | 'failed';
  message: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  timestamp: number;
  createdAt?: unknown;
};

export type SuperAdminOverview = {
  status: 'healthy' | 'degraded';
  timestamp: string;
  summary: {
    clients: Record<ClientLguStatus, number>;
    lguRequests: Record<'pending' | 'approved' | 'rejected' | 'cancelled', number>;
    changeRequests: Record<'pending' | 'approved' | 'rejected' | 'cancelled', number>;
    lguAdmins: number;
    activeResidents: number;
  };
  charts: {
    clientStatus: Array<{ name: string; value: number }>;
    lguRequestStatus: Array<{ name: string; value: number }>;
    changeRequestStatus: Array<{ name: string; value: number }>;
    changeRequestTypes: Array<{ name: string; value: number }>;
  };
  system: SystemStatus;
  supabase?: SupabaseMonitoringOverview;
};

export type LguClientResponse = {
  client: ClientLgu;
  admins: AdminUser[];
};
