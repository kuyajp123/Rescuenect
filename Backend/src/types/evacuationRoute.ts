export type EvacuationTravelMode = 'driving' | 'walking';

export interface RouteCoordinates {
  lat: number;
  lng: number;
}

export interface RouteLineString {
  type: 'LineString';
  coordinates: [number, number][];
}

export type RouteProvider = 'mapbox' | 'openrouteservice';
export type RouteProfile = 'mapbox/driving-traffic' | 'mapbox/walking' | 'driving-car' | 'foot-walking';
export type RouteAvoidanceMethod = 'none' | 'ors_avoid_polygons' | 'mapbox_exclude_points';
export type RoadCondition = 'closed' | 'incident' | 'severe' | 'heavy' | 'moderate' | 'low' | 'unknown';
export type RoadConditionSource = 'mapbox_directions' | 'mapbox_traffic_tilequery' | 'none';

export interface RoadConditionSegment {
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
}

export interface RoadConditionSummary {
  available: boolean;
  source: RoadConditionSource;
  worstCondition: RoadCondition;
  closureCount: number;
  incidentCount: number;
  hasLiveTraffic: boolean;
}

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
  durationTypicalSeconds?: number | null;
  roadConditionSummary?: RoadConditionSummary;
  roadConditionSegments?: RoadConditionSegment[];
}

export interface BestEvacuationRouteResponse {
  selectedCenter: EvacuationCenterRouteCandidate;
  travelMode: EvacuationTravelMode;
  route: ProviderRouteResult;
  dangerZoneSummary: {
    verifiedActiveCount: number;
    avoidanceApplied: boolean;
    avoidanceMethod: RouteAvoidanceMethod;
    providerFallback: boolean;
  };
  roadConditionSummary: RoadConditionSummary;
  roadConditionSegments: RoadConditionSegment[];
  warnings: string[];
}
