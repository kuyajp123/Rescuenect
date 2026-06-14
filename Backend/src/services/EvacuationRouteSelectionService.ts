import {
  EvacuationCenterRouteCandidate,
  ProviderRouteResult,
  RoadCondition,
  RouteAvoidanceMethod,
  RouteCoordinates,
} from '@/types/evacuationRoute';

export const ROUTE_ADVISORY_WARNING =
  'This is suggested route guidance only. During emergencies, follow LGU officials and emergency responders.';
export const MAPBOX_EXCLUDE_POINTS_WARNING =
  'OpenRouteService polygon avoidance is unavailable. Mapbox best-effort point exclusions were used, but this route may still enter verified danger zones.';
export const SAFER_ROUTING_UNAVAILABLE_WARNING =
  'Safer routing is unavailable right now. Showing a normal route that may cross verified danger zones.';
export const ROAD_CONDITION_UNAVAILABLE_WARNING =
  'Road-condition details are unavailable for this route.';

const EARTH_RADIUS_METERS = 6_371_008.8;
const DEFAULT_CANDIDATE_LIMIT = 5;
const MAX_CANDIDATE_LIMIT = 10;

const getCandidateLimit = (): number => {
  const rawLimit = Number(process.env.EVACUATION_ROUTE_CANDIDATE_LIMIT);
  if (!Number.isFinite(rawLimit)) return DEFAULT_CANDIDATE_LIMIT;
  return Math.min(Math.max(Math.floor(rawLimit), 1), MAX_CANDIDATE_LIMIT);
};

const asPositiveNumber = (value: unknown): number | null => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
};

const getRoadConditionPenaltySeconds = (condition?: RoadCondition): number => {
  switch (condition) {
    case 'closed':
      return 1800;
    case 'incident':
    case 'severe':
      return 600;
    case 'heavy':
      return 300;
    case 'moderate':
      return 120;
    default:
      return 0;
  }
};

export class EvacuationRoutingError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'EvacuationRoutingError';
  }
}

