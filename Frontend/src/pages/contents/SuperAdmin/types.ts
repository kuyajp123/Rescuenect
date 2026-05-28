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
  status: 'draft' | 'active' | 'inactive';
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
};

export type AdminUser = {
  uid: string;
  email: string;
  role: 'super_admin' | 'lgu_admin';
  clientId: string | null;
  clientName?: string | null;
  status: 'active' | 'inactive';
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
    clients: Record<'draft' | 'active' | 'inactive', number>;
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
};

export type LguClientResponse = {
  client: ClientLgu;
  admins: AdminUser[];
};
