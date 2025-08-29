import { Text } from '@/components/ui/text';
import MapboxGL from "@rnmapbox/maps";
import React from "react";
import { StyleSheet, View } from 'react-native';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API_TOKEN!);

export const createStatus = () => {

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map}>
        <MapboxGL.Camera zoomLevel={12} centerCoordinate={[120.98, 14.6]} />
      </MapboxGL.MapView>

      {/* Floating Section */}
      <View style={styles.floatingBox}>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>Floating Section</Text>
        <Text>Some info or actions here</Text>
      </View>
    </View>
  );
}

export default createStatus

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  floatingBox: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "black",
    padding: 15,
    borderRadius: 12,
    elevation: 5, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
});