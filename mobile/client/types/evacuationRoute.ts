import { EvacuationCenter } from './components';

export type EvacuationTravelMode = 'driving' | 'walking';

export type RouteLineString = {
  type: 'LineString';
  coordinates: [number, number][];
};

export type RouteProvider = 'mapbox' | 'openrouteservice';
export type RouteProfile = 'mapbox/driving-traffic' | 'mapbox/walking' | 'driving-car' | 'foot-walking';
export type RouteAvoidanceMethod = 'none' | 'ors_avoid_polygons' | 'mapbox_exclude_points';
export type RoadCondition = 'closed' | 'incident' | 'severe' | 'heavy' | 'moderate' | 'low' | 'unknown';
export type RoadConditionSource = 'mapbox_directions' | 'mapbox_traffic_tilequery' | 'none';

export type RoadConditionSummary = {
  available: boolean;
  source: RoadConditionSource;
  worstCondition: RoadCondition;
  closureCount: number;
  incidentCount: number;
  hasLiveTraffic: boolean;
};

export type RoadConditionSegment = {
  id: string;
  geometry: RouteLineString;
  condition: RoadCondition;
  label: string;
  speedMetersPerSecond?: number | null;
  typicalDurationSeconds?: number | null;
  liveDurationSeconds?: number | null;
  congestionNumeric?: number | null;
  incidentType?: string | null;
  incidentDescription?: string | null;
  source: Exclude<RoadConditionSource, 'none'>;
};

export type BestEvacuationRouteResponse = {
  selectedCenter: EvacuationCenter;
  travelMode: EvacuationTravelMode;
  route: {
    provider: RouteProvider;
    profile: RouteProfile;
    geometry: RouteLineString;
    distanceMeters: number;
    durationSeconds: number;
    durationTypicalSeconds?: number | null;
  };
  dangerZoneSummary: {
    verifiedActiveCount: number;
    avoidanceApplied: boolean;
    avoidanceMethod: RouteAvoidanceMethod;
    providerFallback: boolean;
  };
  roadConditionSummary: RoadConditionSummary;
  roadConditionSegments: RoadConditionSegment[];
  warnings: string[];
};
