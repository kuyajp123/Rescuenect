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
import { RouteTelemetryService } from './RouteTelemetryService';

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

  private static async enrichRoadConditions(params: {
    route: ProviderRouteResult;
    requestId: string;
    clientId: string;
  }): Promise<{
    route: BestEvacuationRouteResponse['route'];
    roadConditionSummary: BestEvacuationRouteResponse['roadConditionSummary'];
    roadConditionSegments: BestEvacuationRouteResponse['roadConditionSegments'];
    warning?: string;
  }> {
    const { route, requestId, clientId } = params;
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

    const startedAt = Date.now();
    try {
      const tilequeryConditions = await MapboxTrafficTilequeryService.enrichRoute(route.geometry);
      await RouteTelemetryService.recordProviderAttempt({
        requestId,
        clientId,
        provider: 'mapbox_traffic_tilequery',
        profile: 'traffic_tilequery',
        success: tilequeryConditions.summary.available,
        latencyMs: Date.now() - startedAt,
        errorMessage: tilequeryConditions.summary.available ? null : ROAD_CONDITION_UNAVAILABLE_WARNING,
        metadata: { segmentCount: tilequeryConditions.segments.length },
      });
      return {
        route: responseRoute,
        roadConditionSummary: tilequeryConditions.summary,
        roadConditionSegments: tilequeryConditions.segments,
        warning: tilequeryConditions.summary.available ? undefined : ROAD_CONDITION_UNAVAILABLE_WARNING,
      };
    } catch (error) {
      await RouteTelemetryService.recordProviderAttempt({
        requestId,
        clientId,
        provider: 'mapbox_traffic_tilequery',
        profile: 'traffic_tilequery',
        success: false,
        latencyMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return {
        route: responseRoute,
        roadConditionSummary: EMPTY_ROAD_CONDITION_SUMMARY,
        roadConditionSegments: [],
        warning: ROAD_CONDITION_UNAVAILABLE_WARNING,
      };
    }
  }

  private static async buildResponse(params: {
    requestId: string;
    selectedCenter: EvacuationCenterRouteCandidate;
    route: ProviderRouteResult;
    routeDecision: NonNullable<BestEvacuationRouteResponse['routeDecision']>;
    travelMode: EvacuationTravelMode;
    verifiedActiveCount: number;
    avoidanceApplied: boolean;
    avoidanceMethod: BestEvacuationRouteResponse['dangerZoneSummary']['avoidanceMethod'];
    providerFallback: boolean;
    extraWarnings?: string[];
  }): Promise<BestEvacuationRouteResponse> {
    const {
      requestId,
      selectedCenter,
      route,
      routeDecision,
      travelMode,
      verifiedActiveCount,
      avoidanceApplied,
      avoidanceMethod,
      providerFallback,
      extraWarnings = [],
    } = params;
    const roadConditions = await this.enrichRoadConditions({ route, requestId, clientId: params.selectedCenter.clientId });
    return {
      requestId,
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
      routeDecision,
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

  private static getHttpStatus(error: unknown): number | null {
    const responseStatus = (error as { response?: { status?: unknown } } | null)?.response?.status;
    return typeof responseStatus === 'number' ? responseStatus : null;
  }

  private static async withProviderTelemetry(
    params: {
      requestId: string;
      clientId: string;
      provider: 'mapbox' | 'openrouteservice';
      profile: ProviderRouteResult['profile'];
      metadata?: Record<string, unknown>;
    },
    routeCall: () => Promise<ProviderRouteResult>
  ): Promise<ProviderRouteResult> {
    const startedAt = Date.now();
    try {
      const route = await routeCall();
      await RouteTelemetryService.recordProviderAttempt({
        requestId: params.requestId,
        clientId: params.clientId,
        provider: params.provider,
        profile: params.profile,
        success: true,
        latencyMs: Date.now() - startedAt,
        metadata: params.metadata,
      });
      return route;
    } catch (error) {
      await RouteTelemetryService.recordProviderAttempt({
        requestId: params.requestId,
        clientId: params.clientId,
        provider: params.provider,
        profile: params.profile,
        success: false,
        latencyMs: Date.now() - startedAt,
        httpStatus: this.getHttpStatus(error),
        errorMessage: error instanceof Error ? error.message : String(error),
        metadata: params.metadata,
      });
      throw error;
    }
  }

  static async getBestRoute(uid: string, rawPayload: unknown): Promise<BestEvacuationRouteResponse> {
    const payload = parsePayload(rawPayload);
    const requestId = RouteTelemetryService.createRequestId();
    const startedAt = Date.now();

    try {
      await this.assertResidentClientScope(uid, payload.clientId);

      const centers = await this.getAvailableCenters(payload.clientId);
      const verifiedActiveDangerZones = await DangerZoneModel.listPublicVerifiedActive(payload.clientId);
      const verifiedActiveCount = verifiedActiveDangerZones.length;

      if (verifiedActiveCount === 0) {
        const { center, route, routeDecision } = await EvacuationRouteSelectionService.chooseRoute({
          origin: payload.origin,
          centers,
          targetCenterId: payload.targetCenterId,
          routeProvider: candidate =>
            this.withProviderTelemetry(
              {
                requestId,
                clientId: payload.clientId,
                provider: 'mapbox',
                profile: MapboxDirectionsService.getProfileForTravelMode(payload.travelMode),
                metadata: { candidateCenterId: candidate.id, path: 'normal' },
              },
              () => MapboxDirectionsService.getRoute(payload.origin, candidate.coordinates, { travelMode: payload.travelMode })
            ),
          avoidanceMethod: 'none',
          providerFallback: false,
          verifiedActiveCount,
        });

        const response = await this.buildResponse({
          requestId,
          selectedCenter: center,
          route,
          routeDecision,
          travelMode: payload.travelMode,
          verifiedActiveCount,
          avoidanceApplied: false,
          avoidanceMethod: 'none',
          providerFallback: false,
        });
        await RouteTelemetryService.recordSuccess({ requestId, startedAt, uid, clientId: payload.clientId, origin: payload.origin, targetCenterId: payload.targetCenterId, response });
        return response;
      }

      const avoidPolygons = DangerZoneAvoidanceGeometryService.buildOpenRouteServiceAvoidPolygons(verifiedActiveDangerZones);
      const excludePoints = DangerZoneAvoidanceGeometryService.buildMapboxExcludePoints(verifiedActiveDangerZones);
      const providerFailures: Record<string, unknown> = {};

      if (avoidPolygons) {
        try {
          const { center, route, routeDecision } = await EvacuationRouteSelectionService.chooseRoute({
            origin: payload.origin,
            centers,
            targetCenterId: payload.targetCenterId,
            routeProvider: candidate =>
              this.withProviderTelemetry(
                {
                  requestId,
                  clientId: payload.clientId,
                  provider: 'openrouteservice',
                  profile: OpenRouteService.getProfileForTravelMode(payload.travelMode),
                  metadata: { candidateCenterId: candidate.id, path: 'ors_avoid_polygons' },
                },
                () => OpenRouteService.getRoute(payload.origin, candidate.coordinates, avoidPolygons, payload.travelMode)
              ),
            avoidanceMethod: 'ors_avoid_polygons',
            providerFallback: false,
            verifiedActiveCount,
          });

          const response = await this.buildResponse({
            requestId,
            selectedCenter: center,
            route,
            routeDecision,
            travelMode: payload.travelMode,
            verifiedActiveCount,
            avoidanceApplied: true,
            avoidanceMethod: 'ors_avoid_polygons',
            providerFallback: false,
          });
          await RouteTelemetryService.recordSuccess({ requestId, startedAt, uid, clientId: payload.clientId, origin: payload.origin, targetCenterId: payload.targetCenterId, response });
          return response;
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
          const { center, route, routeDecision } = await EvacuationRouteSelectionService.chooseRoute({
            origin: payload.origin,
            centers,
            targetCenterId: payload.targetCenterId,
            routeProvider: candidate =>
              this.withProviderTelemetry(
                {
                  requestId,
                  clientId: payload.clientId,
                  provider: 'mapbox',
                  profile: MapboxDirectionsService.getProfileForTravelMode(payload.travelMode),
                  metadata: { candidateCenterId: candidate.id, path: 'mapbox_exclude_points', excludePointCount: excludePoints.length },
                },
                () =>
                  MapboxDirectionsService.getRoute(payload.origin, candidate.coordinates, {
                    travelMode: payload.travelMode,
                    excludePoints,
                  })
              ),
            avoidanceMethod: 'mapbox_exclude_points',
            providerFallback: true,
            verifiedActiveCount,
          });

          const response = await this.buildResponse({
            requestId,
            selectedCenter: center,
            route,
            routeDecision,
            travelMode: payload.travelMode,
            verifiedActiveCount,
            avoidanceApplied: true,
            avoidanceMethod: 'mapbox_exclude_points',
            providerFallback: true,
          });
          await RouteTelemetryService.recordSuccess({ requestId, startedAt, uid, clientId: payload.clientId, origin: payload.origin, targetCenterId: payload.targetCenterId, response });
          return response;
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
        const { center, route, routeDecision } = await EvacuationRouteSelectionService.chooseRoute({
          origin: payload.origin,
          centers,
          targetCenterId: payload.targetCenterId,
          routeProvider: candidate =>
            this.withProviderTelemetry(
              {
                requestId,
                clientId: payload.clientId,
                provider: 'mapbox',
                profile: MapboxDirectionsService.getProfileForTravelMode(payload.travelMode),
                metadata: { candidateCenterId: candidate.id, path: 'normal_fallback' },
              },
              () => MapboxDirectionsService.getRoute(payload.origin, candidate.coordinates, { travelMode: payload.travelMode })
            ),
          avoidanceMethod: 'none',
          providerFallback: true,
          verifiedActiveCount,
        });

        const response = await this.buildResponse({
          requestId,
          selectedCenter: center,
          route,
          routeDecision,
          travelMode: payload.travelMode,
          verifiedActiveCount,
          avoidanceApplied: false,
          avoidanceMethod: 'none',
          providerFallback: true,
        });
        await RouteTelemetryService.recordSuccess({ requestId, startedAt, uid, clientId: payload.clientId, origin: payload.origin, targetCenterId: payload.targetCenterId, response });
        return response;
      } catch (error) {
        if (!this.isProviderAllCandidatesFailure(error)) throw error;
        throw new EvacuationRoutingError(502, 'Route computation failed for all providers', {
          ...providerFailures,
          mapboxNormal: error.details,
        });
      }
    } catch (error) {
      await RouteTelemetryService.recordFailure({
        requestId,
        startedAt,
        uid,
        clientId: payload.clientId,
        origin: payload.origin,
        targetCenterId: payload.targetCenterId,
        travelMode: payload.travelMode,
        statusCode: error instanceof EvacuationRoutingError ? error.statusCode : 500,
        message: error instanceof Error ? error.message : 'Route computation failed',
        details: error instanceof EvacuationRoutingError ? error.details : undefined,
      });
      throw error;
    }
  }
}
