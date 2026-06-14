export type DangerZoneSource = 'resident_report' | 'lgu_official';
export type DangerZoneStatus = 'pending' | 'verified' | 'rejected' | 'resolved' | 'expired';
export type DangerZoneSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DangerZoneGeometryType = 'point' | 'circle' | 'line' | 'polygon';
export type DangerZoneAuditAction = 'created' | 'verified' | 'rejected' | 'updated' | 'resolved' | 'expired';
export type DangerZoneConfidence = 'low' | 'medium' | 'high';
export type DangerZoneBoundingBox = [number, number, number, number];

export interface DangerZoneCoordinates {
  lat: number;
  lng: number;
}

export type DangerZoneLineString = {
  type: 'LineString';
  coordinates: [number, number][];
};

export type DangerZonePolygon = {
  type: 'Polygon';
  coordinates: [number, number][][];
};

export type DangerZoneGeoJson = DangerZoneLineString | DangerZonePolygon;

export interface DangerZoneAuditEntry {
  action: DangerZoneAuditAction;
  actorId: string;
  actorRole: 'resident' | 'lgu_admin' | 'super_admin' | 'system';
  at: unknown;
  note?: string | null;
  changes?: Record<string, unknown>;
}

export interface DangerZoneRecord {
  id: string;
  clientId: string;
  source: DangerZoneSource;
  status: DangerZoneStatus;
  isActive: boolean;
  type: string;
  severity: DangerZoneSeverity;
  description: string;
  geometryType: DangerZoneGeometryType;
  center?: DangerZoneCoordinates | null;
  radiusMeters?: number | null;
  geojson?: DangerZoneGeoJson | null;
  affectedWidthMeters?: number | null;
  avoidGeojson?: null;
  bbox?: DangerZoneBoundingBox | null;
  centroid?: DangerZoneCoordinates | null;
  confidence?: DangerZoneConfidence;
  verificationNotes?: string | null;
  affectedBarangays?: string[];
  photoUrls: string[];
  reportedBy: string;
  reportedByRole: 'resident' | 'lgu_admin' | 'super_admin';
  reporterName?: string | null;
  reporterEmail?: string | null;
  barangay?: string | null;
  barangayCode?: string | null;
  barangayLabel?: string | null;
  municipalityName?: string | null;
  provinceName?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: unknown;
  rejectedBy?: string | null;
  rejectedAt?: unknown;
  rejectionReason?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: unknown;
  expiresAt?: unknown;
  expiredBy?: string | null;
  expiredAt?: unknown;
  expiryNotifiedAt?: unknown;
  lastEditedBy?: string | null;
  lastEditedAt?: unknown;
  notificationAudit?: Record<string, unknown>;
  auditTrail?: DangerZoneAuditEntry[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DangerZoneCreateOfficialPayload {
  type: string;
  severity: DangerZoneSeverity;
  description: string;
  geometryType: DangerZoneGeometryType;
  center?: DangerZoneCoordinates | null;
  radiusMeters?: number | null;
  geojson?: DangerZoneGeoJson | null;
  affectedWidthMeters?: number | null;
  avoidGeojson?: null;
  clientId?: string;
  expiresAt?: string | null;
  confidence?: DangerZoneConfidence;
  verificationNotes?: string | null;
  affectedBarangays?: string[];
}

export interface DangerZonePagination {
  pageSize: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export type DangerZoneListFilters = {
  status?: DangerZoneStatus | 'all';
  severity?: DangerZoneSeverity | 'all';
  geometryType?: DangerZoneGeometryType | 'all';
  source?: DangerZoneSource | 'all';
  search?: string;
  pageSize?: number;
  cursor?: string | null;
};

export interface DangerZoneAnalytics {
  total: number;
  pending: number;
  verifiedActive: number;
  rejected: number;
  resolved: number;
  expired: number;
  highOrCritical: number;
  expiringSoon: number;
  averageVerificationHours: number | null;
  byGeometryType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface RoutingOperations {
  routeCount: number;
  failureCount: number;
  fallbackCount: number;
  averageLatencyMs: number;
  providerCounts: Record<string, number>;
  avoidanceCounts: Record<string, number>;
  worstRoadConditionCounts: Record<string, number>;
  recentProviderWarnings: Array<{
    provider: string;
    profile?: string | null;
    errorMessage?: string | null;
    latencyMs: number;
    createdAt?: unknown;
  }>;
}
