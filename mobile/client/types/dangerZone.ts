export type DangerZoneSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DangerZoneGeometryType = 'point' | 'circle';

export interface DangerZoneCoordinates {
  lat: number;
  lng: number;
}

export interface DangerZoneReportForm {
  type: string;
  severity: DangerZoneSeverity;
  description: string;
  geometryType: DangerZoneGeometryType;
  center: DangerZoneCoordinates;
  radiusMeters?: number;
  imageUri?: string | null;
}

export interface DangerZoneRecord {
  id: string;
  clientId: string;
  source: 'resident_report' | 'lgu_official';
  status: 'pending' | 'verified' | 'rejected' | 'resolved' | 'expired';
  isActive: boolean;
  type: string;
  severity: DangerZoneSeverity;
  description: string;
  geometryType: DangerZoneGeometryType;
  center: DangerZoneCoordinates;
  radiusMeters?: number;
  photoUrls: string[];
  createdAt?: unknown;
}
