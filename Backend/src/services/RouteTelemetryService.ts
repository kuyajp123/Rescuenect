import { db } from '@/db/firestoreConfig';
import {
  BestEvacuationRouteResponse,
  EvacuationTravelMode,
  RoadConditionSummary,
  RouteAvoidanceMethod,
  RouteCoordinates,
  RouteProvider,
  RouteProfile,
} from '@/types/evacuationRoute';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

type RouteTelemetryStart = {
  uid: string;
  clientId: string;
  origin: RouteCoordinates;
  targetCenterId?: string | null;
  travelMode: EvacuationTravelMode;
};

type RouteTelemetrySuccess = {
  requestId: string;
  startedAt: number;
  uid: string;
  clientId: string;
  origin: RouteCoordinates;
  targetCenterId?: string | null;
  response: BestEvacuationRouteResponse;
};

type RouteTelemetryFailure = RouteTelemetryStart & {
  requestId: string;
  startedAt: number;
  statusCode: number;
  message: string;
  details?: unknown;
};

type ProviderAttempt = {
  requestId?: string | null;
  clientId: string;
  provider: RouteProvider | 'mapbox_traffic_tilequery';
  profile?: RouteProfile | 'traffic_tilequery' | null;
  success: boolean;
  latencyMs: number;
  errorMessage?: string | null;
  httpStatus?: number | null;
  metadata?: Record<string, unknown>;
};

const coarseCoordinate = (coordinate: RouteCoordinates): RouteCoordinates => ({
  lat: Number(coordinate.lat.toFixed(3)),
  lng: Number(coordinate.lng.toFixed(3)),
});

const cleanValue = (value: unknown): unknown => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(cleanValue);
  if (typeof value === 'object' && value) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, cleanValue(entry)])
    );
  }
  return value;
};

export class RouteTelemetryService {
  private static routeRequestsRef() {
    return db.collection('routeRequests');
  }

  private static providerLogsRef() {
    return db.collection('routeProviderLogs');
  }

  static createRequestId(): string {
    return this.routeRequestsRef().doc().id;
  }

  static async recordSuccess(params: RouteTelemetrySuccess): Promise<void> {
    try {
      const { response } = params;
      await this.routeRequestsRef().doc(params.requestId).set({
        id: params.requestId,
        uid: params.uid,
        clientId: params.clientId,
        targetCenterId: params.targetCenterId ?? null,
        selectedCenterId: response.selectedCenter.id,
        travelMode: response.travelMode,
        originCoarse: coarseCoordinate(params.origin),
        provider: response.route.provider,
        profile: response.route.profile,
        avoidanceMethod: response.dangerZoneSummary.avoidanceMethod,
        providerFallback: response.dangerZoneSummary.providerFallback,
        verifiedActiveDangerZoneCount: response.dangerZoneSummary.verifiedActiveCount,
        roadConditionSummary: response.roadConditionSummary,
        routeDecision: response.routeDecision ?? null,
        warningCount: response.warnings.length,
        status: 'success',
        latencyMs: Date.now() - params.startedAt,
        createdAt: FieldValue.serverTimestamp(),
        createdAtMillis: Date.now(),
      });
    } catch (error) {
      console.error('Failed to record route success telemetry:', error);
    }
  }

  static async recordFailure(params: RouteTelemetryFailure): Promise<void> {
    try {
      await this.routeRequestsRef().doc(params.requestId).set({
        id: params.requestId,
        uid: params.uid,
        clientId: params.clientId,
        targetCenterId: params.targetCenterId ?? null,
        travelMode: params.travelMode,
        originCoarse: coarseCoordinate(params.origin),
        status: 'failed',
        statusCode: params.statusCode,
        message: params.message,
        details: cleanValue(params.details),
        latencyMs: Date.now() - params.startedAt,
        createdAt: FieldValue.serverTimestamp(),
        createdAtMillis: Date.now(),
      });
    } catch (error) {
      console.error('Failed to record route failure telemetry:', error);
    }
  }

