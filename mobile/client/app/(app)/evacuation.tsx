import { Body } from '@/components/ui/layout/Body';
import { MapView } from '@/components/ui/map/MapView';
import { API_ROUTES } from '@/config/endpoints';
import { EvacuationCenter } from '@/types/components';
import { DangerZoneRecord } from '@/types/dangerZone';
import axios, { isAxiosError } from 'axios';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STORAGE_KEYS } from '@/config/asyncStorage';
import { getCurrentPositionOnce } from '@/helper/commonHelpers';
import { storageHelpers } from '@/helper/storage';
import { requestBestEvacuationRoute } from '@/services/evacuationRouteService';
import { useSavedLocationsStore } from '@/store/useSavedLocationsStore';
import { useUserData } from '@/store/useBackendResponse';
import { fetchPublicDangerZones } from '@/services/dangerZoneService';
import { BestEvacuationRouteResponse, EvacuationTravelMode } from '@/types/evacuationRoute';

const getRouteErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
  }
  return error instanceof Error ? error.message : 'Unable to compute evacuation route.';
};

const getRouteProviderLabel = (routeResult: BestEvacuationRouteResponse): string => {
  const providerName = routeResult.route.provider === 'openrouteservice' ? 'OpenRouteService' : 'Mapbox';
  const avoidanceMethod = routeResult.dangerZoneSummary.avoidanceMethod;

  if (avoidanceMethod === 'ors_avoid_polygons') {
    return `Danger zones avoided - ${providerName}`;
  }

  if (avoidanceMethod === 'mapbox_exclude_points') {
    return `Limited avoidance - ${providerName}`;
  }

  if (routeResult.dangerZoneSummary.providerFallback && routeResult.dangerZoneSummary.verifiedActiveCount > 0) {
    return `Avoidance unavailable - ${providerName}`;
  }

  return providerName;
};

const getRoadConditionLabel = (routeResult: BestEvacuationRouteResponse): string => {
  const condition = routeResult.roadConditionSummary.worstCondition;
  const hasSpeedForUnknownCondition = routeResult.roadConditionSegments.some(
    segment => segment.condition === 'unknown' && Boolean(segment.speedMetersPerSecond)
  );

  switch (condition) {
    case 'closed':
      return 'Road closure';
    case 'incident':
      return 'Incident reported';
    case 'severe':
      return 'Severe traffic';
    case 'heavy':
      return 'Heavy traffic';
    case 'moderate':
      return 'Moderate traffic';
    case 'low':
      return 'Low traffic';
    default:
      return hasSpeedForUnknownCondition ? 'Traffic data limited' : 'Traffic data unavailable';
  }
};

const getDangerZoneFocusCoordinate = (zone: DangerZoneRecord): [number, number] | null => {
  if (zone.center && typeof zone.center.lng === 'number' && typeof zone.center.lat === 'number') {
    return [zone.center.lng, zone.center.lat];
  }

  if (zone.geojson?.type === 'LineString' && zone.geojson.coordinates.length > 0) {
    const totals = zone.geojson.coordinates.reduce(
      (acc, coordinate) => ({ lng: acc.lng + coordinate[0], lat: acc.lat + coordinate[1] }),
      { lng: 0, lat: 0 }
    );
    return [totals.lng / zone.geojson.coordinates.length, totals.lat / zone.geojson.coordinates.length];
  }

  if (zone.geojson?.type === 'Polygon' && zone.geojson.coordinates[0]?.length) {
    const ring = zone.geojson.coordinates[0];
    const totals = ring.reduce(
      (acc, coordinate) => ({ lng: acc.lng + coordinate[0], lat: acc.lat + coordinate[1] }),
      { lng: 0, lat: 0 }
    );
    return [totals.lng / ring.length, totals.lat / ring.length];
  }

  return null;
};

const EARTH_RADIUS_METERS = 6_371_008.8;
const ROUTE_STALE_MS = 5 * 60 * 1000;
const ROUTE_REFRESH_DISTANCE_METERS = 100;

const haversineDistanceMeters = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
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

