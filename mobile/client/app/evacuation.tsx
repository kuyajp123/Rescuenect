import Body from '@/components/ui/layout/Body';
import { MapView } from '@/components/ui/map/MapView';
import type { FeatureCollection, GeoJsonProperties, Point } from 'geojson';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const testMarkers: FeatureCollection<Point, GeoJsonProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [120.9794, 14.5995], // Manila
      },
      properties: {},
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [121.0437, 14.676], // Quezon City
      },
      properties: {},
    },
  ],
};

export const evacuation = () => {
  const insets = useSafeAreaInsets();
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
      <MapView showButtons={true} showStyleSelector={true} />
    </Body>
  );
};

export default evacuation;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
  map: { flex: 1 },
});
