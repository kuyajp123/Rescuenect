import {
  EvacuationTravelMode,
  ProviderRouteResult,
  RouteCoordinates,
  RouteLineString,
  RouteProfile,
} from '@/types/evacuationRoute';
import axios from 'axios';
import { MapboxRouteConditionInput, RouteRoadConditionService } from './RouteRoadConditionService';

type MapboxRoute = {
  distance?: number;
  duration?: number;
  duration_typical?: number;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  legs?: Array<{
    incidents?: unknown[];
    closures?: unknown[];
    annotation?: {
      congestion?: unknown[];
      congestion_numeric?: unknown[];
      speed?: unknown[];
      duration?: unknown[];
    };
  }>;
};

type MapboxDirectionsResponse = {
  code?: string;
  message?: string;
  routes?: MapboxRoute[];
};

const MAPBOX_DIRECTIONS_BASE_URL = 'https://api.mapbox.com/directions/v5';
const MAPBOX_DRIVING_TRAFFIC_PROFILE = 'mapbox/driving-traffic';
const MAPBOX_WALKING_PROFILE = 'mapbox/walking';
const MAPBOX_EXCLUDE_POINT_LIMIT = 50;

const getMapboxDirectionsToken = (): string => process.env.MAPBOX_DIRECTIONS_TOKEN?.trim() || '';

const coordinateToPathSegment = (coordinate: RouteCoordinates): string => `${coordinate.lng},${coordinate.lat}`;

const isValidRouteCoordinate = (coordinate: RouteCoordinates): boolean =>
  Number.isFinite(coordinate.lat) &&
  Number.isFinite(coordinate.lng) &&
  coordinate.lat >= -90 &&
  coordinate.lat <= 90 &&
  coordinate.lng >= -180 &&
  coordinate.lng <= 180;

const coordinateToExcludePoint = (coordinate: RouteCoordinates): string =>
  `point(${coordinate.lng} ${coordinate.lat})`;

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
  static getProfileForTravelMode(travelMode: EvacuationTravelMode): RouteProfile {
    return travelMode === 'walking' ? MAPBOX_WALKING_PROFILE : MAPBOX_DRIVING_TRAFFIC_PROFILE;
  }

  static async getRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates,
    options: { travelMode: EvacuationTravelMode; excludePoints?: RouteCoordinates[] }
  ): Promise<ProviderRouteResult> {
    const accessToken = getMapboxDirectionsToken();
    if (!accessToken) {
      throw new MapboxDirectionsError('MAPBOX_DIRECTIONS_TOKEN is not configured');
    }

    const profile = this.getProfileForTravelMode(options.travelMode);
    const coordinates = `${coordinateToPathSegment(origin)};${coordinateToPathSegment(destination)}`;
    const excludePoints = (options.excludePoints ?? [])
      .filter(isValidRouteCoordinate)
      .slice(0, MAPBOX_EXCLUDE_POINT_LIMIT)
      .map(coordinateToExcludePoint);

    const response = await axios.get<MapboxDirectionsResponse>(
      `${MAPBOX_DIRECTIONS_BASE_URL}/${profile}/${coordinates}`,
      {
        params: {
          geometries: 'geojson',
          overview: 'full',
          steps: false,
          ...(profile === MAPBOX_DRIVING_TRAFFIC_PROFILE
            ? { annotations: 'distance,duration,speed,congestion,congestion_numeric,closure' }
            : {}),
          ...(profile === MAPBOX_DRIVING_TRAFFIC_PROFILE && excludePoints.length > 0
            ? { exclude: excludePoints.join(',') }
            : {}),
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

    const geometry: RouteLineString = {
      type: 'LineString',
      coordinates: route.geometry.coordinates.map(
        coordinate => [Number(coordinate[0]), Number(coordinate[1])] as [number, number]
      ),
    };
    const durationTypicalSeconds = Number(route.duration_typical);
    const roadConditions =
      profile === MAPBOX_DRIVING_TRAFFIC_PROFILE
        ? RouteRoadConditionService.buildFromMapboxDirections({
            geometry,
            durationTypicalSeconds: Number.isFinite(durationTypicalSeconds) ? durationTypicalSeconds : null,
            legs: route.legs as MapboxRouteConditionInput['legs'],
          })
        : undefined;

    return {
      provider: 'mapbox',
      profile,
      geometry,
      distanceMeters,
      durationSeconds,
      durationTypicalSeconds: Number.isFinite(durationTypicalSeconds) ? durationTypicalSeconds : null,
      roadConditionSummary: roadConditions?.summary,
      roadConditionSegments: roadConditions?.segments,
    };
  }

  static async getDrivingRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates,
    options: { excludePoints?: RouteCoordinates[] } = {}
  ): Promise<ProviderRouteResult> {
    return this.getRoute(origin, destination, { travelMode: 'driving', ...options });
  }
}
