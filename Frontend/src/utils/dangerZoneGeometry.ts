import { DangerZoneGeoJson } from '@/types/dangerZone';

type StoredPoint = {
  lng?: unknown;
  lat?: unknown;
};

type DangerZoneGeoJsonLike = {
  type?: unknown;
  coordinates?: unknown;
  points?: StoredPoint[];
};

const isCoordinatePair = (value: unknown): value is [number, number] => {
  if (!Array.isArray(value) || value.length < 2) return false;
  return Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]));
};

const normalizeCoordinatePair = (value: [number, number]): [number, number] => [Number(value[0]), Number(value[1])];

const pointsToCoordinates = (points?: StoredPoint[]): [number, number][] => {
  if (!Array.isArray(points)) return [];
  return points
    .map(point => [Number(point.lng), Number(point.lat)] as [number, number])
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
};

export const normalizeDangerZoneGeoJson = (geojson?: DangerZoneGeoJson | null): DangerZoneGeoJson | null => {
  if (!geojson || typeof geojson !== 'object') return null;
  const raw = geojson as DangerZoneGeoJsonLike;

  if (raw.type === 'LineString') {
    if (Array.isArray(raw.coordinates)) {
      const coordinates = raw.coordinates.filter(isCoordinatePair).map(normalizeCoordinatePair);
      return coordinates.length > 0 ? { type: 'LineString', coordinates } : null;
    }

    const coordinates = pointsToCoordinates(raw.points);
    return coordinates.length > 0 ? { type: 'LineString', coordinates } : null;
  }

  if (raw.type === 'Polygon') {
    if (Array.isArray(raw.coordinates) && Array.isArray(raw.coordinates[0])) {
      const coordinates = raw.coordinates[0].filter(isCoordinatePair).map(normalizeCoordinatePair);
      return coordinates.length > 0 ? { type: 'Polygon', coordinates: [coordinates] } : null;
    }

    const coordinates = pointsToCoordinates(raw.points);
    return coordinates.length > 0 ? { type: 'Polygon', coordinates: [coordinates] } : null;
  }

  return null;
};

export const getDangerZoneCoordinateCount = (geojson?: DangerZoneGeoJson | null): number => {
  const normalized = normalizeDangerZoneGeoJson(geojson);
  if (normalized?.type === 'LineString') return normalized.coordinates.length;
  if (normalized?.type === 'Polygon') return normalized.coordinates[0]?.length ?? 0;
  return 0;
};
