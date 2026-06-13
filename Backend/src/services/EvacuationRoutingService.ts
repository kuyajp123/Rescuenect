import { canonicalizeClientId } from '@/config/locationConfig';
import { db } from '@/db/firestoreConfig';
import { ClientModel } from '@/models/admin/ClientModel';
import { DangerZoneModel } from '@/models/DangerZoneModel';
import {
  BestEvacuationRouteResponse,
  EvacuationCenterRouteCandidate,
  EvacuationTravelMode,
  ProviderRouteResult,
  RouteCoordinates,
} from '@/types/evacuationRoute';
import { getEffectiveClientId } from '@/utils/adminScope';
import { DangerZoneAvoidanceGeometryService } from './DangerZoneAvoidanceGeometryService';
import {
  EvacuationRouteSelectionService,
  EvacuationRoutingError,
  isValidRouteCoordinate,
  ROAD_CONDITION_UNAVAILABLE_WARNING,
} from './EvacuationRouteSelectionService';
import { MapboxDirectionsService } from './MapboxDirectionsService';
import { MapboxTrafficTilequeryService } from './MapboxTrafficTilequeryService';
import { OpenRouteService } from './OpenRouteService';
import { EMPTY_ROAD_CONDITION_SUMMARY } from './RouteRoadConditionService';

type BestRoutePayload = {
  clientId: string;
  origin: RouteCoordinates;
  targetCenterId?: string;
  travelMode: EvacuationTravelMode;
};

const asTrimmedString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const parsePayload = (payload: unknown): BestRoutePayload => {
  if (!payload || typeof payload !== 'object') {
    throw new EvacuationRoutingError(400, 'Invalid route request payload');
  }

  const rawPayload = payload as {
    clientId?: unknown;
    origin?: unknown;
    targetCenterId?: unknown;
    travelMode?: unknown;
  };
  const clientId = canonicalizeClientId(asTrimmedString(rawPayload.clientId));
  if (!clientId) {
    throw new EvacuationRoutingError(400, 'clientId is required');
  }

  if (!isValidRouteCoordinate(rawPayload.origin)) {
    throw new EvacuationRoutingError(400, 'A valid origin latitude and longitude are required');
  }

  const travelMode = asTrimmedString(rawPayload.travelMode || 'driving') as EvacuationTravelMode;
  if (travelMode && travelMode !== 'driving' && travelMode !== 'walking') {
    throw new EvacuationRoutingError(400, 'Only driving and walking routes are supported');
  }

  const targetCenterId = asTrimmedString(rawPayload.targetCenterId);

  return {
    clientId,
    origin: {
      lat: Number(rawPayload.origin.lat),
      lng: Number(rawPayload.origin.lng),
    },
    targetCenterId: targetCenterId || undefined,
    travelMode,
  };
};

export class EvacuationRoutingService {
  private static async assertResidentClientScope(uid: string, clientId: string): Promise<void> {
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      throw new EvacuationRoutingError(404, 'Resident profile not found');
    }

    const userClientId = canonicalizeClientId(asTrimmedString(userSnap.data()?.clientId));
    if (!userClientId) {
      throw new EvacuationRoutingError(400, 'Resident profile is missing client assignment');
    }

    if (userClientId !== clientId) {
      throw new EvacuationRoutingError(403, 'Client access denied');
    }

