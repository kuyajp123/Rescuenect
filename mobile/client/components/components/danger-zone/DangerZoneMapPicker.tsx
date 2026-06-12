import { MapView } from '@/components/ui/map/MapView';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { DangerZoneCoordinates, DangerZoneGeometryType } from '@/types/dangerZone';
import MapboxGL, { CircleLayer, FillLayer, ShapeSource, SymbolLayer } from '@rnmapbox/maps';
import type { FeatureCollection } from 'geojson';
import React, { useMemo, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const EARTH_RADIUS_KM = 6371.0088;
const CIRCLE_SEGMENTS = 80;
const MIN_RADIUS_METERS = 10;
const MAX_RADIUS_METERS = 10000;

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

const clampRadius = (radiusMeters: number) =>
  Math.max(MIN_RADIUS_METERS, Math.min(MAX_RADIUS_METERS, Math.round(radiusMeters)));

const formatRadiusLabel = (radiusMeters: number) =>
  radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(radiusMeters >= 10000 ? 0 : 1)}km` : `${radiusMeters}m`;

const getDistanceMeters = (from: DangerZoneCoordinates, to: DangerZoneCoordinates): number => {
  const fromLat = (from.lat * Math.PI) / 180;
  const toLat = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return EARTH_RADIUS_KM * 1000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getDestinationCoordinate = (
  center: DangerZoneCoordinates,
  radiusMeters: number,
  bearingDegrees: number
): DangerZoneCoordinates => {
  const bearing = (bearingDegrees * Math.PI) / 180;
  const centerLatitude = (center.lat * Math.PI) / 180;
  const centerLongitude = (center.lng * Math.PI) / 180;
  const angularDistance = radiusMeters / 1000 / EARTH_RADIUS_KM;

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

  return {
    lat: (pointLatitude * 180) / Math.PI,
    lng: (((pointLongitude * 180) / Math.PI + 540) % 360) - 180,
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

const createRadiusLabelShape = (coordinate: DangerZoneCoordinates, label: string): FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [coordinate.lng, coordinate.lat],
      },
      properties: { label },
    },
  ],
});

interface DangerZoneMapPickerProps {
  center: DangerZoneCoordinates;
  geometryType: DangerZoneGeometryType;
  radiusMeters?: number;
  cameraTriggerKey?: string | number;
  containerStyle?: StyleProp<ViewStyle>;
  onPick: (center: DangerZoneCoordinates) => void;
  onRadiusChange?: (radiusMeters: number) => void;
}

export const DangerZoneMapPicker = ({
  center,
  geometryType,
  radiusMeters = 100,
  cameraTriggerKey,
  containerStyle,
  onPick,
  onRadiusChange,
}: DangerZoneMapPickerProps) => {
  const [draggedRadiusHandle, setDraggedRadiusHandle] = useState<DangerZoneCoordinates | null>(null);
  const safeRadius = clampRadius(radiusMeters);
  const circleShape = useMemo(
    () => (geometryType === 'circle' && safeRadius > 0 ? createCirclePolygon(center, safeRadius) : null),
    [center, geometryType, safeRadius]
  );
  const radiusHandleCoordinate = useMemo(
    () => (geometryType === 'circle' ? getDestinationCoordinate(center, safeRadius, 90) : null),
    [center, geometryType, safeRadius]
  );
  const visibleRadiusHandleCoordinate = draggedRadiusHandle ?? radiusHandleCoordinate;
  const radiusLabelShape = useMemo(
    () =>
      geometryType === 'circle' && visibleRadiusHandleCoordinate
        ? createRadiusLabelShape(visibleRadiusHandleCoordinate, formatRadiusLabel(safeRadius))
        : null,
    [geometryType, safeRadius, visibleRadiusHandleCoordinate]
  );

  const handleCenterDrag = (event: any) => {
    const nextCenter = extractCoordinates(event);
    if (nextCenter) onPick(nextCenter);
  };

  const updateRadiusFromDrag = (event: any) => {
    const nextCoordinate = extractCoordinates(event);
    if (!nextCoordinate) return;
    setDraggedRadiusHandle(nextCoordinate);
    onRadiusChange?.(clampRadius(getDistanceMeters(center, nextCoordinate)));
  };

  const handleRadiusDragEnd = (event: any) => {
    updateRadiusFromDrag(event);
    setDraggedRadiusHandle(null);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <MapView
        showButtons={false}
        showStyleSelector={false}
        show3DBuildings={false}
        coords={center}
        centerCoordinate={[center.lng, center.lat]}
        cameraTriggerKey={cameraTriggerKey}
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
        {radiusLabelShape && (
          <ShapeSource id="danger-zone-radius-label-source" shape={radiusLabelShape}>
            <CircleLayer
              id="danger-zone-radius-label-bg"
              style={{
                circleRadius: 26,
                circleColor: '#F97316',
                circleOpacity: 0.96,
                circleStrokeColor: 'rgba(17, 24, 39, 0.85)',
                circleStrokeWidth: 3,
              }}
            />
            <SymbolLayer
              id="danger-zone-radius-label-text"
              style={{
                textField: ['get', 'label'],
                textSize: 12,
                textColor: '#FFFFFF',
                textHaloColor: 'rgba(17, 24, 39, 0.45)',
                textHaloWidth: 1,
                textAllowOverlap: true,
                textIgnorePlacement: true,
              }}
            />
          </ShapeSource>
        )}
        {visibleRadiusHandleCoordinate && (
          <MapboxGL.PointAnnotation
            id="danger-zone-radius-handle"
            coordinate={[visibleRadiusHandleCoordinate.lng, visibleRadiusHandleCoordinate.lat]}
            draggable
            onDrag={updateRadiusFromDrag}
            onDragEnd={handleRadiusDragEnd}
          >
            <View collapsable={false} style={styles.radiusDragTarget} />
          </MapboxGL.PointAnnotation>
        )}
        <MapboxGL.PointAnnotation
          id="danger-zone-picked-center"
          coordinate={[center.lng, center.lat]}
          draggable
          onDrag={handleCenterDrag}
          onDragEnd={handleCenterDrag}
        >
          <View collapsable={false} style={styles.marker} />
        </MapboxGL.PointAnnotation>
      </MapView>
      <View style={styles.hint}>
        <Text size="xs" style={{ color: '#fff' }}>
          {geometryType === 'circle'
            ? 'Tap or drag the pin. Drag the orange handle to resize the circle.'
            : 'Tap the map or drag the pin to place the danger zone.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  radiusDragTarget: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(249, 115, 22, 0.01)',
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
