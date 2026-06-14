import { DangerZoneCreateInput, DangerZoneGeoJson } from '@/types/dangerZone';

export type FirestoreGeoJson =
  | {
      type: 'LineString';
      points: Array<{ lng: number; lat: number }>;
    }
  | {
      type: 'Polygon';
      points: Array<{ lng: number; lat: number }>;
    };

export type FirestoreDangerZoneInput = Omit<DangerZoneCreateInput, 'geojson'> & {
  geojson: FirestoreGeoJson | null;
};

export class DangerZoneFirestoreGeometryService {
  static toFirestoreGeoJson(geojson?: DangerZoneGeoJson | null): FirestoreGeoJson | null {
    if (!geojson) return null;

    if (geojson.type === 'LineString') {
      return {
        type: 'LineString',
        points: geojson.coordinates.map(([lng, lat]) => ({ lng, lat })),
      };
    }

    return {
      type: 'Polygon',
      points: geojson.coordinates[0].map(([lng, lat]) => ({ lng, lat })),
    };
  }

  static fromFirestoreGeoJson(value: unknown): DangerZoneGeoJson | null {
    if (!value || typeof value !== 'object') return null;
    const geojson = value as {
      type?: unknown;
      points?: Array<{ lng?: unknown; lat?: unknown }>;
      coordinates?: unknown;
    };

    if (geojson.type === 'LineString') {
      if (Array.isArray(geojson.points)) {
        return {
          type: 'LineString',
          coordinates: geojson.points.map(point => [Number(point.lng), Number(point.lat)] as [number, number]),
        };
      }

      if (Array.isArray(geojson.coordinates)) {
        return {
          type: 'LineString',
          coordinates: geojson.coordinates as [number, number][],
        };
      }
    }

    if (geojson.type === 'Polygon') {
      if (Array.isArray(geojson.points)) {
        return {
          type: 'Polygon',
          coordinates: [geojson.points.map(point => [Number(point.lng), Number(point.lat)] as [number, number])],
        };
      }

      if (Array.isArray(geojson.coordinates)) {
        return {
          type: 'Polygon',
          coordinates: geojson.coordinates as [number, number][][],
        };
      }
    }

    return null;
  }

  static toFirestoreInput(input: DangerZoneCreateInput): FirestoreDangerZoneInput {
    return {
      ...input,
      geojson: this.toFirestoreGeoJson(input.geojson),
    };
  }
}
