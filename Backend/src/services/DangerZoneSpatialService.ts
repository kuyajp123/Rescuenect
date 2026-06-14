import {
  DangerZoneBoundingBox,
  DangerZoneCoordinates,
  DangerZoneCreateInput,
  DangerZoneRecord,
} from '@/types/dangerZone';

const EARTH_RADIUS_METERS = 6_371_008.8;

const isFiniteCoordinate = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

const clampLat = (value: number): number => Math.max(-90, Math.min(90, value));
const clampLng = (value: number): number => Math.max(-180, Math.min(180, value));

const bboxFromPositions = (positions: [number, number][]): DangerZoneBoundingBox | null => {
  const valid = positions.filter(([lng, lat]) => isFiniteCoordinate(lat, lng));
  if (valid.length === 0) return null;

  const lngs = valid.map(([lng]) => lng);
  const lats = valid.map(([, lat]) => lat);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
};

const centroidFromPositions = (positions: [number, number][]): DangerZoneCoordinates | null => {
  const valid = positions.filter(([lng, lat]) => isFiniteCoordinate(lat, lng));
  if (valid.length === 0) return null;
  const total = valid.reduce(
    (acc, [lng, lat]) => ({
      lat: acc.lat + lat,
      lng: acc.lng + lng,
    }),
    { lat: 0, lng: 0 }
  );
  return { lat: total.lat / valid.length, lng: total.lng / valid.length };
};

const circleBbox = (center: DangerZoneCoordinates, radiusMeters: number): DangerZoneBoundingBox => {
  const latRadius = (radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const lngRadius = latRadius / Math.max(Math.cos((center.lat * Math.PI) / 180), 0.01);
  return [
    clampLng(center.lng - lngRadius),
    clampLat(center.lat - latRadius),
    clampLng(center.lng + lngRadius),
    clampLat(center.lat + latRadius),
  ];
};

const parseBboxParts = (value: string): DangerZoneBoundingBox | null => {
  const parts = value.split(',').map(part => Number(part.trim()));
  if (parts.length !== 4 || parts.some(part => !Number.isFinite(part))) return null;
  const [minLng, minLat, maxLng, maxLat] = parts;
  if (!isFiniteCoordinate(minLat, minLng) || !isFiniteCoordinate(maxLat, maxLng)) return null;
  if (minLng > maxLng || minLat > maxLat) return null;
  return [minLng, minLat, maxLng, maxLat];
};

export class DangerZoneSpatialService {
  static buildSpatialMetadata(input: Pick<DangerZoneCreateInput, 'geometryType' | 'center' | 'radiusMeters' | 'geojson'>): {
    bbox: DangerZoneBoundingBox | null;
    centroid: DangerZoneCoordinates | null;
  } {
    if ((input.geometryType === 'point' || input.geometryType === 'circle') && input.center) {
      const center = input.center;
      if (!isFiniteCoordinate(center.lat, center.lng)) return { bbox: null, centroid: null };
      const radiusMeters = input.geometryType === 'circle' ? Math.max(Number(input.radiusMeters) || 0, 1) : 0;
      const bbox = input.geometryType === 'circle'
        ? circleBbox(center, radiusMeters)
        : [center.lng, center.lat, center.lng, center.lat] as DangerZoneBoundingBox;
      return { bbox, centroid: center };
    }

    if (input.geojson?.type === 'LineString') {
      return {
        bbox: bboxFromPositions(input.geojson.coordinates),
        centroid: centroidFromPositions(input.geojson.coordinates),
      };
    }

    if (input.geojson?.type === 'Polygon') {
      const outerRing = input.geojson.coordinates[0] ?? [];
      return {
        bbox: bboxFromPositions(outerRing),
        centroid: centroidFromPositions(outerRing),
      };
    }

    return { bbox: null, centroid: null };
  }

  static parseBbox(value: unknown): DangerZoneBoundingBox | null {
    return typeof value === 'string' && value.trim() ? parseBboxParts(value) : null;
  }

  static intersectsBbox(zone: Pick<DangerZoneRecord, 'bbox'>, requestedBbox: DangerZoneBoundingBox | null): boolean {
    if (!requestedBbox) return true;
    const zoneBbox = zone.bbox;
    if (!zoneBbox || zoneBbox.length !== 4) return true;
    const [minLng, minLat, maxLng, maxLat] = zoneBbox;
    const [requestMinLng, requestMinLat, requestMaxLng, requestMaxLat] = requestedBbox;
    return minLng <= requestMaxLng && maxLng >= requestMinLng && minLat <= requestMaxLat && maxLat >= requestMinLat;
  }
}
