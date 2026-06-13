import { Body } from '@/components/ui/layout/Body';
import { MapView } from '@/components/ui/map/MapView';
import { API_ROUTES } from '@/config/endpoints';
import { EvacuationCenter } from '@/types/components';
import { DangerZoneRecord } from '@/types/dangerZone';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STORAGE_KEYS } from '@/config/asyncStorage';
import { storageHelpers } from '@/helper/storage';
import { useSavedLocationsStore } from '@/store/useSavedLocationsStore';
import { useUserData } from '@/store/useBackendResponse';
import { fetchPublicDangerZones } from '@/services/dangerZoneService';

export const Evacuation = () => {
  const insets = useSafeAreaInsets();
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[] | null>(null);
  const [dangerZones, setDangerZones] = useState<DangerZoneRecord[]>([]);
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
        savedLocations={savedLocations}
      />
    </Body>
  );
};

export default Evacuation;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
});
