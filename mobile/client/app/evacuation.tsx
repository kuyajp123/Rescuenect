import Body from '@/components/ui/layout/Body';
import { MapView } from '@/components/ui/map/MapView';
import { API_ROUTES } from '@/config/endpoints';
import { EvacuationCenter } from '@/types/components';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const evacuation = () => {
  const insets = useSafeAreaInsets();
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[] | null>(null);

  useEffect(() => {
    const fetchEvacuationCenters = async () => {
      try {
        const response = await axios.get<EvacuationCenter[]>(API_ROUTES.EVACUATION.GET_CENTERS);

        setEvacuationCenters(response.data);
        console.log('centers: ', JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.error('Error fetching evacuation centers:', error);
      }
    };
    fetchEvacuationCenters();
  }, []);

  useEffect(() => {
    console.log('evacuationCenters: ', JSON.stringify(evacuationCenters, null, 2));
  }, [evacuationCenters]);

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
      <MapView showButtons={true} showStyleSelector={true} data={evacuationCenters ?? undefined} />
    </Body>
  );
};

export default evacuation;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
});