export const Evacuation = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ dangerZoneId?: string | string[] }>();
  const requestedDangerZoneId = Array.isArray(params.dangerZoneId) ? params.dangerZoneId[0] : params.dangerZoneId;
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[] | null>(null);
  const [dangerZones, setDangerZones] = useState<DangerZoneRecord[]>([]);
  const [hasLoadedDangerZones, setHasLoadedDangerZones] = useState(false);
  const [focusedDangerZoneId, setFocusedDangerZoneId] = useState<string | null>(null);
  const [dangerZoneNotice, setDangerZoneNotice] = useState<string | null>(null);
  const [mapFocusCoordinate, setMapFocusCoordinate] = useState<[number, number] | undefined>(undefined);
  const [mapFocusKey, setMapFocusKey] = useState<string | number | undefined>(undefined);
  const [routeResult, setRouteResult] = useState<BestEvacuationRouteResponse | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeWarnings, setRouteWarnings] = useState<string[]>([]);
  const [selectedRouteCenterId, setSelectedRouteCenterId] = useState<string | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [travelMode, setTravelMode] = useState<EvacuationTravelMode>('driving');
  const [routeStartedAt, setRouteStartedAt] = useState<number | null>(null);
  const [routeOrigin, setRouteOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [shouldRefreshRoute, setShouldRefreshRoute] = useState(false);
  const dangerZoneBboxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDangerZoneBboxKey = useRef<string>('');
  const savedLocations = useSavedLocationsStore(state => state.savedLocations);
  const clientId = useUserData(state => state.userData.clientId);

  const loadDangerZones = useCallback(
    async (bbox?: [number, number, number, number]) => {
      if (!clientId) {
        setDangerZones([]);
        return;
      }

      try {
        setHasLoadedDangerZones(false);
        setDangerZones(await fetchPublicDangerZones(clientId, { bbox, limit: bbox ? 500 : undefined }));
      } catch (error) {
        console.error('Error fetching danger zones:', error);
        if (bbox) {
          try {
            setDangerZones(await fetchPublicDangerZones(clientId));
            return;
          } catch (fallbackError) {
            console.error('Error fetching danger-zone fallback:', fallbackError);
          }
        }
        setDangerZones([]);
        setDangerZoneNotice('Danger-zone data is unavailable right now.');
      } finally {
        setHasLoadedDangerZones(true);
      }
    },
    [clientId]
  );

  useEffect(() => {
    const loadData = async () => {
      // 1. Load from cache first
      try {
        const cached = await storageHelpers.getData<EvacuationCenter[]>(STORAGE_KEYS.EVACUATION_CENTERS);
        if (cached) {
          setEvacuationCenters(cached);
        }
      } catch (e) {
        console.error('Error loading cached evacuation centers', e);
      }

      // 2. Fetch fresh data
      try {
        const response = await axios.get<EvacuationCenter[]>(API_ROUTES.EVACUATION.GET_CENTERS, {
          params: clientId ? { clientId } : undefined,
        });
        if (response.data) {
          setEvacuationCenters(response.data);
          // 3. Update cache
          await storageHelpers.setData(STORAGE_KEYS.EVACUATION_CENTERS, response.data);
        }
      } catch (error) {
        console.error('Error fetching evacuation centers:', error);
      }

      await loadDangerZones();
    };

    loadData();
  }, [clientId, loadDangerZones]);

  useEffect(() => {
    if (!requestedDangerZoneId || !hasLoadedDangerZones) return;

    const zone = dangerZones.find(item => item.id === requestedDangerZoneId);
    if (!zone) {
      setFocusedDangerZoneId(null);
      setDangerZoneNotice('This danger zone is no longer active.');
      return;
    }

    setDangerZoneNotice(null);
    setFocusedDangerZoneId(zone.id);
    const coordinate = getDangerZoneFocusCoordinate(zone);
    if (coordinate) {
      setMapFocusCoordinate(coordinate);
      setMapFocusKey(`danger-zone-${zone.id}-${Date.now()}`);
    }
  }, [dangerZones, hasLoadedDangerZones, requestedDangerZoneId]);

  const clearRoute = useCallback(() => {
    setRouteResult(null);
    setRouteError(null);
    setRouteWarnings([]);
    setSelectedRouteCenterId(null);
    setRouteStartedAt(null);
    setRouteOrigin(null);
    setShouldRefreshRoute(false);
  }, []);

  const requestRoute = useCallback(
    async (targetCenter?: EvacuationCenter) => {
      if (!clientId) {
        setRouteError('Your profile is missing an LGU client assignment.');
        setRouteResult(null);
        setRouteWarnings([]);
        return;
      }

      setIsRouteLoading(true);
      setRouteError(null);
      setRouteWarnings([]);
      setSelectedRouteCenterId(targetCenter?.id ?? null);

      try {
        const currentPosition = await getCurrentPositionOnce();
        if (!currentPosition) {
          throw new Error('Unable to get your current location.');
        }

        const [lng, lat] = currentPosition;
        const origin = { lat, lng };
        const result = await requestBestEvacuationRoute({
          clientId,
          origin,
          targetCenterId: targetCenter?.id,
          travelMode,
        });

        setRouteResult(result);
        setRouteWarnings(result.warnings ?? []);
        setSelectedRouteCenterId(result.selectedCenter.id);
        setRouteStartedAt(Date.now());
        setRouteOrigin(origin);
        setShouldRefreshRoute(false);
      } catch (error) {
        setRouteResult(null);
        setRouteError(getRouteErrorMessage(error));
        setRouteWarnings([]);
      } finally {
        setIsRouteLoading(false);
      }
    },
    [clientId, travelMode]
  );

  useEffect(() => {
    if (!routeResult || !routeOrigin) return;
    const interval = setInterval(async () => {
      if (routeStartedAt && Date.now() - routeStartedAt > ROUTE_STALE_MS) {
        setShouldRefreshRoute(true);
      }

      try {
        const currentPosition = await getCurrentPositionOnce();
        if (!currentPosition) return;
        const [lng, lat] = currentPosition;
        if (haversineDistanceMeters(routeOrigin, { lat, lng }) >= ROUTE_REFRESH_DISTANCE_METERS) {
          setShouldRefreshRoute(true);
        }
      } catch {
        // Location refresh checks should not interrupt the visible route.
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [routeOrigin, routeResult, routeStartedAt]);

  const handleVisibleBoundsChange = useCallback(
    (bbox: [number, number, number, number]) => {
      const key = bbox.map(value => value.toFixed(3)).join(',');
      if (key === lastDangerZoneBboxKey.current) return;
      lastDangerZoneBboxKey.current = key;
      if (dangerZoneBboxTimer.current) clearTimeout(dangerZoneBboxTimer.current);
      dangerZoneBboxTimer.current = setTimeout(() => {
        void loadDangerZones(bbox);
      }, 700);
    },
    [loadDangerZones]
  );

  const handleTravelModeChange = useCallback(
    (mode: EvacuationTravelMode) => {
      setTravelMode(mode);
      clearRoute();
    },
    [clearRoute]
  );

  return (
    <Body
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <MapView
        showButtons={true}
        showStyleSelector={true}
        showEvacuationLegend={true}
        data={evacuationCenters ?? undefined}
        dangerZones={dangerZones}
        routeGeoJson={routeResult?.route.geometry ?? null}
        routeConditionSegments={routeResult?.roadConditionSegments ?? []}
        focusedDangerZoneId={focusedDangerZoneId}
        selectedRouteCenterId={selectedRouteCenterId}
        travelMode={travelMode}
        onTravelModeChange={handleTravelModeChange}
        onRequestBestRoute={() => void requestRoute()}
        onRequestRouteToCenter={center => void requestRoute(center)}
        isRouteLoading={isRouteLoading}
        routeWarnings={routeWarnings}
        routeError={routeError}
        showRouteRefresh={shouldRefreshRoute}
        onRefreshRoute={() => void requestRoute()}
        mapNotice={dangerZoneNotice}
        onDismissMapNotice={() => setDangerZoneNotice(null)}
        onVisibleBoundsChange={handleVisibleBoundsChange}
        routeSummary={
          routeResult
            ? {
                selectedCenterName: routeResult.selectedCenter.name,
                distanceMeters: routeResult.route.distanceMeters,
                durationSeconds: routeResult.route.durationSeconds,
                durationTypicalSeconds: routeResult.route.durationTypicalSeconds,
                provider: getRouteProviderLabel(routeResult),
                travelMode: routeResult.travelMode,
                roadConditionLabel: routeResult.roadConditionSummary.available
                  ? getRoadConditionLabel(routeResult)
                  : 'Unavailable',
              }
            : null
        }
        onClearRoute={clearRoute}
        centerCoordinate={mapFocusCoordinate}
        cameraTriggerKey={mapFocusKey}
        savedLocations={savedLocations}
      />
    </Body>
  );
};

export default Evacuation;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
});