  static async recordProviderAttempt(params: ProviderAttempt): Promise<void> {
    try {
      await this.providerLogsRef().add({
        requestId: params.requestId ?? null,
        clientId: params.clientId,
        provider: params.provider,
        profile: params.profile ?? null,
        success: params.success,
        latencyMs: params.latencyMs,
        errorMessage: params.errorMessage ?? null,
        httpStatus: params.httpStatus ?? null,
        metadata: cleanValue(params.metadata) ?? {},
        createdAt: FieldValue.serverTimestamp(),
        createdAtMillis: Date.now(),
      });
    } catch (error) {
      console.error('Failed to record route provider telemetry:', error);
    }
  }

  static async getOperationsSummary(clientId: string, windowHours = 24): Promise<{
    routeCount: number;
    failureCount: number;
    fallbackCount: number;
    averageLatencyMs: number;
    providerCounts: Record<string, number>;
    avoidanceCounts: Record<RouteAvoidanceMethod | string, number>;
    worstRoadConditionCounts: Record<string, number>;
    recentProviderWarnings: Array<{
      provider: string;
      profile?: string | null;
      errorMessage?: string | null;
      latencyMs: number;
      createdAt?: Timestamp | null;
    }>;
  }> {
    const since = Date.now() - windowHours * 60 * 60 * 1000;
    const routeSnapshot = await this.routeRequestsRef()
      .where('clientId', '==', clientId)
      .where('createdAtMillis', '>=', since)
      .orderBy('createdAtMillis', 'asc')
      .limit(500)
      .get();

    const routes = routeSnapshot.docs.map(doc => doc.data());
    const routeCount = routes.length;
    const failureCount = routes.filter(route => route.status === 'failed').length;
    const fallbackCount = routes.filter(route => route.providerFallback === true).length;
    const latencyValues = routes.map(route => Number(route.latencyMs)).filter(Number.isFinite);
    const averageLatencyMs = latencyValues.length
      ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length)
      : 0;

    const providerCounts: Record<string, number> = {};
    const avoidanceCounts: Record<string, number> = {};
    const worstRoadConditionCounts: Record<string, number> = {};
    routes.forEach(route => {
      const provider = String(route.provider || 'unknown');
      const avoidance = String(route.avoidanceMethod || 'unknown');
      const roadCondition = String((route.roadConditionSummary as RoadConditionSummary | undefined)?.worstCondition || 'unknown');
      providerCounts[provider] = (providerCounts[provider] ?? 0) + 1;
      avoidanceCounts[avoidance] = (avoidanceCounts[avoidance] ?? 0) + 1;
      worstRoadConditionCounts[roadCondition] = (worstRoadConditionCounts[roadCondition] ?? 0) + 1;
    });

    const providerSnapshot = await this.providerLogsRef()
      .where('clientId', '==', clientId)
      .where('success', '==', false)
      .where('createdAtMillis', '>=', since)
      .orderBy('createdAtMillis', 'asc')
      .limit(20)
      .get();

    const recentProviderWarnings = providerSnapshot.docs
      .map(doc => doc.data())
      .sort((left, right) => Number(right.createdAtMillis ?? 0) - Number(left.createdAtMillis ?? 0))
      .slice(0, 10)
      .map(log => ({
        provider: String(log.provider || 'unknown'),
        profile: typeof log.profile === 'string' ? log.profile : null,
        errorMessage: typeof log.errorMessage === 'string' ? log.errorMessage : null,
        latencyMs: Number(log.latencyMs) || 0,
        createdAt: log.createdAt ?? null,
      }));

    return {
      routeCount,
      failureCount,
      fallbackCount,
      averageLatencyMs,
      providerCounts,
      avoidanceCounts,
      worstRoadConditionCounts,
      recentProviderWarnings,
    };
  }
}
