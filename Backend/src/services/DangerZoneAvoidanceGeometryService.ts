import { DangerZoneRecord } from '@/types/dangerZone';
import { RouteCoordinates } from '@/types/evacuationRoute';
import { buffer } from '@turf/buffer';
import { lineString, point } from '@turf/helpers';

export type AvoidPolygonGeoJson =
  | {
      type: 'Polygon';
      coordinates: [number, number][][];
    }
  | {
      type: 'MultiPolygon';
      coordinates: [number, number][][][];
    };

const POINT_BUFFER_METERS = 50;
const DEFAULT_LINE_WIDTH_METERS = 30;
const MAPBOX_EXCLUDE_POINT_LIMIT = 50;
const EARTH_RADIUS_METERS = 6_371_008.8;
const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isValidLatLng = (lat: unknown, lng: unknown): lat is number =>
  isFiniteNumber(lat) && isFiniteNumber(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

const isValidPosition = (position: unknown): position is [number, number] =>
  Array.isArray(position) && position.length >= 2 && isValidLatLng(position[1], position[0]);

const samePosition = (left: [number, number], right: [number, number]): boolean =>
  Math.abs(left[0] - right[0]) <= 1e-9 && Math.abs(left[1] - right[1]) <= 1e-9;

const isValidRing = (ring: unknown): ring is [number, number][] =>
  Array.isArray(ring) &&
  ring.length >= 4 &&
  ring.every(isValidPosition) &&
  samePosition(ring[0], ring[ring.length - 1]);

const toPolygonCoordinates = (geometry: unknown): [number, number][][][] => {
  if (!geometry || typeof geometry !== 'object') return [];
  const candidate = geometry as { type?: unknown; coordinates?: unknown };

  if (candidate.type === 'Polygon' && Array.isArray(candidate.coordinates) && isValidRing(candidate.coordinates[0])) {
    return [candidate.coordinates as [number, number][][]];
  }

  if (candidate.type === 'MultiPolygon' && Array.isArray(candidate.coordinates)) {
    return candidate.coordinates
      .filter(polygonCoordinates => Array.isArray(polygonCoordinates) && isValidRing(polygonCoordinates[0]))
      .map(polygonCoordinates => polygonCoordinates as [number, number][][]);
  }

  return [];
};

const bufferGeometry = (
  geometry: ReturnType<typeof point> | ReturnType<typeof lineString>,
  radiusMeters: number
): [number, number][][][] => {
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) return [];
  const buffered = buffer(geometry, radiusMeters, { units: 'meters', steps: 32 });
  return toPolygonCoordinates(buffered?.geometry);
};

const timestampMillis = (value: unknown): number => {
  if (!value) return 0;
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof (value as { _seconds?: number })._seconds === 'number') {
    return (value as { _seconds: number })._seconds * 1000;
  }
  if (typeof (value as { seconds?: number }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000;
  }
  if (value instanceof Date) return value.getTime();
  return 0;
};

const sortZonesByFallbackPriority = (zones: DangerZoneRecord[]): DangerZoneRecord[] =>
  [...zones].sort((left, right) => {
    const severityDelta = (SEVERITY_RANK[right.severity] ?? 0) - (SEVERITY_RANK[left.severity] ?? 0);
    if (severityDelta !== 0) return severityDelta;
    return timestampMillis(right.createdAt) - timestampMillis(left.createdAt);
  });

const toCoordinate = (position: [number, number]): RouteCoordinates => ({ lng: position[0], lat: position[1] });

const midpoint = (left: [number, number], right: [number, number]): RouteCoordinates => ({
  lng: (left[0] + right[0]) / 2,
  lat: (left[1] + right[1]) / 2,
});

const centroid = (ring: [number, number][]): RouteCoordinates | null => {
  const uniqueRing = ring.length > 1 && samePosition(ring[0], ring[ring.length - 1]) ? ring.slice(0, -1) : ring;
  if (uniqueRing.length === 0) return null;
  const sum = uniqueRing.reduce(
    (acc, position) => ({
      lng: acc.lng + position[0],
      lat: acc.lat + position[1],
    }),
    { lng: 0, lat: 0 }
  );
  return { lng: sum.lng / uniqueRing.length, lat: sum.lat / uniqueRing.length };
};

const destinationPoint = (center: RouteCoordinates, distanceMeters: number, bearingDegrees: number): RouteCoordinates => {
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const bearing = (bearingDegrees * Math.PI) / 180;
  const lat1 = (center.lat * Math.PI) / 180;
  const lng1 = (center.lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (((lng2 * 180) / Math.PI + 540) % 360) - 180,
  };
};

