export type DangerZoneSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DangerZoneGeometryType = 'point' | 'circle' | 'line' | 'polygon';
export type DangerZoneReportGeometryType = 'point' | 'circle';

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

export interface DangerZoneReportForm {
  type: string;
  severity: DangerZoneSeverity;
  description: string;
  geometryType: DangerZoneReportGeometryType;
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
  center?: DangerZoneCoordinates | null;
  radiusMeters?: number | null;
  geojson?: DangerZoneGeoJson | null;
  affectedWidthMeters?: number | null;
  photoUrls: string[];
  createdAt?: unknown;
}