export const isValidRouteCoordinate = (value: unknown): value is RouteCoordinates => {
  if (!value || typeof value !== 'object') return false;
  const coordinate = value as { lat?: unknown; lng?: unknown };
  const lat = Number(coordinate.lat);
  const lng = Number(coordinate.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const haversineDistanceMeters = (from: RouteCoordinates, to: RouteCoordinates): number => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export class EvacuationRouteSelectionService {
  static filterAvailableCenters(
    centers: Array<Partial<EvacuationCenterRouteCandidate>>,
    clientId: string
  ): EvacuationCenterRouteCandidate[] {
    return centers
      .filter(center => center.clientId === clientId)
      .filter(center => center.status === 'available')
      .filter(center => center.isSafe !== false)
      .filter(center => isValidRouteCoordinate(center.coordinates))
      .map(center => ({
        ...center,
        id: String(center.id),
        clientId,
        coordinates: {
          lat: Number(center.coordinates!.lat),
          lng: Number(center.coordinates!.lng),
        },
      })) as EvacuationCenterRouteCandidate[];
  }

  static getNearestCandidates(
    origin: RouteCoordinates,
    centers: EvacuationCenterRouteCandidate[],
    limit = getCandidateLimit()
  ): EvacuationCenterRouteCandidate[] {
    return [...centers]
      .sort(
        (left, right) =>
          haversineDistanceMeters(origin, left.coordinates) -
          haversineDistanceMeters(origin, right.coordinates)
      )
      .slice(0, limit);
  }

  static buildWarnings(params: { avoidanceMethod: RouteAvoidanceMethod; providerFallback: boolean }): string[] {
    const { avoidanceMethod, providerFallback } = params;
    return [
      ROUTE_ADVISORY_WARNING,
      ...(providerFallback && avoidanceMethod === 'mapbox_exclude_points' ? [MAPBOX_EXCLUDE_POINTS_WARNING] : []),
      ...(providerFallback && avoidanceMethod === 'none' ? [SAFER_ROUTING_UNAVAILABLE_WARNING] : []),
    ];
  }

  static getCenterPenaltySeconds(center: EvacuationCenterRouteCandidate): number {
    if (center.isSafe === false) return Number.POSITIVE_INFINITY;
    const capacity = asPositiveNumber(center.capacity);
    const currentOccupancy = asPositiveNumber(center.currentOccupancy) ?? 0;
    if (!capacity) return 0;
    const occupancyRatio = currentOccupancy / capacity;
    if (occupancyRatio >= 1) return 1200;
    if (occupancyRatio >= 0.9) return 600;
    if (occupancyRatio >= 0.75) return 180;
    return 0;
  }

  static getRiskPenaltySeconds(params: {
    avoidanceMethod: RouteAvoidanceMethod;
    providerFallback: boolean;
    verifiedActiveCount: number;
  }): number {
    if (params.verifiedActiveCount <= 0) return 0;
    if (params.avoidanceMethod === 'ors_avoid_polygons') return 0;
    if (params.avoidanceMethod === 'mapbox_exclude_points') return 180;
    return params.providerFallback ? 900 : 600;
  }

  static scoreRoute(params: {
    center: EvacuationCenterRouteCandidate;
    route: ProviderRouteResult;
    avoidanceMethod: RouteAvoidanceMethod;
    providerFallback: boolean;
    verifiedActiveCount: number;
  }) {
    const riskPenaltySeconds = this.getRiskPenaltySeconds(params);
    const roadConditionPenaltySeconds = getRoadConditionPenaltySeconds(params.route.roadConditionSummary?.worstCondition);
    const centerPenaltySeconds = this.getCenterPenaltySeconds(params.center);
    const scoreSeconds = Math.round(
      params.route.durationSeconds + riskPenaltySeconds + roadConditionPenaltySeconds + centerPenaltySeconds
    );

    return {
      strategy: 'duration_risk_capacity' as const,
      scoreSeconds,
      riskPenaltySeconds,
      roadConditionPenaltySeconds,
      centerPenaltySeconds,
    };
  }

  static async chooseRoute(params: {
    origin: RouteCoordinates;
    centers: EvacuationCenterRouteCandidate[];
    targetCenterId?: string | null;
    routeProvider: (center: EvacuationCenterRouteCandidate) => Promise<ProviderRouteResult>;
    avoidanceMethod: RouteAvoidanceMethod;
    providerFallback: boolean;
    verifiedActiveCount: number;
  }): Promise<{
    center: EvacuationCenterRouteCandidate;
    route: ProviderRouteResult;
    routeDecision: {
      strategy: 'duration_risk_capacity';
      evaluatedCandidateCount: number;
      scoreSeconds: number;
      riskPenaltySeconds: number;
      roadConditionPenaltySeconds: number;
      centerPenaltySeconds: number;
    };
  }> {
    const { origin, centers, targetCenterId, routeProvider } = params;

    if (centers.length === 0) {
      throw new EvacuationRoutingError(404, 'No available evacuation centers found');
    }

    const candidates = targetCenterId
      ? centers.filter(center => center.id === targetCenterId)
      : this.getNearestCandidates(origin, centers);

    if (targetCenterId && candidates.length === 0) {
      throw new EvacuationRoutingError(404, 'Selected evacuation center is unavailable');
    }

    let best: {
      center: EvacuationCenterRouteCandidate;
      route: ProviderRouteResult;
      routeDecision: ReturnType<typeof EvacuationRouteSelectionService.scoreRoute> & { evaluatedCandidateCount: number };
    } | null = null;
    const failures: Array<{ centerId: string; message: string }> = [];

    for (const center of candidates) {
      try {
        const route = await routeProvider(center);
        const routeDecision = {
          ...this.scoreRoute({
            center,
            route,
            avoidanceMethod: params.avoidanceMethod,
            providerFallback: params.providerFallback,
            verifiedActiveCount: params.verifiedActiveCount,
          }),
          evaluatedCandidateCount: candidates.length,
        };
        if (!best || routeDecision.scoreSeconds < best.routeDecision.scoreSeconds) {
          best = { center, route, routeDecision };
        }
      } catch (error) {
        failures.push({
          centerId: center.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (!best) {
      throw new EvacuationRoutingError(502, 'Route computation failed for all candidates', {
        failures,
      });
    }

    return best;
  }
}
