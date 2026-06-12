import { MapView } from '@/components/ui/map/MapView';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { DangerZoneCoordinates, DangerZoneGeometryType } from '@/types/dangerZone';
import MapboxGL, { FillLayer, ShapeSource } from '@rnmapbox/maps';
import type { FeatureCollection } from 'geojson';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

const EARTH_RADIUS_KM = 6371.0088;
const CIRCLE_SEGMENTS = 80;

const createCirclePolygon = (center: DangerZoneCoordinates, radiusMeters: number): FeatureCollection => {
  const centerLatitude = (center.lat * Math.PI) / 180;
  const centerLongitude = (center.lng * Math.PI) / 180;
  const angularDistance = radiusMeters / 1000 / EARTH_RADIUS_KM;
  const coordinates: [number, number][] = [];

  for (let index = 0; index <= CIRCLE_SEGMENTS; index++) {
    const bearing = (index / CIRCLE_SEGMENTS) * 2 * Math.PI;
    const pointLatitude = Math.asin(
      Math.sin(centerLatitude) * Math.cos(angularDistance) +
        Math.cos(centerLatitude) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const pointLongitude =
      centerLongitude +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(centerLatitude),
        Math.cos(angularDistance) - Math.sin(centerLatitude) * Math.sin(pointLatitude)
      );

    coordinates.push([(((pointLongitude * 180) / Math.PI + 540) % 360) - 180, (pointLatitude * 180) / Math.PI]);
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
        properties: {},
      },
    ],
  };
};

const extractCoordinates = (event: any): DangerZoneCoordinates | null => {
  const coordinates =
    event?.geometry?.coordinates ??
    event?.coordinates ??
    (event?.nativeEvent?.coordinate
      ? [event.nativeEvent.coordinate.longitude, event.nativeEvent.coordinate.latitude]
      : null);

  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const lng = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

interface DangerZoneMapPickerProps {
  center: DangerZoneCoordinates;
  geometryType: DangerZoneGeometryType;
  radiusMeters?: number;
  onPick: (center: DangerZoneCoordinates) => void;
}

export const DangerZoneMapPicker = ({ center, geometryType, radiusMeters = 100, onPick }: DangerZoneMapPickerProps) => {
  const circleShape = useMemo(
    () => (geometryType === 'circle' && radiusMeters > 0 ? createCirclePolygon(center, radiusMeters) : null),
    [center, geometryType, radiusMeters]
  );

  return (
    <View style={styles.container}>
      <MapView
        showButtons={false}
        showStyleSelector={false}
        show3DBuildings={false}
        coords={center}
        centerCoordinate={[center.lng, center.lat]}
        zoomLevel={15}
        minZoomLevel={12}
        maxZoomLevel={18}
        compassViewMargins={{ x: 12, y: 12 }}
        handleMapPress={event => {
          const nextCenter = extractCoordinates(event);
          if (nextCenter) onPick(nextCenter);
        }}
      >
        {circleShape && (
          <ShapeSource id="danger-zone-preview-source" shape={circleShape}>
            <FillLayer
              id="danger-zone-preview-layer"
              style={{
                fillColor: Colors.semantic.error,
                fillOpacity: 0.22,
                fillOutlineColor: Colors.semantic.error,
              }}
            />
          </ShapeSource>
        )}
        <MapboxGL.PointAnnotation id="danger-zone-picked-center" coordinate={[center.lng, center.lat]}>
          <View collapsable={false} style={styles.marker} />
        </MapboxGL.PointAnnotation>
      </MapView>
      <View style={styles.hint}>
        <Text size="xs" style={{ color: '#fff' }}>
          Tap the map to place the danger zone
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
  },
  marker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: Colors.semantic.error,
  },
  hint: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
});
