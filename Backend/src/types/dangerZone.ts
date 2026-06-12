export type DangerZoneSource = 'resident_report' | 'lgu_official';
export type DangerZoneStatus = 'pending' | 'verified' | 'rejected' | 'resolved' | 'expired';
export type DangerZoneSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DangerZoneGeometryType = 'point' | 'circle';

export interface DangerZoneCoordinates {
  lat: number;
  lng: number;
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
  center: DangerZoneCoordinates;
  radiusMeters?: number;
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
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface DangerZoneCreateInput {
  type: string;
  severity: DangerZoneSeverity;
  description: string;
  geometryType: DangerZoneGeometryType;
  center: DangerZoneCoordinates;
  radiusMeters?: number;
}
