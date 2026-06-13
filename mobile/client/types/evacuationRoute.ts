import { EvacuationCenter } from './components';

export type RouteLineString = {
  type: 'LineString';
  coordinates: [number, number][];
};

export type RouteProvider = 'mapbox' | 'openrouteservice';
export type RouteProfile = 'mapbox/driving' | 'driving-car';
export type RouteAvoidanceMethod = 'none' | 'ors_avoid_polygons' | 'mapbox_exclude_points';

export type BestEvacuationRouteResponse = {
  selectedCenter: EvacuationCenter;
  route: {
    provider: RouteProvider;
    profile: RouteProfile;
    geometry: RouteLineString;
    distanceMeters: number;
    durationSeconds: number;
  };
  dangerZoneSummary: {
    verifiedActiveCount: number;
    avoidanceApplied: boolean;
    avoidanceMethod: RouteAvoidanceMethod;
    providerFallback: boolean;
  };
  warnings: string[];
};
