export type EvacuationTravelMode = 'driving';

export interface RouteCoordinates {
  lat: number;
  lng: number;
}

export interface RouteLineString {
  type: 'LineString';
  coordinates: [number, number][];
}

export type RouteProvider = 'mapbox' | 'openrouteservice';
export type RouteProfile = 'mapbox/driving' | 'driving-car';
export type RouteAvoidanceMethod = 'none' | 'ors_avoid_polygons' | 'mapbox_exclude_points';

export interface EvacuationCenterRouteCandidate {
  id: string;
  clientId: string;
  name?: string;
  status?: string;
  coordinates: RouteCoordinates;
  [key: string]: unknown;
}

export interface ProviderRouteResult {
  provider: RouteProvider;
  profile: RouteProfile;
  geometry: RouteLineString;
  distanceMeters: number;
  durationSeconds: number;
}

export interface BestEvacuationRouteResponse {
  selectedCenter: EvacuationCenterRouteCandidate;
  route: ProviderRouteResult;
  dangerZoneSummary: {
    verifiedActiveCount: number;
    avoidanceApplied: boolean;
    avoidanceMethod: RouteAvoidanceMethod;
    providerFallback: boolean;
  };
  warnings: string[];
}
