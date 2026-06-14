import { Body } from '@/components/ui/layout/Body';
import { MapView } from '@/components/ui/map/MapView';
import { API_ROUTES } from '@/config/endpoints';
import { EvacuationCenter } from '@/types/components';
import { DangerZoneRecord } from '@/types/dangerZone';
import axios, { isAxiosError } from 'axios';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STORAGE_KEYS } from '@/config/asyncStorage';
import { getCurrentPositionOnce, requestLocationPermission } from '@/helper/commonHelpers';
import { storageHelpers } from '@/helper/storage';
import { requestBestEvacuationRoute } from '@/services/evacuationRouteService';
import { useSavedLocationsStore } from '@/store/useSavedLocationsStore';
import { useUserData } from '@/store/useBackendResponse';
import { fetchPublicDangerZones } from '@/services/dangerZoneService';
import { BestEvacuationRouteResponse, EvacuationTravelMode, RouteLineString } from '@/types/evacuationRoute';

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
const NAVIGATION_FOLLOW_DELAY_MS = 2500;
const OFF_ROUTE_REROUTE_DISTANCE_METERS = 45;
const AUTO_REROUTE_COOLDOWN_MS = 30 * 1000;
const MAX_REROUTE_ACCURACY_METERS = 75;
const MIN_LIVE_LOCATION_DELTA_METERS = 0.5;

type LiveRouteLocation = {
  lat: number;
  lng: number;
  heading?: number;
  course?: number;
  speed?: number;
  accuracy?: number;
};

type RouteProgress = {
  traveled: RouteLineString | null;
  remaining: RouteLineString | null;
  distanceFromRouteMeters: number;
  progressRatio: number;
};

type RouteRequestOptions = {
  targetCenter?: EvacuationCenter;
  targetCenterId?: string | null;
  origin?: { lat: number; lng: number } | null;
  silent?: boolean;
};

const getRouteCameraBounds = (route: RouteLineString | null | undefined, bottomInset: number) => {
  const coordinates =
    route?.coordinates.filter(
      coordinate =>
        Array.isArray(coordinate) &&
        coordinate.length >= 2 &&
        Number.isFinite(coordinate[0]) &&
        Number.isFinite(coordinate[1])
    ) ?? [];

  if (coordinates.length === 0) return undefined;

  const lngValues = coordinates.map(coordinate => coordinate[0]);
  const latValues = coordinates.map(coordinate => coordinate[1]);
  const minLng = Math.min(...lngValues);
  const maxLng = Math.max(...lngValues);
  const minLat = Math.min(...latValues);
  const maxLat = Math.max(...latValues);
  const lngPadding = Math.max((maxLng - minLng) * 0.08, 0.001);
  const latPadding = Math.max((maxLat - minLat) * 0.08, 0.001);

  return {
    ne: [maxLng + lngPadding, maxLat + latPadding] as [number, number],
    sw: [minLng - lngPadding, minLat - latPadding] as [number, number],
    paddingTop: 150,
    paddingBottom: 320 + bottomInset,
    paddingLeft: 56,
    paddingRight: 56,
  };
};

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

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const getFiniteLocationNumber = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const toPlanarPoint = (coordinate: [number, number], referenceLat: number) => {
  const latScale = 111_320;
  const lngScale = Math.max(Math.abs(latScale * Math.cos((referenceLat * Math.PI) / 180)), 0.000001);
  return {
    x: coordinate[0] * lngScale,
    y: coordinate[1] * latScale,
  };
};

const buildRouteLineString = (coordinates: [number, number][]): RouteLineString | null => {
  const normalized = coordinates.reduce<[number, number][]>((acc, coordinate) => {
    const [lng, lat] = coordinate;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return acc;
    const previous = acc[acc.length - 1];
    if (previous && Math.abs(previous[0] - lng) < 1e-9 && Math.abs(previous[1] - lat) < 1e-9) {
      return acc;
    }
    acc.push([lng, lat]);
    return acc;
  }, []);

  return normalized.length >= 2
    ? {
        type: 'LineString',
        coordinates: normalized,
      }
    : null;
};

