import { Body } from '@/components/ui/layout/Body';
import { MapView } from '@/components/ui/map/MapView';
import { API_ROUTES } from '@/config/endpoints';
import { EvacuationCenter } from '@/types/components';
import { DangerZoneRecord } from '@/types/dangerZone';
import axios, { isAxiosError } from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STORAGE_KEYS } from '@/config/asyncStorage';
import { getCurrentPositionOnce } from '@/helper/commonHelpers';
import { storageHelpers } from '@/helper/storage';
import { requestBestEvacuationRoute } from '@/services/evacuationRouteService';
import { useSavedLocationsStore } from '@/store/useSavedLocationsStore';
import { useUserData } from '@/store/useBackendResponse';
import { fetchPublicDangerZones } from '@/services/dangerZoneService';
import { BestEvacuationRouteResponse } from '@/types/evacuationRoute';

const getRouteErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
  }
  return error instanceof Error ? error.message : 'Unable to compute evacuation route.';
};

export const Evacuation = () => {
  const insets = useSafeAreaInsets();
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[] | null>(null);
  const [dangerZones, setDangerZones] = useState<DangerZoneRecord[]>([]);
  const [routeResult, setRouteResult] = useState<BestEvacuationRouteResponse | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeWarnings, setRouteWarnings] = useState<string[]>([]);
  const [selectedRouteCenterId, setSelectedRouteCenterId] = useState<string | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const savedLocations = useSavedLocationsStore(state => state.savedLocations);
  const clientId = useUserData(state => state.userData.clientId);

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

      try {
        if (clientId) {
          setDangerZones(await fetchPublicDangerZones(clientId));
        } else {
          setDangerZones([]);
        }
      } catch (error) {
        console.error('Error fetching danger zones:', error);
      }
    };

    loadData();
  }, [clientId]);

  const clearRoute = useCallback(() => {
    setRouteResult(null);
    setRouteError(null);
    setRouteWarnings([]);
    setSelectedRouteCenterId(null);
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
        const result = await requestBestEvacuationRoute({
          clientId,
          origin: { lat, lng },
          targetCenterId: targetCenter?.id,
        });

        setRouteResult(result);
        setRouteWarnings(result.warnings ?? []);
        setSelectedRouteCenterId(result.selectedCenter.id);
      } catch (error) {
        setRouteResult(null);
        setRouteError(getRouteErrorMessage(error));
        setRouteWarnings([]);
      } finally {
        setIsRouteLoading(false);
      }
    },
    [clientId]
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
        selectedRouteCenterId={selectedRouteCenterId}
        onRequestBestRoute={() => void requestRoute()}
        onRequestRouteToCenter={center => void requestRoute(center)}
        isRouteLoading={isRouteLoading}
        routeWarnings={routeWarnings}
        routeError={routeError}
        routeSummary={
          routeResult
            ? {
                selectedCenterName: routeResult.selectedCenter.name,
                distanceMeters: routeResult.route.distanceMeters,
                durationSeconds: routeResult.route.durationSeconds,
                provider: routeResult.route.provider,
              }
            : null
        }
        onClearRoute={clearRoute}
        savedLocations={savedLocations}
      />
    </Body>
  );
};

export default Evacuation;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
});
