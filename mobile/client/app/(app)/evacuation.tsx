import Body from '@/components/ui/layout/Body';
import { MapView } from '@/components/ui/map/MapView';
import { API_ROUTES } from '@/config/endpoints';
import { EvacuationCenter } from '@/types/components';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STORAGE_KEYS } from '@/config/asyncStorage';
import { storageHelpers } from '@/helper/storage';
import { useSavedLocationsStore } from '@/store/useSavedLocationsStore';

export const evacuation = () => {
  const insets = useSafeAreaInsets();
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[] | null>(null);
  const savedLocations = useSavedLocationsStore(state => state.savedLocations);

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
        const response = await axios.get<EvacuationCenter[]>(API_ROUTES.EVACUATION.GET_CENTERS);
        if (response.data) {
          setEvacuationCenters(response.data);
          // 3. Update cache
          await storageHelpers.setData(STORAGE_KEYS.EVACUATION_CENTERS, response.data);
        }
      } catch (error) {
        console.error('Error fetching evacuation centers:', error);
      }
    };

    loadData();
  }, []);

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
        savedLocations={savedLocations}
      />
    </Body>
  );
};

export default evacuation;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
});