const getLinePositions = (zone: DangerZoneRecord): [number, number][] =>
  zone.geojson?.type === 'LineString' && Array.isArray(zone.geojson.coordinates)
    ? zone.geojson.coordinates.filter(isValidPosition)
    : [];

const getPolygonRing = (zone: DangerZoneRecord): [number, number][] =>
  zone.geojson?.type === 'Polygon' && isValidRing(zone.geojson.coordinates?.[0]) ? zone.geojson.coordinates[0] : [];

const getZoneMapboxPoints = (zone: DangerZoneRecord): RouteCoordinates[] => {
  if ((zone.geometryType === 'point' || zone.geometryType === 'circle') && zone.center) {
    if (!isValidLatLng(zone.center.lat, zone.center.lng)) return [];
    const center = { lat: zone.center.lat, lng: zone.center.lng };

    if (zone.geometryType === 'point') return [center];

    const radiusMeters = Number(zone.radiusMeters);
    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) return [center];
    return [
      center,
      destinationPoint(center, radiusMeters, 0),
      destinationPoint(center, radiusMeters, 90),
      destinationPoint(center, radiusMeters, 180),
      destinationPoint(center, radiusMeters, 270),
    ];
  }

  if (zone.geometryType === 'line') {
    const positions = getLinePositions(zone);
    const points = positions.map(toCoordinate);
    for (let index = 0; index < positions.length - 1; index++) {
      points.push(midpoint(positions[index], positions[index + 1]));
    }
    return points;
  }

  if (zone.geometryType === 'polygon') {
    const ring = getPolygonRing(zone);
    const points: RouteCoordinates[] = [];
    const polygonCentroid = centroid(ring);
    if (polygonCentroid) points.push(polygonCentroid);

    for (let index = 0; index < ring.length - 1; index++) {
      points.push(toCoordinate(ring[index]));
      points.push(midpoint(ring[index], ring[index + 1]));
    }
    return points;
  }

  return [];
};

const coordinateKey = (coordinate: RouteCoordinates): string =>
  `${coordinate.lng.toFixed(5)},${coordinate.lat.toFixed(5)}`;

const normalizeRouteCoordinate = (coordinate: RouteCoordinates): RouteCoordinates | null =>
  isValidLatLng(coordinate.lat, coordinate.lng)
    ? { lng: Number(coordinate.lng.toFixed(6)), lat: Number(coordinate.lat.toFixed(6)) }
    : null;

export class DangerZoneAvoidanceGeometryService {
  static readonly MAPBOX_EXCLUDE_POINT_LIMIT = MAPBOX_EXCLUDE_POINT_LIMIT;

  static buildOpenRouteServiceAvoidPolygons(zones: DangerZoneRecord[]): AvoidPolygonGeoJson | null {
    const polygons: [number, number][][][] = [];

    for (const zone of zones) {
      if (zone.geometryType === 'point' && zone.center && isValidLatLng(zone.center.lat, zone.center.lng)) {
        polygons.push(...bufferGeometry(point([zone.center.lng, zone.center.lat]), POINT_BUFFER_METERS));
        continue;
      }

      if (zone.geometryType === 'circle' && zone.center && isValidLatLng(zone.center.lat, zone.center.lng)) {
        polygons.push(...bufferGeometry(point([zone.center.lng, zone.center.lat]), Number(zone.radiusMeters)));
        continue;
      }

      if (zone.geometryType === 'line') {
        const positions = getLinePositions(zone);
        if (positions.length >= 2) {
          polygons.push(
            ...bufferGeometry(lineString(positions), Number(zone.affectedWidthMeters ?? DEFAULT_LINE_WIDTH_METERS) / 2)
          );
        }
        continue;
      }

      if (zone.geometryType === 'polygon') {
        const ring = getPolygonRing(zone);
        if (ring.length >= 4) polygons.push([ring]);
      }
    }

    if (polygons.length === 0) return null;
    if (polygons.length === 1) return { type: 'Polygon', coordinates: polygons[0] };
    return { type: 'MultiPolygon', coordinates: polygons };
  }

  static buildMapboxExcludePoints(zones: DangerZoneRecord[]): RouteCoordinates[] {
    const points: RouteCoordinates[] = [];
    const seen = new Set<string>();

    for (const zone of sortZonesByFallbackPriority(zones)) {
      for (const rawPoint of getZoneMapboxPoints(zone)) {
        const normalizedPoint = normalizeRouteCoordinate(rawPoint);
        if (!normalizedPoint) continue;

        const key = coordinateKey(normalizedPoint);
        if (seen.has(key)) continue;

        seen.add(key);
        points.push(normalizedPoint);
        if (points.length >= MAPBOX_EXCLUDE_POINT_LIMIT) return points;
      }
    }

    return points;
  }
}
