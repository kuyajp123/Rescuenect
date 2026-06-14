import { MapView } from '@/components/ui/map/MapView';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { DangerZoneCoordinates, DangerZoneGeometryType } from '@/types/dangerZone';
import MapboxGL, { CircleLayer, FillLayer, MarkerView, ShapeSource, SymbolLayer } from '@rnmapbox/maps';
import type { FeatureCollection } from 'geojson';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const EARTH_RADIUS_KM = 6371.0088;
const CIRCLE_SEGMENTS = 80;
const DRAG_CIRCLE_SEGMENTS = 36;
const MIN_RADIUS_METERS = 10;
const MAX_RADIUS_METERS = 10000;

const createCirclePolygon = (
  center: DangerZoneCoordinates,
  radiusMeters: number,
  segments: number = CIRCLE_SEGMENTS
): FeatureCollection => {
  const centerLatitude = (center.lat * Math.PI) / 180;
  const centerLongitude = (center.lng * Math.PI) / 180;
  const angularDistance = radiusMeters / 1000 / EARTH_RADIUS_KM;
  const coordinates: [number, number][] = [];

  for (let index = 0; index <= segments; index++) {
    const bearing = (index / segments) * 2 * Math.PI;
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

const createCenterHolderShape = (coordinate: DangerZoneCoordinates): FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [coordinate.lng, coordinate.lat],
      },
      properties: { label: '⋮⋮⋮⋮' },
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
  const [draggedRadiusMeters, setDraggedRadiusMeters] = useState<number | null>(null);
  const [draggedCenter, setDraggedCenter] = useState<DangerZoneCoordinates | null>(null);
  const [isDraggingCenter, setIsDraggingCenter] = useState(false);
  const [isDraggingRadius, setIsDraggingRadius] = useState(false);

  const latestCenterRef = useRef(center);
  const lastCameraTriggerKeyRef = useRef(cameraTriggerKey);

  const [cameraCenterCoordinate, setCameraCenterCoordinate] = useState<[number, number]>(() => [
    center.lng,
    center.lat,
  ]);

  const safeRadius = clampRadius(radiusMeters);
  const visibleRadius = draggedRadiusMeters ?? safeRadius;
  const visibleCenter = draggedCenter ?? center;

  const circleShape = useMemo(
    () =>
      geometryType === 'circle' && visibleRadius > 0
        ? createCirclePolygon(
            visibleCenter,
            visibleRadius,
            isDraggingCenter || isDraggingRadius ? DRAG_CIRCLE_SEGMENTS : CIRCLE_SEGMENTS
          )
        : null,
    [geometryType, isDraggingCenter, isDraggingRadius, visibleCenter, visibleRadius]
  );

  const radiusHandleCoordinate = useMemo(
    () => (geometryType === 'circle' ? getDestinationCoordinate(visibleCenter, visibleRadius, 90) : null),
    [geometryType, visibleCenter, visibleRadius]
  );

  const visibleRadiusHandleCoordinate = draggedRadiusHandle ?? radiusHandleCoordinate;

  const radiusLabelShape = useMemo(
    () =>
      geometryType === 'circle' && visibleRadiusHandleCoordinate
        ? createRadiusLabelShape(visibleRadiusHandleCoordinate, formatRadiusLabel(visibleRadius))
        : null,
    [geometryType, visibleRadius, visibleRadiusHandleCoordinate]
  );

  const centerHolderShape = useMemo(
    () => (geometryType === 'circle' ? createCenterHolderShape(visibleCenter) : null),
    [geometryType, visibleCenter]
  );

  useEffect(() => {
    latestCenterRef.current = center;
  }, [center]);

  useEffect(() => {
    if (lastCameraTriggerKeyRef.current === cameraTriggerKey) return;

    lastCameraTriggerKeyRef.current = cameraTriggerKey;

    const latestCenter = latestCenterRef.current;
    setCameraCenterCoordinate([latestCenter.lng, latestCenter.lat]);
  }, [cameraTriggerKey]);

  const handleCenterDragStart = (event: any) => {
    setIsDraggingCenter(true);
    setDraggedCenter(extractCoordinates(event) ?? center);
  };

  const handleCenterDrag = (event: any) => {
    const nextCenter = extractCoordinates(event);
    if (nextCenter) setDraggedCenter(nextCenter);
  };

  const handleCenterDragEnd = (event: any) => {
    const nextCenter = extractCoordinates(event);

    if (nextCenter) onPick(nextCenter);

    setIsDraggingCenter(false);
    setDraggedCenter(null);
  };

  const handleRadiusDragStart = (event: any) => {
    setIsDraggingRadius(true);

    const nextCoordinate = extractCoordinates(event);
    if (nextCoordinate) {
      setDraggedRadiusHandle(nextCoordinate);
      setDraggedRadiusMeters(clampRadius(getDistanceMeters(center, nextCoordinate)));
    }
  };

  const updateRadiusPreviewFromDrag = (event: any) => {
    const nextCoordinate = extractCoordinates(event);
    if (!nextCoordinate) return null;

    const nextRadius = clampRadius(getDistanceMeters(center, nextCoordinate));
    setDraggedRadiusHandle(nextCoordinate);
    setDraggedRadiusMeters(nextRadius);

    return nextRadius;
  };

  const handleRadiusDragEnd = (event: any) => {
    const nextRadius = updateRadiusPreviewFromDrag(event) ?? draggedRadiusMeters;

    if (nextRadius !== null) {
      onRadiusChange?.(nextRadius);
    }

    setIsDraggingRadius(false);
    setDraggedRadiusHandle(null);
    setDraggedRadiusMeters(null);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <MapView
        showButtons={false}
        showStyleSelector={false}
        show3DBuildings={false}
        centerCoordinate={cameraCenterCoordinate}
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

        {isDraggingRadius && visibleRadiusHandleCoordinate && (
          <MarkerView
            coordinate={[visibleRadiusHandleCoordinate.lng, visibleRadiusHandleCoordinate.lat]}
            anchor={{ x: 0.5, y: 1.65 }}
            allowOverlap
          >
            <View collapsable={false} pointerEvents="none" style={styles.radiusTooltip}>
              <Text size="xs" style={styles.radiusTooltipTitle}>
                Adjust radius
              </Text>
              <Text size="xs" style={styles.radiusTooltipValue}>
                {formatRadiusLabel(visibleRadius)}
              </Text>
            </View>
          </MarkerView>
        )}

        {centerHolderShape && (
          <ShapeSource id="danger-zone-center-holder-source" shape={centerHolderShape}>
            <CircleLayer
              id="danger-zone-center-holder-bg"
              style={{
                circleRadius: isDraggingCenter ? 20 : 17,
                circleColor: 'rgba(17, 24, 39, 0.99)',
                circleStrokeColor: '#FFFFFF',
                circleStrokeWidth: 2,
                circleOpacity: 0.5,
              }}
            />

            <SymbolLayer
              id="danger-zone-center-holder-icon"
              style={{
                textField: ['get', 'label'],
                textSize: 13,
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
            onDragStart={handleRadiusDragStart}
            onDrag={updateRadiusPreviewFromDrag}
            onDragEnd={handleRadiusDragEnd}
          >
            <View collapsable={false} style={styles.radiusDragTarget} />
          </MapboxGL.PointAnnotation>
        )}

        <MapboxGL.PointAnnotation
          id="danger-zone-picked-center"
          coordinate={[visibleCenter.lng, visibleCenter.lat]}
          draggable
          onDragStart={handleCenterDragStart}
          onDrag={handleCenterDrag}
          onDragEnd={handleCenterDragEnd}
        >
          {geometryType === 'circle' ? (
            <View
              collapsable={false}
              style={[styles.markerDragTarget, isDraggingCenter && styles.markerDragTargetActive]}
            >
              <View style={[styles.marker, styles.circleMarkerAnchor, isDraggingCenter && styles.markerDragging]} />
            </View>
          ) : (
            <View
              collapsable={false}
              style={[
                styles.marker,
                isDraggingCenter && styles.markerDragging,
                { backgroundColor: Colors.brand.light },
              ]}
            />
          )}
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
  markerDragging: {
    transform: [{ scale: 1.22 }],
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  circleMarkerAnchor: {
    opacity: 0,
  },
  markerDragTarget: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.01)',
  },
  markerDragTargetActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  radiusDragTarget: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(249, 115, 22, 0.01)',
  },
  radiusTooltip: {
    minWidth: 110,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.96)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  radiusTooltipTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  radiusTooltipValue: {
    color: '#FDBA74',
    fontWeight: '800',
    marginTop: 2,
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
