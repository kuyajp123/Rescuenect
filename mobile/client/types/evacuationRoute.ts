import { EvacuationCenter } from './components';

export type RouteLineString = {
  type: 'LineString';
  coordinates: [number, number][];
};

export type BestEvacuationRouteResponse = {
  selectedCenter: EvacuationCenter;
  route: {
    provider: 'mapbox';
    profile: 'mapbox/driving';
    geometry: RouteLineString;
    distanceMeters: number;
    durationSeconds: number;
  };
  dangerZoneSummary: {
    verifiedActiveCount: number;
    avoidanceApplied: false;
  };
  warnings: string[];
};
