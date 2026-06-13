import { AvoidPolygonGeoJson } from '@/services/DangerZoneAvoidanceGeometryService';
import {
  EvacuationTravelMode,
  ProviderRouteResult,
  RouteCoordinates,
  RouteLineString,
  RouteProfile,
} from '@/types/evacuationRoute';
import axios from 'axios';

type OpenRouteServiceFeature = {
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: {
    summary?: {
      distance?: number;
      duration?: number;
    };
  };
};

type OpenRouteServiceResponse = {
  error?: unknown;
  features?: OpenRouteServiceFeature[];
};

const DEFAULT_OPENROUTESERVICE_BASE_URL = 'https://api.openrouteservice.org';
const OPENROUTESERVICE_DRIVING_PROFILE = 'driving-car';
const OPENROUTESERVICE_WALKING_PROFILE = 'foot-walking';

const getOpenRouteServiceApiKey = (): string => process.env.OPENROUTESERVICE_API_KEY?.trim() || '';

const getOpenRouteServiceBaseUrl = (): string =>
  (process.env.OPENROUTESERVICE_BASE_URL?.trim() || DEFAULT_OPENROUTESERVICE_BASE_URL).replace(/\/+$/, '');

const isLineStringGeometry = (geometry?: OpenRouteServiceFeature['geometry']): geometry is RouteLineString =>
  geometry?.type === 'LineString' &&
  Array.isArray(geometry.coordinates) &&
  geometry.coordinates.every(
    coordinate =>
      Array.isArray(coordinate) &&
      coordinate.length >= 2 &&
      Number.isFinite(Number(coordinate[0])) &&
      Number.isFinite(Number(coordinate[1]))
  );

export class OpenRouteServiceError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'OpenRouteServiceError';
  }
}

export class OpenRouteService {
  static getProfileForTravelMode(travelMode: EvacuationTravelMode): RouteProfile {
    return travelMode === 'walking' ? OPENROUTESERVICE_WALKING_PROFILE : OPENROUTESERVICE_DRIVING_PROFILE;
  }

  static async getRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates,
    avoidPolygons: AvoidPolygonGeoJson,
    travelMode: EvacuationTravelMode
  ): Promise<ProviderRouteResult> {
    const apiKey = getOpenRouteServiceApiKey();
    if (!apiKey) {
      throw new OpenRouteServiceError('OPENROUTESERVICE_API_KEY is not configured');
    }
    const profile = this.getProfileForTravelMode(travelMode);

    const response = await axios.post<OpenRouteServiceResponse>(
      `${getOpenRouteServiceBaseUrl()}/v2/directions/${profile}/geojson`,
      {
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat],
        ],
        instructions: false,
        options: {
          avoid_polygons: avoidPolygons,
        },
      },
      {
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const feature = response.data.features?.[0];
    if (!feature || !isLineStringGeometry(feature.geometry)) {
      throw new OpenRouteServiceError('OpenRouteService did not return a valid route geometry', response.data);
    }

    const distanceMeters = Number(feature.properties?.summary?.distance);
    const durationSeconds = Number(feature.properties?.summary?.duration);
    if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) {
      throw new OpenRouteServiceError('OpenRouteService did not return valid route distance and duration', response.data);
    }

    return {
      provider: 'openrouteservice',
      profile,
      geometry: {
        type: 'LineString',
        coordinates: feature.geometry.coordinates.map(
          coordinate => [Number(coordinate[0]), Number(coordinate[1])] as [number, number]
        ),
      },
      distanceMeters,
      durationSeconds,
    };
  }

  static async getDrivingRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates,
    avoidPolygons: AvoidPolygonGeoJson
  ): Promise<ProviderRouteResult> {
    return this.getRoute(origin, destination, avoidPolygons, 'driving');
  }
}
