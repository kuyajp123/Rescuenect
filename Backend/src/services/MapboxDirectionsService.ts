import { ProviderRouteResult, RouteCoordinates, RouteLineString } from '@/types/evacuationRoute';
import axios from 'axios';

type MapboxRoute = {
  distance?: number;
  duration?: number;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
};

type MapboxDirectionsResponse = {
  code?: string;
  message?: string;
  routes?: MapboxRoute[];
};

const MAPBOX_DIRECTIONS_BASE_URL = 'https://api.mapbox.com/directions/v5';
const MAPBOX_DRIVING_PROFILE = 'mapbox/driving';

const getMapboxDirectionsToken = (): string => process.env.MAPBOX_DIRECTIONS_TOKEN?.trim() || '';

const coordinateToPathSegment = (coordinate: RouteCoordinates): string => `${coordinate.lng},${coordinate.lat}`;

const isLineStringGeometry = (geometry?: MapboxRoute['geometry']): geometry is RouteLineString =>
  geometry?.type === 'LineString' &&
  Array.isArray(geometry.coordinates) &&
  geometry.coordinates.every(
    coordinate =>
      Array.isArray(coordinate) &&
      coordinate.length >= 2 &&
      Number.isFinite(Number(coordinate[0])) &&
      Number.isFinite(Number(coordinate[1]))
  );

export class MapboxDirectionsError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'MapboxDirectionsError';
  }
}

export class MapboxDirectionsService {
  static async getDrivingRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates
  ): Promise<ProviderRouteResult> {
    const accessToken = getMapboxDirectionsToken();
    if (!accessToken) {
      throw new MapboxDirectionsError('MAPBOX_DIRECTIONS_TOKEN is not configured');
    }

    const coordinates = `${coordinateToPathSegment(origin)};${coordinateToPathSegment(destination)}`;
    const response = await axios.get<MapboxDirectionsResponse>(
      `${MAPBOX_DIRECTIONS_BASE_URL}/${MAPBOX_DRIVING_PROFILE}/${coordinates}`,
      {
        params: {
          geometries: 'geojson',
          overview: 'full',
          steps: false,
          access_token: accessToken,
        },
        timeout: 15000,
      }
    );

    const route = response.data.routes?.[0];
    if (!route || !isLineStringGeometry(route.geometry)) {
      throw new MapboxDirectionsError('Mapbox did not return a valid route geometry', response.data);
    }

    const distanceMeters = Number(route.distance);
    const durationSeconds = Number(route.duration);
    if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) {
      throw new MapboxDirectionsError('Mapbox did not return valid route distance and duration', response.data);
    }

    return {
      provider: 'mapbox',
      profile: MAPBOX_DRIVING_PROFILE,
      geometry: {
        type: 'LineString',
        coordinates: route.geometry.coordinates.map(
          coordinate => [Number(coordinate[0]), Number(coordinate[1])] as [number, number]
        ),
      },
      distanceMeters,
      durationSeconds,
    };
  }
}
