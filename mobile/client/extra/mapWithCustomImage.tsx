import Mapbox, { Images, ShapeSource, SymbolLayer } from '@rnmapbox/maps';
import type { FeatureCollection, GeoJsonProperties, Point } from 'geojson';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export const notification = () => {
  // Sample test marker coordinates

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

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map}>
        <Mapbox.Camera zoomLevel={10} centerCoordinate={[120.9794, 14.5995]} />

        {/* Register your icon asset here */}
        <Images
          images={{
            pin: require('@/assets/images/marker/marker-icon-blue.png'), // <-- use a PNG image instead of SVG
          }}
        />

        {/* Marker source */}
        <ShapeSource id="marker-source" shape={testMarkers}>
          <SymbolLayer
            id="marker-layer"
            style={{
              iconImage: 'pin', // matches the key from <Images>
              iconSize: 0.5, // adjust size here
              iconAllowOverlap: true,
              iconIgnorePlacement: true,
            }}
          />
        </ShapeSource>
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});

export default notification;