    const client = await ClientModel.getClientById(clientId);
    if (!client || client.status !== 'active') {
      throw new EvacuationRoutingError(403, 'Resident client is not active');
    }
  }

  private static async getAvailableCenters(clientId: string): Promise<EvacuationCenterRouteCandidate[]> {
    const snapshot = await db.collection('centers').get();
    const rawCenters: Array<Partial<EvacuationCenterRouteCandidate>> = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const centerClientId = getEffectiveClientId(data);
      rawCenters.push({
        id: doc.id,
        ...data,
        clientId: centerClientId,
      } as Partial<EvacuationCenterRouteCandidate>);
    });

    return EvacuationRouteSelectionService.filterAvailableCenters(rawCenters, clientId);
  }

  private static async enrichRoadConditions(route: ProviderRouteResult): Promise<{
    route: BestEvacuationRouteResponse['route'];
    roadConditionSummary: BestEvacuationRouteResponse['roadConditionSummary'];
    roadConditionSegments: BestEvacuationRouteResponse['roadConditionSegments'];
    warning?: string;
  }> {
    const {
      roadConditionSummary,
      roadConditionSegments,
      ...responseRoute
    } = route;

    if (roadConditionSummary && roadConditionSegments) {
      return {
        route: responseRoute,
        roadConditionSummary,
        roadConditionSegments,
      };
    }

    const tilequeryConditions = await MapboxTrafficTilequeryService.enrichRoute(route.geometry);
    return {
      route: responseRoute,
      roadConditionSummary: tilequeryConditions.summary,
      roadConditionSegments: tilequeryConditions.segments,
      warning: tilequeryConditions.summary.available ? undefined : ROAD_CONDITION_UNAVAILABLE_WARNING,
    };
  }

  private static async buildResponse(params: {
    selectedCenter: EvacuationCenterRouteCandidate;
    route: ProviderRouteResult;
    travelMode: EvacuationTravelMode;
    verifiedActiveCount: number;
    avoidanceApplied: boolean;
    avoidanceMethod: BestEvacuationRouteResponse['dangerZoneSummary']['avoidanceMethod'];
    providerFallback: boolean;
    extraWarnings?: string[];
  }): Promise<BestEvacuationRouteResponse> {
    const {
      selectedCenter,
      route,
      travelMode,
      verifiedActiveCount,
      avoidanceApplied,
      avoidanceMethod,
      providerFallback,
      extraWarnings = [],
    } = params;
    const roadConditions = await this.enrichRoadConditions(route);
    return {
      selectedCenter,
      travelMode,
      route: roadConditions.route,
      dangerZoneSummary: {
        verifiedActiveCount,
        avoidanceApplied,
        avoidanceMethod,
        providerFallback,
      },
      roadConditionSummary: roadConditions.roadConditionSummary ?? EMPTY_ROAD_CONDITION_SUMMARY,
      roadConditionSegments: roadConditions.roadConditionSegments ?? [],
      warnings: [
        ...EvacuationRouteSelectionService.buildWarnings({
          avoidanceMethod,
          providerFallback,
        }),
        ...(roadConditions.warning ? [roadConditions.warning] : []),
        ...extraWarnings,
      ],
    };
  }

  private static isProviderAllCandidatesFailure(error: unknown): error is EvacuationRoutingError {
    return error instanceof EvacuationRoutingError && error.statusCode === 502;
  }

  static async getBestRoute(uid: string, rawPayload: unknown): Promise<BestEvacuationRouteResponse> {
    const payload = parsePayload(rawPayload);
    await this.assertResidentClientScope(uid, payload.clientId);

    const centers = await this.getAvailableCenters(payload.clientId);
    const verifiedActiveDangerZones = await DangerZoneModel.listPublicVerifiedActive(payload.clientId);
    const verifiedActiveCount = verifiedActiveDangerZones.length;

    if (verifiedActiveCount === 0) {
      const { center, route } = await EvacuationRouteSelectionService.chooseRoute({
        origin: payload.origin,
        centers,
        targetCenterId: payload.targetCenterId,
        routeProvider: candidate =>
          MapboxDirectionsService.getRoute(payload.origin, candidate.coordinates, { travelMode: payload.travelMode }),
      });

      return await this.buildResponse({
        selectedCenter: center,
        route,
        travelMode: payload.travelMode,
        verifiedActiveCount,
        avoidanceApplied: false,
        avoidanceMethod: 'none',
        providerFallback: false,
      });
    }

    const avoidPolygons = DangerZoneAvoidanceGeometryService.buildOpenRouteServiceAvoidPolygons(verifiedActiveDangerZones);
    const excludePoints = DangerZoneAvoidanceGeometryService.buildMapboxExcludePoints(verifiedActiveDangerZones);
    const providerFailures: Record<string, unknown> = {};

    if (avoidPolygons) {
      try {
        const { center, route } = await EvacuationRouteSelectionService.chooseRoute({
          origin: payload.origin,
          centers,
          targetCenterId: payload.targetCenterId,
          routeProvider: candidate =>
            OpenRouteService.getRoute(payload.origin, candidate.coordinates, avoidPolygons, payload.travelMode),
        });

        return await this.buildResponse({
          selectedCenter: center,
          route,
          travelMode: payload.travelMode,
          verifiedActiveCount,
          avoidanceApplied: true,
          avoidanceMethod: 'ors_avoid_polygons',
          providerFallback: false,
        });
      } catch (error) {
        if (!this.isProviderAllCandidatesFailure(error)) throw error;
        providerFailures.openRouteService = error.details;
      }
    } else {
      providerFailures.openRouteService = {
        message: 'No valid OpenRouteService avoid polygons could be generated from verified danger zones',
      };
    }

    if (payload.travelMode === 'driving' && excludePoints.length > 0) {
      try {
        const { center, route } = await EvacuationRouteSelectionService.chooseRoute({
          origin: payload.origin,
          centers,
          targetCenterId: payload.targetCenterId,
          routeProvider: candidate =>
            MapboxDirectionsService.getRoute(payload.origin, candidate.coordinates, {
              travelMode: payload.travelMode,
              excludePoints,
            }),
        });

        return await this.buildResponse({
          selectedCenter: center,
          route,
          travelMode: payload.travelMode,
          verifiedActiveCount,
          avoidanceApplied: true,
          avoidanceMethod: 'mapbox_exclude_points',
          providerFallback: true,
        });
      } catch (error) {
        if (!this.isProviderAllCandidatesFailure(error)) throw error;
        providerFailures.mapboxExcludePoints = error.details;
      }
    } else if (payload.travelMode === 'driving') {
      providerFailures.mapboxExcludePoints = {
        message: 'No valid Mapbox exclude points could be generated from verified danger zones',
      };
    } else {
      providerFailures.mapboxExcludePoints = {
        message: 'Mapbox point exclusions are not supported for walking routes',
      };
    }

    try {
      const { center, route } = await EvacuationRouteSelectionService.chooseRoute({
        origin: payload.origin,
        centers,
        targetCenterId: payload.targetCenterId,
        routeProvider: candidate =>
          MapboxDirectionsService.getRoute(payload.origin, candidate.coordinates, { travelMode: payload.travelMode }),
      });

      return await this.buildResponse({
        selectedCenter: center,
        route,
        travelMode: payload.travelMode,
        verifiedActiveCount,
        avoidanceApplied: false,
        avoidanceMethod: 'none',
        providerFallback: true,
      });
    } catch (error) {
      if (!this.isProviderAllCandidatesFailure(error)) throw error;
      throw new EvacuationRoutingError(502, 'Route computation failed for all providers', {
        ...providerFailures,
        mapboxNormal: error.details,
      });
    }
  }
}