const getRouteProgress = (
  route: RouteLineString | null | undefined,
  location: LiveRouteLocation | null
): RouteProgress | null => {
  const coordinates =
    route?.coordinates.filter(
      coordinate =>
        Array.isArray(coordinate) &&
        coordinate.length >= 2 &&
        Number.isFinite(coordinate[0]) &&
        Number.isFinite(coordinate[1])
    ) ?? [];

  if (!location || coordinates.length < 2) return null;

  const userCoordinate: [number, number] = [location.lng, location.lat];
  const userPoint = toPlanarPoint(userCoordinate, location.lat);
  let totalDistanceMeters = 0;
  let cumulativeBeforeSegmentMeters = 0;
  let nearestDistanceMeters = Number.POSITIVE_INFINITY;
  let nearestSegmentIndex = 0;
  let nearestSegmentProgress = 0;
  let nearestCumulativeMeters = 0;
  let projectedCoordinate: [number, number] | null = null;

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const start = coordinates[index];
    const end = coordinates[index + 1];
    const segmentDistanceMeters = haversineDistanceMeters(
      { lat: start[1], lng: start[0] },
      { lat: end[1], lng: end[0] }
    );
    const startPoint = toPlanarPoint(start, location.lat);
    const endPoint = toPlanarPoint(end, location.lat);
    const segmentX = endPoint.x - startPoint.x;
    const segmentY = endPoint.y - startPoint.y;
    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

    if (segmentLengthSquared > 0) {
      const progress = clamp01(
        ((userPoint.x - startPoint.x) * segmentX + (userPoint.y - startPoint.y) * segmentY) /
          segmentLengthSquared
      );
      const projected: [number, number] = [
        start[0] + (end[0] - start[0]) * progress,
        start[1] + (end[1] - start[1]) * progress,
      ];
      const distanceMeters = haversineDistanceMeters(location, { lat: projected[1], lng: projected[0] });

      if (distanceMeters < nearestDistanceMeters) {
        nearestDistanceMeters = distanceMeters;
        nearestSegmentIndex = index;
        nearestSegmentProgress = progress;
        nearestCumulativeMeters = cumulativeBeforeSegmentMeters + segmentDistanceMeters * progress;
        projectedCoordinate = projected;
      }
    }

    cumulativeBeforeSegmentMeters += segmentDistanceMeters;
    totalDistanceMeters += segmentDistanceMeters;
  }

  if (!projectedCoordinate) return null;

  return {
    traveled: buildRouteLineString([...coordinates.slice(0, nearestSegmentIndex + 1), projectedCoordinate]),
    remaining: buildRouteLineString([projectedCoordinate, ...coordinates.slice(nearestSegmentIndex + 1)]),
    distanceFromRouteMeters: nearestDistanceMeters,
    progressRatio: totalDistanceMeters > 0 ? clamp01(nearestCumulativeMeters / totalDistanceMeters) : nearestSegmentProgress,
  };
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
  const [liveUserLocation, setLiveUserLocation] = useState<LiveRouteLocation | null>(null);
  const [cameraMode, setCameraMode] = useState<'route-fit' | 'following' | 'free'>('free');
  const [routeFitKey, setRouteFitKey] = useState<string | null>(null);
  const [routeRecenterKey, setRouteRecenterKey] = useState(0);
  const dangerZoneBboxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDangerZoneBboxKey = useRef<string>('');
  const navigationFollowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoRerouteAt = useRef(0);
  const isAutoRerouting = useRef(false);
  const savedLocations = useSavedLocationsStore(state => state.savedLocations);
  const clientId = useUserData(state => state.userData.clientId);
  const routeCameraBounds = useMemo(
    () => getRouteCameraBounds(routeResult?.route.geometry, insets.bottom),
    [insets.bottom, routeResult?.route.geometry]
  );
  const routeProgress = useMemo(
    () => getRouteProgress(routeResult?.route.geometry, liveUserLocation),
    [liveUserLocation, routeResult?.route.geometry]
  );
  const hasActiveRoute = Boolean(routeResult);
  const liveUserCoordinate = liveUserLocation
    ? ([liveUserLocation.lng, liveUserLocation.lat] as [number, number])
    : undefined;
  const activeRouteCameraBounds = routeResult && cameraMode === 'route-fit' ? routeCameraBounds : undefined;
  const activeMapFocusCoordinate = routeResult 
    ? (cameraMode === 'following' ? liveUserCoordinate : undefined) 
    : mapFocusCoordinate;
  const activeCameraTriggerKey = routeResult
    ? cameraMode === 'following'
      ? `navigation-follow-${routeResult.requestId}-${routeRecenterKey}`
      : cameraMode === 'route-fit'
      ? `route-fit-${routeResult.requestId}`
      : undefined
    : mapFocusKey;
  const hasLiveUserLocation = Boolean(liveUserLocation);

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

  useEffect(() => {
    if (navigationFollowTimer.current) {
      clearTimeout(navigationFollowTimer.current);
      navigationFollowTimer.current = null;
    }

    if (!routeResult || routeFitKey !== routeResult.requestId) return;

    setCameraMode('route-fit');
    navigationFollowTimer.current = setTimeout(() => {
      setCameraMode('free');
      navigationFollowTimer.current = null;
    }, NAVIGATION_FOLLOW_DELAY_MS);

    return () => {
      if (navigationFollowTimer.current) {
        clearTimeout(navigationFollowTimer.current);
        navigationFollowTimer.current = null;
      }
    };
  }, [routeFitKey, routeResult]);

  const clearRoute = useCallback(() => {
    if (navigationFollowTimer.current) {
      clearTimeout(navigationFollowTimer.current);
      navigationFollowTimer.current = null;
    }

    setRouteResult(null);
    setRouteError(null);
    setRouteWarnings([]);
    setSelectedRouteCenterId(null);
    setRouteStartedAt(null);
    setRouteOrigin(null);
    setShouldRefreshRoute(false);
    setLiveUserLocation(null);
    setCameraMode('free');
    setRouteFitKey(null);
    setRouteRecenterKey(0);
    lastAutoRerouteAt.current = 0;
    isAutoRerouting.current = false;
  }, []);

  const requestRoute = useCallback(
    async (options: RouteRequestOptions = {}) => {
      const isSilent = Boolean(options.silent);
      const targetCenterId = options.targetCenter?.id ?? options.targetCenterId ?? undefined;

      if (!clientId) {
        setRouteError('Your profile is missing an LGU client assignment.');
        if (!isSilent) {
          setRouteResult(null);
          setRouteWarnings([]);
        }
        return;
      }

      if (!isSilent) {
        setIsRouteLoading(true);
        setRouteWarnings([]);
        setSelectedRouteCenterId(targetCenterId ?? null);
      }
      setRouteError(null);

      try {
        let origin = options.origin;

        if (!origin || !Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) {
          const currentPosition = await getCurrentPositionOnce();
          if (!currentPosition) {
            throw new Error('Unable to get your current location.');
          }

          const [lng, lat] = currentPosition;
          origin = { lat, lng };
        }

        const routeOrigin = { lat: origin.lat, lng: origin.lng };
        const result = await requestBestEvacuationRoute({
          clientId,
          origin: routeOrigin,
          targetCenterId,
          travelMode,
        });

        setRouteResult(result);
        setRouteWarnings(result.warnings ?? []);
        setSelectedRouteCenterId(result.selectedCenter.id);
        setRouteStartedAt(Date.now());
        setRouteOrigin(routeOrigin);
        setLiveUserLocation(routeOrigin);
        setShouldRefreshRoute(false);

        if (isSilent) {
          setCameraMode('following');
        } else {
          setCameraMode('route-fit');
          setRouteFitKey(result.requestId);
        }
      } catch (error) {
        setRouteError(getRouteErrorMessage(error));
        setRouteWarnings([]);
        if (isSilent) {
          setShouldRefreshRoute(true);
        } else {
          setRouteResult(null);
          setRouteFitKey(null);
          setCameraMode('free');
        }
      } finally {
        if (!isSilent) {
          setIsRouteLoading(false);
        }
      }
    },
    [clientId, travelMode]
  );

  const handleUserLocationUpdate = useCallback((location: LiveRouteLocation) => {
    setLiveUserLocation(previous => {
      if (previous && haversineDistanceMeters(previous, location) < MIN_LIVE_LOCATION_DELTA_METERS) {
        return previous;
      }

      return location;
    });
  }, []);

  useEffect(() => {
    if (!hasActiveRoute) return;

    let subscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    const startRouteLocationTracking = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission || !isMounted) return;

      try {
        const nextSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 1,
            mayShowUserSettingsDialog: true,
          },
          position => {
            handleUserLocationUpdate({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              heading: getFiniteLocationNumber(position.coords.heading),
              speed: getFiniteLocationNumber(position.coords.speed),
              accuracy: getFiniteLocationNumber(position.coords.accuracy),
            });
          }
        );

        if (!isMounted) {
          nextSubscription.remove();
          return;
        }

        subscription = nextSubscription;
      } catch (error) {
        console.warn('Error watching evacuation route location:', error);
      }
    };

    void startRouteLocationTracking();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [handleUserLocationUpdate, hasActiveRoute]);

  const handleToggleFollow = useCallback(() => {
    if (navigationFollowTimer.current) {
      clearTimeout(navigationFollowTimer.current);
      navigationFollowTimer.current = null;
    }

    setCameraMode(prev => {
      if (prev === 'following') {
        return 'free';
      }
      setRouteRecenterKey(k => k + 1);
      return 'following';
    });

    if (cameraMode !== 'following' && !liveUserLocation) {
      void getCurrentPositionOnce()
        .then(currentPosition => {
          if (!currentPosition) return;
          const [lng, lat] = currentPosition;
          setLiveUserLocation({ lat, lng });
          setRouteRecenterKey(previous => previous + 1);
        })
        .catch(() => {
          // The native location puck will continue trying to provide a follow target.
        });
    }
  }, [cameraMode, liveUserLocation]);

  const handleMapInteraction = useCallback(() => {
    // If they are locked in follow mode, we don't break out of it automatically.
    // They must toggle it off to pan.
  }, []);

  useEffect(() => {
    if (!routeResult || !routeProgress || !liveUserLocation) return;

    if (routeProgress.distanceFromRouteMeters < OFF_ROUTE_REROUTE_DISTANCE_METERS) return;

    setShouldRefreshRoute(true);

    if (liveUserLocation.accuracy && liveUserLocation.accuracy > MAX_REROUTE_ACCURACY_METERS) return;
    if (isRouteLoading || isAutoRerouting.current) return;

    const now = Date.now();
    if (now - lastAutoRerouteAt.current < AUTO_REROUTE_COOLDOWN_MS) return;

    isAutoRerouting.current = true;
    lastAutoRerouteAt.current = now;
    void requestRoute({
      targetCenterId: selectedRouteCenterId ?? routeResult.selectedCenter.id,
      origin: liveUserLocation,
      silent: true,
    }).finally(() => {
      isAutoRerouting.current = false;
    });
  }, [
    isRouteLoading,
    liveUserLocation,
    requestRoute,
    routeProgress,
    routeResult,
    selectedRouteCenterId,
  ]);

  useEffect(() => {
    if (!routeResult || !routeOrigin) return;
    const interval = setInterval(async () => {
      if (routeStartedAt && Date.now() - routeStartedAt > ROUTE_STALE_MS) {
        setShouldRefreshRoute(true);
      }

      if (hasLiveUserLocation) return;

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
  }, [hasLiveUserLocation, routeOrigin, routeResult, routeStartedAt]);

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
        showMapOnlyToggle={true}
        data={evacuationCenters ?? undefined}
        dangerZones={dangerZones}
        routeGeoJson={routeResult?.route.geometry ?? null}
        routeRemainingGeoJson={routeProgress?.remaining ?? null}
        routeTraveledGeoJson={routeProgress?.traveled ?? null}
        routeConditionSegments={routeResult?.roadConditionSegments ?? []}
        focusedDangerZoneId={focusedDangerZoneId}
        selectedRouteCenterId={selectedRouteCenterId}
        travelMode={travelMode}
        onTravelModeChange={handleTravelModeChange}
        onRequestBestRoute={() => void requestRoute()}
        onRequestRouteToCenter={center => void requestRoute({ targetCenter: center })}
        isRouteLoading={isRouteLoading}
        routeWarnings={routeWarnings}
        routeError={routeError}
        showRouteRefresh={shouldRefreshRoute}
        onRefreshRoute={() =>
          void requestRoute({
            targetCenterId: selectedRouteCenterId ?? routeResult?.selectedCenter.id,
            origin: liveUserLocation,
          })
        }
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
        isFollowingUser={cameraMode === 'following'}
        isFreePanMode={hasActiveRoute && cameraMode === 'free'}
        onToggleFollow={routeResult ? handleToggleFollow : undefined}
        onUserInteraction={handleMapInteraction}
        cameraBounds={activeRouteCameraBounds}
        centerCoordinate={activeMapFocusCoordinate}
        cameraTriggerKey={activeCameraTriggerKey}
        recenterCoordinate={routeResult ? liveUserCoordinate : undefined}
        recenterTriggerKey={routeResult && routeRecenterKey > 0 ? routeRecenterKey : undefined}
        recenterZoomLevel={16}
        showUserLocation={Boolean(routeResult)}
        savedLocations={savedLocations}
      />
    </Body>
  );
};

export default Evacuation;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
});
