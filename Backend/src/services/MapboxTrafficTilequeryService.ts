import { RouteCoordinates, RouteLineString } from '@/types/evacuationRoute';
import axios from 'axios';
import { RouteRoadConditionService } from './RouteRoadConditionService';

type TilequeryResponse = {
  features?: Array<{
    properties?: {
      congestion?: unknown;
      closed?: unknown;
    };
  }>;
};

const MAPBOX_TRAFFIC_TILESET_ID = 'mapbox.mapbox-traffic-v1';
const TILEQUERY_BASE_URL = `https://api.mapbox.com/v4/${MAPBOX_TRAFFIC_TILESET_ID}/tilequery`;
const SAMPLE_LIMIT = 30;
const QUERY_RADIUS_METERS = 20;
const CACHE_TTL_MS = 5 * 60 * 1000;

const getMapboxToken = (): string => process.env.MAPBOX_DIRECTIONS_TOKEN?.trim() || '';

const isValidCoordinate = (coordinate: RouteCoordinates): boolean =>
  Number.isFinite(coordinate.lat) &&
  Number.isFinite(coordinate.lng) &&
  coordinate.lat >= -90 &&
  coordinate.lat <= 90 &&
  coordinate.lng >= -180 &&
  coordinate.lng <= 180;

const coordinateKey = (coordinate: RouteCoordinates): string =>
  `${coordinate.lng.toFixed(5)},${coordinate.lat.toFixed(5)}`;

const cache = new Map<string, { expiresAt: number; value: RouteCoordinates & { congestion?: unknown; closed?: unknown } }>();

export class MapboxTrafficTilequeryService {
  static buildSampleCoordinates(geometry: RouteLineString, limit = SAMPLE_LIMIT): RouteCoordinates[] {
    const coordinates = geometry.coordinates
      .map(([lng, lat]) => ({ lng, lat }))
      .filter(isValidCoordinate);
    if (coordinates.length <= limit) return coordinates;

    const samples: RouteCoordinates[] = [];
    const lastIndex = coordinates.length - 1;
    for (let sampleIndex = 0; sampleIndex < limit; sampleIndex++) {
      const coordinateIndex = Math.round((sampleIndex / (limit - 1)) * lastIndex);
      samples.push(coordinates[coordinateIndex]);
    }
    return samples;
  }

  private static async queryTrafficPoint(
    coordinate: RouteCoordinates
  ): Promise<RouteCoordinates & { congestion?: unknown; closed?: unknown }> {
    const token = getMapboxToken();
    if (!token) {
      throw new Error('MAPBOX_DIRECTIONS_TOKEN is not configured');
    }

    const key = coordinateKey(coordinate);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const response = await axios.get<TilequeryResponse>(
      `${TILEQUERY_BASE_URL}/${coordinate.lng},${coordinate.lat}.json`,
      {
        params: {
          access_token: token,
          layers: 'traffic',
          geometry: 'linestring',
          radius: QUERY_RADIUS_METERS,
          limit: 1,
        },
        timeout: 8000,
      }
    );

    const feature = response.data.features?.[0];
    const value = {
      ...coordinate,
      congestion: feature?.properties?.congestion ?? 'unknown',
      closed: feature?.properties?.closed ?? null,
    };
    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
    return value;
  }

  static async enrichRoute(geometry: RouteLineString): Promise<ReturnType<typeof RouteRoadConditionService.buildFromSampledTraffic>> {
    const samples = this.buildSampleCoordinates(geometry);
    if (samples.length < 2) {
      return RouteRoadConditionService.buildFromSampledTraffic([]);
    }

    const settled = await Promise.allSettled(samples.map(sample => this.queryTrafficPoint(sample)));
    const successfulSamples = settled
      .filter((result): result is PromiseFulfilledResult<RouteCoordinates & { congestion?: unknown; closed?: unknown }> =>
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    if (successfulSamples.length < 2) {
      return RouteRoadConditionService.buildFromSampledTraffic([]);
    }

    return RouteRoadConditionService.buildFromSampledTraffic(successfulSamples);
  }
}
