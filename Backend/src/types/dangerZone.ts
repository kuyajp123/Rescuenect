export type DangerZoneSource = 'resident_report' | 'lgu_official';
export type DangerZoneStatus = 'pending' | 'verified' | 'rejected' | 'resolved' | 'expired';
export type DangerZoneSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DangerZoneGeometryType = 'point' | 'circle' | 'line' | 'polygon';
export type DangerZoneAuditAction = 'created' | 'verified' | 'rejected' | 'updated' | 'resolved' | 'expired';
export type DangerZoneAuditActorRole = 'resident' | 'lgu_admin' | 'super_admin' | 'system';
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
  actorRole: DangerZoneAuditActorRole;
  at: FirebaseFirestore.Timestamp;
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
  verifiedAt?: FirebaseFirestore.Timestamp | null;
  rejectedBy?: string | null;
  rejectedAt?: FirebaseFirestore.Timestamp | null;
  rejectionReason?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: FirebaseFirestore.Timestamp | null;
  expiresAt?: FirebaseFirestore.Timestamp | null;
  expiredBy?: string | null;
  expiredAt?: FirebaseFirestore.Timestamp | null;
  expiryNotifiedAt?: FirebaseFirestore.Timestamp | null;
  lastEditedBy?: string | null;
  lastEditedAt?: FirebaseFirestore.Timestamp | null;
  notificationAudit?: Record<string, FirebaseFirestore.Timestamp | null>;
  auditTrail?: DangerZoneAuditEntry[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface DangerZoneCreateInput {
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
}

export type DangerZoneAdminListFilters = {
  clientId?: string;
  status?: string;
  severity?: string;
  geometryType?: string;
  source?: string;
  search?: string;
  pageSize?: string | number;
  cursor?: string;
};

export type DangerZonePublicFilters = {
  bbox?: string;
  limit?: string | number;
};

export type PaginatedDangerZoneResult = {
  items: DangerZoneRecord[];
  pagination: {
    pageSize: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
};
