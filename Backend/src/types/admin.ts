export type AdminRole = 'super_admin' | 'lgu_admin';
export type AdminStatus = 'active' | 'inactive' | 'pending';
export type ClientLguStatus = 'draft' | 'active' | 'inactive' | 'deletion_scheduled' | 'deleting' | 'deleted';
export type ClientLguType = 'municipality' | 'city';
export type LguRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ClientChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ClientChangeRequestType =
  | 'weather_coordinates'
  | 'map_settings'
  | 'barangay_coverage'
  | 'client_info'
  | 'admin_invite'
  | 'boundary_update';
export type EmailDeliveryStatus = 'disabled' | 'sent' | 'failed';
export type OperationLogStatus = 'success' | 'failed';
export type OperationLogActorRole = AdminRole | 'system';

export interface ClientMapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface ClientMapSettings {
  centerLatitude: number | null;
  centerLongitude: number | null;
  minZoom: number;
  zoom: number;
  maxZoom: number;
  maxBounds: ClientMapBounds | null;
  boundarySource?: string | null;
  boundaryVerified: boolean;
  boundaryUpdatedAt?: unknown;
}

export interface ClientBoundary {
  clientId: string;
  source: string | null;
  geoJson?: Record<string, unknown> | null;
  geoJsonText?: string | null;
  bounds: ClientMapBounds;
  uploadedBy: string;
  uploadedAt?: unknown;
}

export interface ClientEarthquakeSettings {
  radiusKm: number;
  minMagnitude: number;
}

export interface ClientEarthquakeImpact {
  clientId: string;
  distanceKm: number;
  isRelevant: boolean;
}

export interface AdminUser {
  uid: string;
  invitationId?: string | null;
  isPendingInvitation?: boolean;
  email: string;
  role: AdminRole;
  clientId: string | null;
  clientName?: string | null;
  municipalityName?: string | null;
  weatherLocationKey?: string | null;
  weatherLatitude?: number | null;
  weatherLongitude?: number | null;
  mapSettings?: ClientMapSettings;
  clientBarangays?: ClientCoverageBarangay[];
  clientStatus?: ClientLguStatus | null;
  clientDeletionEffectiveAt?: unknown;
  clientLogoUrl?: string | null;
  clientLogoPath?: string | null;
  status: AdminStatus;
  permissionsVersion: number;
  permissions: string[];
  onboardingComplete: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  barangay?: string;
  address?: string;
  fcmToken?: string | null;
}

export interface ClientCoverageBarangay {
  barangayCode: string | null;
  barangayLabel: string;
  value: string;
  isActive: boolean;
  latitude?: number | null;
  longitude?: number | null;
  verified?: boolean;
}

export interface ClientLgu {
  id: string;
  name: string;
  type: ClientLguType;
  status: ClientLguStatus;
  adminCount?: number;
  logoUrl?: string | null;
  logoPath?: string | null;
  logoWidth?: number | null;
  logoHeight?: number | null;
  logoUpdatedAt?: unknown;
  regionCode?: string | null;
  regionName?: string | null;
  provinceCode: string;
  provinceName: string;
  municipalityCode: string;
  municipalityName: string;
  municipalityType: ClientLguType;
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
}

export interface DynamicClientCutoverCollectionAudit {
  scanned: number;
  missingClientId: number;
  invalidClientId: number;
  eligibleForNaicMigration: number;
  updated: number;
  errors: string[];
}

export interface DynamicClientCutoverAudit {
  dryRun: boolean;
  collections: Record<string, DynamicClientCutoverCollectionAudit>;
  totalScanned: number;
  totalMissingClientId: number;
  totalInvalidClientId: number;
  totalEligibleForNaicMigration: number;
  totalUpdated: number;
  canCutover: boolean;
}

export interface ClientDeletionPreview {
  canDelete: boolean;
  canScheduleDeletion: boolean;
  warnings: string[];
  dependencies: Record<string, number>;
}

export interface ClientDeletionJob {
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
}

export interface ArchivedClientDocument {
  id: string;
  originalId: string;
  originalPath: string;
  data: Record<string, unknown>;
}

export interface ClientArchiveSummary {
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
}

export interface ClientArchive extends ClientArchiveSummary {
  client: Record<string, unknown>;
  request: Record<string, unknown> | null;
  deletion: Record<string, unknown>;
  job: Record<string, unknown>;
  collections: Record<string, ArchivedClientDocument[]>;
}

export interface LguRequest {
  id: string;
  status: LguRequestStatus;
  lguName: string;
  officeDepartment: string;
  requesterName: string;
  requesterPosition: string;
  requesterEmail: string;
  requesterPhone: string;
  regionCode: string;
  regionName: string;
  provinceCode: string;
  provinceName: string;
  municipalityCode: string;
  municipalityName: string;
  municipalityType: ClientLguType;
  proposedWeatherLatitude?: number | null;
  proposedWeatherLongitude?: number | null;
  selectedBarangays: ClientCoverageBarangay[];
  barangaysVerified: boolean;
  notes?: string;
  reviewedBy?: string | null;
  reviewedAt?: unknown;
  reviewNote?: string | null;
  clientId?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SystemStatus {
  status: 'healthy' | 'degraded';
  timestamp: string;
  backend: {
    status: 'ok';
    uptime: number;
    memory: NodeJS.MemoryUsage;
  };
  firebase: {
    connected: boolean;
  };
  psgc: {
    configured: boolean;
    cacheEntries: number;
    status: 'ok' | 'fallback_rootscratch';
  };
  weather: {
    configured: boolean;
    status: 'configured' | 'missing_key';
  };
  earthquake: {
    status: 'configured' | 'unknown';
  };
}

export interface ClientChangeRequest {
  id: string;
  clientId: string;
  clientName?: string | null;
  type: ClientChangeRequestType;
  status: ClientChangeRequestStatus;
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
}

export interface EmailDeliveryLog {
  id?: string;
  to: string;
  subject: string;
  template: string;
  status: EmailDeliveryStatus;
  provider?: 'smtp' | 'resend';
  error?: string | null;
  createdAt?: unknown;
}

export interface OperationLog {
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
  actorRole: OperationLogActorRole;
  status: OperationLogStatus;
  message: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  timestamp: number;
  createdAt?: unknown;
}

export interface SuperAdminOverview {
  status: 'healthy' | 'degraded';
  timestamp: string;
  summary: {
    clients: Record<ClientLguStatus, number>;
    lguRequests: Record<LguRequestStatus, number>;
    changeRequests: Record<ClientChangeRequestStatus, number>;
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
}
