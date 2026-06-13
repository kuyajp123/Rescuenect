import { HoveredButton } from '@/components/components/button/Button';
import DetailsCard from '@/components/components/card/DetailsCard';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { Colors } from '@/constants/Colors';
import { useMap } from '@/contexts/MapContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  DEFAULT_CLIENT_MAP_CENTER,
  getClientMapBounds,
  getClientMapCenter,
  getClientMapZoomSettings,
} from '@/helper/clientMapScope';
import { storageHelpers } from '@/helper/storage';
import { useSavedLocationsStore } from '@/store/useSavedLocationsStore';
import { useUserData } from '@/store/useBackendResponse';
import { isUserMapStyle, useMapSettingsStore } from '@/store/useMapSettings';
import { CenterType, EvacuationCenter } from '@/types/components';
import { DangerZoneRecord } from '@/types/dangerZone';
import {
  EvacuationTravelMode,
  RoadCondition,
  RoadConditionSegment,
  RouteLineString,
} from '@/types/evacuationRoute';
import MapboxGL, { CircleLayer, FillLayer, Images, LineLayer, ShapeSource, SymbolLayer } from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import type { FeatureCollection } from 'geojson';
import { Bookmark, Car, ChevronLeft, Footprints, List, MapIcon, Navigation } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Image, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../text';

// Get color based on earthquake severity
const getEarthquakeSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'micro':
      return '#ADFF2F'; // Yellow-green
    case 'minor':
      return '#FFD700'; // Gold/Yellow
    case 'light':
      return '#FFA500'; // Orange
    case 'moderate':
      return '#FF4500'; // Orange-red
    case 'strong':
      return '#FF0000'; // Red
    case 'major':
      return '#8B0000'; // Dark red
    case 'great':
      return '#4B0000'; // Very dark red
    default:
      return '#808080'; // Gray for unknown
  }
};

const EARTH_RADIUS_KM = 6371.0088;
const EARTHQUAKE_RADIUS_SEGMENTS = 96;

interface EarthquakeData {
  id?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  severity: string;
  magnitude: number;
  impact_radii?: {
    felt_radius_km: number;
    moderate_shaking_radius_km: number;
    strong_shaking_radius_km: number;
  };
  clientImpacts?: {
    radiusKm?: number;
  }[];
}

type EarthquakeRadiusRing = {
  key: 'felt' | 'moderate' | 'strong';
  label: string;
  radiusKm: number;
  fillColor: string;
  fillOpacity: number;
  outlineColor: string;
};

const getPositiveFiniteNumber = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
};

const createRadiusPolygon = (
  longitude: number,
  latitude: number,
  radiusKm: number
): FeatureCollection => {
  const centerLatitude = (latitude * Math.PI) / 180;
  const centerLongitude = (longitude * Math.PI) / 180;
  const angularDistance = radiusKm / EARTH_RADIUS_KM;
  const coordinates: [number, number][] = [];

  for (let index = 0; index <= EARTHQUAKE_RADIUS_SEGMENTS; index++) {
    const bearing = (index / EARTHQUAKE_RADIUS_SEGMENTS) * 2 * Math.PI;
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

    const normalizedLongitude = ((((pointLongitude * 180) / Math.PI + 540) % 360) - 180) as number;
    coordinates.push([normalizedLongitude, (pointLatitude * 180) / Math.PI]);
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
        properties: {
          radiusKm,
        },
      },
    ],
  };
};

const getEarthquakeRadiusRings = (earthquake: EarthquakeData): EarthquakeRadiusRing[] => {
  const feltRadius =
    getPositiveFiniteNumber(earthquake.impact_radii?.felt_radius_km) ??
    getPositiveFiniteNumber(earthquake.clientImpacts?.[0]?.radiusKm);
  const moderateRadius = getPositiveFiniteNumber(earthquake.impact_radii?.moderate_shaking_radius_km);
  const strongRadius = getPositiveFiniteNumber(earthquake.impact_radii?.strong_shaking_radius_km);

  return [
    feltRadius
      ? {
          key: 'felt',
          label: 'Felt radius',
          radiusKm: feltRadius,
          fillColor: '#F59E0B',
          fillOpacity: 0.16,
          outlineColor: '#F59E0B',
        }
      : null,
    moderateRadius
      ? {
          key: 'moderate',
          label: 'Moderate shaking',
          radiusKm: moderateRadius,
          fillColor: '#F97316',
          fillOpacity: 0.2,
          outlineColor: '#EA580C',
        }
      : null,
    strongRadius
      ? {
          key: 'strong',
          label: 'Strong shaking',
          radiusKm: strongRadius,
          fillColor: '#EF4444',
          fillOpacity: 0.24,
          outlineColor: '#DC2626',
        }
      : null,
  ].filter((ring): ring is EarthquakeRadiusRing => Boolean(ring));
};

type saveLocationData = {
  id: string;
  label: string;
  location: string;
  lat: number;
  lng: number;
};

type CameraBoundsWithPadding = {
  ne: [number, number];
  sw: [number, number];
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
};

interface MapViewProps {
  children?: React.ReactNode;
  coords?: { lat: number; lng: number };
  data?: EvacuationCenter[];
  dangerZones?: DangerZoneRecord[];
  focusedDangerZoneId?: string | null;
  routeGeoJson?: RouteLineString | null;
  routeConditionSegments?: RoadConditionSegment[];
  selectedRouteCenterId?: string | null;
  travelMode?: EvacuationTravelMode;
  onTravelModeChange?: (mode: EvacuationTravelMode) => void;
  onRequestBestRoute?: () => void;
  onRequestRouteToCenter?: (center: EvacuationCenter) => void;
  isRouteLoading?: boolean;
  routeWarnings?: string[];
  routeError?: string | null;
  mapNotice?: string | null;
  onDismissMapNotice?: () => void;
  routeSummary?: {
    selectedCenterName: string;
    distanceMeters: number;
    durationSeconds: number;
    durationTypicalSeconds?: number | null;
    provider: string;
    travelMode: EvacuationTravelMode;
    roadConditionLabel?: string;
  } | null;
  onClearRoute?: () => void;
  earthquakeData?: EarthquakeData;
  earthquakeDataList?: EarthquakeData[];
  handleMapPress?: (event: any) => void;
  onPress?: (coords: [number, number]) => void;
  showButtons?: boolean;
  showStyleSelector?: boolean;
  showEvacuationLegend?: boolean;
  mapStyleButtonTop?: number;
  mapStyleSelectorTop?: number;
  interactive?: boolean;
  pitchEnabled?: boolean;
  compassEnabled?: boolean;
  rotateEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  centerCoordinate?: [number, number];
  cameraBounds?: CameraBoundsWithPadding;
  cameraTriggerKey?: string | number;
  compassViewMargins?: { x: number; y: number };
  maxBounds?: [[number, number], [number, number]] | null;
  zoomLevel?: number;
  minZoomLevel?: number;
  maxZoomLevel?: number;
  followUserLocation?: boolean;
  hasAnimation?: boolean;
  show3DBuildings?: boolean;
  onMarkerPress?: (markerId: string) => void;
  onEarthquakePress?: (earthquakeId: string) => void;
  savedLocations?: saveLocationData[];
}

const EVACUATION_CENTER_LEGEND: { type: CenterType; label: string; icon: number }[] = [
  {
    type: 'school',
    label: 'School',
    icon: require('@/assets/images/marker/evacuation-center-marker/marker-school.png'),
  },
  {
    type: 'barangay hall',
    label: 'Barangay Hall',
    icon: require('@/assets/images/marker/evacuation-center-marker/marker-barangay-hall.png'),
  },
  {
    type: 'gymnasium',
    label: 'Gymnasium',
    icon: require('@/assets/images/marker/evacuation-center-marker/marker-gymnasium.png'),
  },
  {
    type: 'church',
    label: 'Church',
    icon: require('@/assets/images/marker/evacuation-center-marker/marker-church.png'),
  },
  {
    type: 'government building',
    label: 'Government Building',
    icon: require('@/assets/images/marker/evacuation-center-marker/marker-government-building.png'),
  },
  {
    type: 'private facility',
    label: 'Private Facility',
    icon: require('@/assets/images/marker/evacuation-center-marker/marker-private-facility.png'),
  },
  {
    type: 'vacant building',
    label: 'Vacant Building',
    icon: require('@/assets/images/marker/evacuation-center-marker/marker-vacant-building.png'),
  },
  {
    type: 'covered court',
    label: 'Covered Court',
    icon: require('@/assets/images/marker/evacuation-center-marker/marker-covered-court.png'),
  },
  { type: 'other', label: 'Other', icon: require('@/assets/images/marker/evacuation-center-marker/others-marker.png') },
];

const formatDangerZoneLabel = (value: string) =>
  value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatRouteDistance = (meters: number) => {
  if (!Number.isFinite(meters)) return 'Unknown distance';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
};

const formatRouteDuration = (seconds: number) => {
  if (!Number.isFinite(seconds)) return 'Unknown time';
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
};

const formatTravelMode = (mode: EvacuationTravelMode) => (mode === 'walking' ? 'Walking' : 'Driving');

const getRoadConditionColor = (condition: RoadCondition) => {
  switch (condition) {
    case 'closed':
      return '#7F1D1D';
    case 'incident':
      return '#7E22CE';
    case 'severe':
      return '#DC2626';
    case 'heavy':
      return '#F97316';
    case 'moderate':
      return '#F59E0B';
    case 'low':
      return '#16A34A';
    default:
      return '#64748B';
  }
};

const getRoadConditionDisplayLabel = (segment: RoadConditionSegment) => {
  if (segment.condition === 'unknown') {
    return segment.speedMetersPerSecond ? 'Traffic data limited' : 'Traffic data unavailable';
  }
  return segment.label;
};

const getRoadConditionDetailText = (segment: RoadConditionSegment) => {
  if (segment.condition === 'unknown') {
    if (segment.speedMetersPerSecond) {
      return 'Traffic details are limited here, but we still received an estimated travel speed.';
    }
    return 'Traffic details are not available for this part of the route.';
  }

  if (segment.incidentDescription) return segment.incidentDescription;
  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  children,
  coords,
  data,
  dangerZones,
  focusedDangerZoneId,
  routeGeoJson,
  routeConditionSegments = [],
  selectedRouteCenterId,
  travelMode = 'driving',
  onTravelModeChange,
  onRequestBestRoute,
  onRequestRouteToCenter,
  isRouteLoading = false,
  routeWarnings = [],
  routeError,
  mapNotice,
  onDismissMapNotice,
  routeSummary,
  onClearRoute,
  earthquakeData,
  earthquakeDataList,
  handleMapPress,
  pitchEnabled = false,
  rotateEnabled = true,
  scrollEnabled = true,
  compassEnabled = true,
  zoomEnabled = true,
  showButtons = true,
  showStyleSelector = true,
  showEvacuationLegend = false,
  mapStyleButtonTop = 80,
  mapStyleSelectorTop = 130,
  interactive = true,
  centerCoordinate,
  cameraBounds,
  cameraTriggerKey,
  compassViewMargins = { x: 20, y: 20 },
  maxBounds,
  zoomLevel,
  minZoomLevel,
  maxZoomLevel,
  followUserLocation = false,
  hasAnimation = true,
  show3DBuildings = true,
  onMarkerPress,
  onEarthquakePress,
  savedLocations,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const { setMapStyle } = useMap();
  const mapStyleFromSettings = useMapSettingsStore(state => state.mapStyle);
  const setMapStyleInSettings = useMapSettingsStore(state => state.setMapStyle);
  const savedLocationsFromStore = useSavedLocationsStore(state => state.savedLocations);
  const userData = useUserData(state => state.userData);
  const savedLocationsList = savedLocations ?? savedLocationsFromStore;
  const earthquakeMarkers = earthquakeDataList ?? (earthquakeData ? [earthquakeData] : []);
  const scopedCenterCoordinate = centerCoordinate ?? getClientMapCenter(userData, DEFAULT_CLIENT_MAP_CENTER);
  const scopedMaxBounds = maxBounds !== undefined ? maxBounds : getClientMapBounds(userData, scopedCenterCoordinate);
  const scopedZoom = getClientMapZoomSettings(userData, {
    zoomLevel,
    minZoomLevel,
    maxZoomLevel,
  });
  const [showMapStyles, setShowMapStyles] = useState(false);
  const [mapStyleState, setMapStyleState] = useState<MapboxGL.StyleURL>(MapboxGL.StyleURL.Street);
  const [selectedMarker, setSelectedMarker] = useState<EvacuationCenter | null>(null);
  const [selectedDangerZone, setSelectedDangerZone] = useState<DangerZoneRecord | null>(null);
  const [selectedRoadCondition, setSelectedRoadCondition] = useState<RoadConditionSegment | null>(null);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [areMarkersReady, setAreMarkersReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showSavedLocations, setShowSavedLocations] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  useEffect(() => {
    const loadMapStyle = async () => {
      try {
        const savedStyle = await storageHelpers.getField(STORAGE_KEYS.USER_SETTINGS, 'mapStyle');
        if (isUserMapStyle(savedStyle)) {
          setMapStyleState(savedStyle);
          setMapStyleInSettings?.(savedStyle);
        }
      } catch (error) {
        console.error('Error loading map style:', error);
      }
    };
    loadMapStyle();
  }, [setMapStyleInSettings]);

  useEffect(() => {
    if (isUserMapStyle(mapStyleFromSettings)) {
      setMapStyleState(mapStyleFromSettings);
    }
  }, [mapStyleFromSettings]);

  // Sequential loading: Wait for style -> Wait for Images -> Show Markers
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isStyleLoaded && isMapReady) {
      // Give the Images component time to register native assets before adding the ShapeSource
      timeout = setTimeout(() => {
        setAreMarkersReady(true);
      }, 500);
    } else {
      setAreMarkersReady(false);
    }
    return () => clearTimeout(timeout);
  }, [isStyleLoaded, isMapReady]);

  useEffect(() => {
    if (savedLocationsList.length === 0) {
      setShowSavedLocations(false);
    }
  }, [savedLocationsList.length]);

  useEffect(() => {
    if (!focusedDangerZoneId || !dangerZones?.length) return;
    const dangerZone = dangerZones.find(zone => zone.id === focusedDangerZoneId);
    if (!dangerZone) return;

    setSelectedMarker(null);
    setSelectedRoadCondition(null);
    setSelectedDangerZone(dangerZone);
    setIsLegendOpen(false);
  }, [dangerZones, focusedDangerZoneId]);

  // Handle hardware back press
  useEffect(() => {
    const handleBackPress = () => {
      if (selectedRoadCondition) {
        setSelectedRoadCondition(null);
        return true;
      }
      if (selectedDangerZone) {
        setSelectedDangerZone(null);
        return true;
      }
      if (selectedMarker) {
        setSelectedMarker(null);
        return true; // Prevent default behavior (navigation back)
      }
      return false; // Allow default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => backHandler.remove();
  }, [selectedDangerZone, selectedMarker, selectedRoadCondition]);

  const toggleMapStyles = useCallback(() => {
    setShowMapStyles(prev => !prev);
  }, []);

  const toggleSavedLocations = useCallback(() => {
    if (savedLocationsList.length === 0) return;
    setShowSavedLocations(prev => !prev);
  }, [savedLocationsList.length]);

  const toggleLegend = useCallback(() => {
    setIsLegendOpen(prev => !prev);
  }, []);

  const handleStyleChange = useCallback(
    async (style: MapboxGL.StyleURL.Street | MapboxGL.StyleURL.Dark | MapboxGL.StyleURL.SatelliteStreet) => {
      try {
        if (mapStyleState === style) return;

        setIsStyleLoaded(false); // Unmount layers before style change

        if (setMapStyle) {
          setMapStyle(style);
        }
        setMapStyleInSettings?.(style);
        setMapStyleState(style);
        setShowMapStyles(false);
        // Save the selected style to storage
        await storageHelpers.setField(STORAGE_KEYS.USER_SETTINGS, 'mapStyle', style);
      } catch (error) {
        console.error('Error saving map style:', error);
      }
    },
    [mapStyleState, setMapStyle, setMapStyleInSettings]
  );

  // Convert EvacuationCenterFormData[] to GeoJSON FeatureCollection
  const evacuationCentersGeoJson: FeatureCollection | undefined = data
    ? {
        type: 'FeatureCollection',
        features: data
          .filter(
            center =>
              center.coordinates &&
              typeof center.coordinates.lng === 'number' &&
              typeof center.coordinates.lat === 'number'
          )
          .map((center, idx) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [center.coordinates!.lng, center.coordinates!.lat],
            },
            properties: {
              ...center,
            },
            id: center.id ?? idx,
          })),
      }
    : undefined;

  const dangerZoneAreaGeoJson: FeatureCollection | undefined = dangerZones?.length
    ? {
        type: 'FeatureCollection',
        features: dangerZones.flatMap(zone => {
          if (zone.geometryType === 'circle' && zone.center && zone.radiusMeters) {
            const circle = createRadiusPolygon(zone.center.lng, zone.center.lat, zone.radiusMeters / 1000).features[0];
            return [{ ...circle, id: zone.id, properties: { ...circle.properties, id: zone.id } }];
          }
          if (zone.geometryType === 'polygon' && zone.geojson?.type === 'Polygon') {
            return [
              {
                type: 'Feature' as const,
                id: zone.id,
                geometry: zone.geojson,
                properties: { id: zone.id },
              },
            ];
          }
          return [];
        }),
      }
    : undefined;

  const dangerZoneLineGeoJson: FeatureCollection | undefined = dangerZones?.length
    ? {
        type: 'FeatureCollection',
        features: dangerZones
          .filter(zone => zone.geometryType === 'line' && zone.geojson?.type === 'LineString')
          .map(zone => ({
            type: 'Feature' as const,
            id: zone.id,
            geometry: zone.geojson!,
            properties: { id: zone.id },
          })),
      }
    : undefined;

  const dangerZonePointGeoJson: FeatureCollection | undefined = dangerZones?.length
    ? {
        type: 'FeatureCollection',
        features: dangerZones
          .filter(zone => zone.geometryType === 'point' && zone.center)
          .map(zone => ({
            type: 'Feature' as const,
            id: zone.id,
            geometry: {
              type: 'Point' as const,
              coordinates: [zone.center!.lng, zone.center!.lat],
            },
            properties: { id: zone.id },
          })),
      }
    : undefined;

  const routeFeatureCollection: FeatureCollection | undefined = routeGeoJson
    ? {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature' as const,
            geometry: routeGeoJson,
            properties: { id: 'best-evacuation-route' },
          },
        ],
      }
    : undefined;

  const routeConditionFeatureCollection: FeatureCollection | undefined = routeConditionSegments.length
    ? {
        type: 'FeatureCollection',
        features: routeConditionSegments.map(segment => ({
          type: 'Feature' as const,
          id: segment.id,
          geometry: segment.geometry,
          properties: {
            id: segment.id,
            condition: segment.condition,
            label: segment.label,
          },
        })),
      }
    : undefined;

  const handleDangerZonePress = (event: any) => {
    const feature = event.features?.[0];
    const dangerZoneId = String(feature?.id ?? feature?.properties?.id ?? '');
    const dangerZone = dangerZones?.find(zone => zone.id === dangerZoneId);
    if (!dangerZone) return;
    setSelectedMarker(null);
    setSelectedDangerZone(dangerZone);
    setIsLegendOpen(false);
  };

  const handleRoadConditionPress = (event: any) => {
    const feature = event.features?.[0];
    const segmentId = String(feature?.id ?? feature?.properties?.id ?? '');
    const segment = routeConditionSegments.find(item => item.id === segmentId);
    if (!segment) return;
    setSelectedMarker(null);
    setSelectedDangerZone(null);
    setSelectedRoadCondition(segment);
    setIsLegendOpen(false);
  };

  return (
    <View style={styles.mapStyle}>
      <MapboxGL.MapView
        style={styles.mapStyle}
        styleURL={mapStyleState}
        logoEnabled={false}
        compassEnabled={interactive ? compassEnabled : false}
        pitchEnabled={interactive ? pitchEnabled : false}
        rotateEnabled={interactive ? rotateEnabled : false}
        scrollEnabled={interactive ? scrollEnabled : false}
        zoomEnabled={interactive ? zoomEnabled : false}
        compassViewPosition={1}
        compassViewMargins={compassViewMargins}
        onPress={handleMapPress}
        onWillStartLoadingMap={() => {
          setIsMapReady(false);
          setIsStyleLoaded(false);
        }}
        onDidFinishLoadingMap={() => setIsMapReady(true)}
        onDidFailLoadingMap={() => {
          setIsMapReady(false);
        }}
        onDidFinishLoadingStyle={() => setIsStyleLoaded(true)}
        onDidFinishRenderingMapFully={() => setIsMapReady(true)}
      >
        <MapboxGL.Camera
          bounds={cameraBounds}
          zoomLevel={cameraBounds ? undefined : scopedZoom.zoomLevel}
          centerCoordinate={cameraBounds ? undefined : scopedCenterCoordinate}
          maxBounds={
            scopedMaxBounds
              ? {
                  ne: [scopedMaxBounds[1][0], scopedMaxBounds[1][1]],
                  sw: [scopedMaxBounds[0][0], scopedMaxBounds[0][1]],
                }
              : undefined
          }
          animationDuration={300}
          animationMode={hasAnimation ? 'flyTo' : 'none'}
          minZoomLevel={scopedZoom.minZoomLevel}
          maxZoomLevel={scopedZoom.maxZoomLevel}
          followUserLocation={followUserLocation}
          followZoomLevel={16}
          triggerKey={cameraTriggerKey}
        />

        {isStyleLoaded && isMapReady && (
          <>
            {/* Register your icon asset here */}
            <Images
              images={{
                pin: require('@/assets/images/marker/marker-icon-blue.png'),
                'status-safe-marker': require('@/assets/images/marker/marker-icon-green.png'),
                'status-evacuated-marker': require('@/assets/images/marker/marker-icon-blue.png'),
                'status-affected-marker': require('@/assets/images/marker/marker-icon-orange.png'),
                'status-missing-marker': require('@/assets/images/marker/marker-icon-red.png'),
                'marker-school': require('@/assets/images/marker/evacuation-center-marker/marker-school.png'),
                'marker-barangay-hall': require('@/assets/images/marker/evacuation-center-marker/marker-barangay-hall.png'),
                'marker-gymnasium': require('@/assets/images/marker/evacuation-center-marker/marker-gymnasium.png'),
                'marker-church': require('@/assets/images/marker/evacuation-center-marker/marker-church.png'),
                'marker-government-building': require('@/assets/images/marker/evacuation-center-marker/marker-government-building.png'),
                'marker-private-facility': require('@/assets/images/marker/evacuation-center-marker/marker-private-facility.png'),
                'marker-vacant-building': require('@/assets/images/marker/evacuation-center-marker/marker-vacant-building.png'),
                'marker-covered-court': require('@/assets/images/marker/evacuation-center-marker/marker-covered-court.png'),
                'others-marker': require('@/assets/images/marker/evacuation-center-marker/others-marker.png'),
              }}
            />

            {show3DBuildings && mapStyleState !== MapboxGL.StyleURL.SatelliteStreet && (
              <MapboxGL.VectorSource id="buildingSource" url="mapbox://mapbox.mapbox-streets-v8">
                <MapboxGL.FillExtrusionLayer
                  id="3d-buildings"
                  sourceLayerID="building"
                  minZoomLevel={11}
                  maxZoomLevel={20}
                  style={{
                    fillExtrusionColor: '#aaa',
                    fillExtrusionHeight: ['get', 'height'],
                    fillExtrusionBase: ['get', 'min_height'],
                    fillExtrusionOpacity: 0.6,
                  }}
                />
              </MapboxGL.VectorSource>
            )}

            {dangerZoneAreaGeoJson && dangerZoneAreaGeoJson.features.length > 0 && (
              <ShapeSource id="danger-zone-area-source" shape={dangerZoneAreaGeoJson} onPress={handleDangerZonePress}>
                <FillLayer
                  id="danger-zone-area-layer"
                  style={{
                    fillColor: '#DC2626',
                    fillOpacity: 0.22,
                    fillOutlineColor: '#B91C1C',
                  }}
                />
              </ShapeSource>
            )}

            {dangerZoneLineGeoJson && dangerZoneLineGeoJson.features.length > 0 && (
              <ShapeSource id="danger-zone-line-source" shape={dangerZoneLineGeoJson} onPress={handleDangerZonePress}>
                <LineLayer
                  id="danger-zone-line-layer"
                  style={{
                    lineColor: '#DC2626',
                    lineWidth: 5,
                    lineOpacity: 0.9,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              </ShapeSource>
            )}

            {dangerZonePointGeoJson && dangerZonePointGeoJson.features.length > 0 && (
              <ShapeSource id="danger-zone-point-source" shape={dangerZonePointGeoJson} onPress={handleDangerZonePress}>
                <CircleLayer
                  id="danger-zone-point-layer"
                  style={{
                    circleRadius: 8,
                    circleColor: '#DC2626',
                    circleOpacity: 0.95,
                    circleStrokeColor: '#FFFFFF',
                    circleStrokeWidth: 2,
                  }}
                />
              </ShapeSource>
            )}

            {routeFeatureCollection && (
              <ShapeSource id="evacuation-route-source" shape={routeFeatureCollection}>
                <LineLayer
                  id="evacuation-route-layer"
                  style={{
                    lineColor: '#2563EB',
                    lineWidth: 6,
                    lineOpacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              </ShapeSource>
            )}

            {routeConditionFeatureCollection && (
              <ShapeSource
                id="evacuation-route-condition-source"
                shape={routeConditionFeatureCollection}
                onPress={handleRoadConditionPress}
              >
                <LineLayer
                  id="evacuation-route-condition-layer"
                  style={{
                    lineColor: [
                      'match',
                      ['get', 'condition'],
                      'closed',
                      getRoadConditionColor('closed'),
                      'incident',
                      getRoadConditionColor('incident'),
                      'severe',
                      getRoadConditionColor('severe'),
                      'heavy',
                      getRoadConditionColor('heavy'),
                      'moderate',
                      getRoadConditionColor('moderate'),
                      'low',
                      getRoadConditionColor('low'),
                      getRoadConditionColor('unknown'),
                    ],
                    lineWidth: 8,
                    lineOpacity: 0.94,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              </ShapeSource>
            )}

            {/* Marker source - Only render when images are ready to prevent race condition */}
            {evacuationCentersGeoJson && areMarkersReady && (
              <ShapeSource
                id="marker-source"
                shape={evacuationCentersGeoJson}
                onPress={e => {
                  const feature = e.features[0]; // clicked marker feature
                  const markerId = feature.id as string;

                  if (onMarkerPress) {
                    onMarkerPress(markerId);
                  } else {
                    setSelectedMarker(
                      evacuationCentersGeoJson?.features.find(f => f.id === feature.id)?.properties as EvacuationCenter
                    );
                  }
                  setIsLegendOpen(false);
                }}
              >
                <SymbolLayer
                  id="marker-layer"
                  style={{
                    iconImage: [
                      'match',
                      ['downcase', ['to-string', ['get', 'type']]],
                      'school',
                      'marker-school',
                      'barangay hall',
                      'marker-barangay-hall',
                      'gymnasium',
                      'marker-gymnasium',
                      'church',
                      'marker-church',
                      'government building',
                      'marker-government-building',
                      'private facility',
                      'marker-private-facility',
                      'vacant building',
                      'marker-vacant-building',
                      'covered court',
                      'marker-covered-court',
                      'others-marker',
                      'others-marker',
                      'other',
                      'others-marker',
                      'pin', // default
                    ],
                    iconSize: [
                      'match',
                      ['downcase', ['to-string', ['get', 'type']]],
                      'school',
                      0.1,
                      'barangay hall',
                      0.1,
                      'gymnasium',
                      0.1,
                      'church',
                      0.1,
                      'government building',
                      0.1,
                      'private facility',
                      0.1,
                      'vacant building',
                      0.1,
                      'covered court',
                      0.1,
                      'others-marker',
                      0.1,
                      'other',
                      0.1,
                      1,
                    ],
                    iconAllowOverlap: true,
                    iconIgnorePlacement: true,
                  }}
                />
              </ShapeSource>
            )}

            {coords && (
              <MapboxGL.PointAnnotation id="tap-marker" coordinate={[coords.lng, coords.lat]}>
                <View collapsable={false} style={[styles.tapMarker, { backgroundColor: Colors.brand.dark }]} />
              </MapboxGL.PointAnnotation>
            )}

            {showSavedLocations &&
              savedLocationsList.map(location => (
                <MapboxGL.PointAnnotation
                  key={`saved-location-marker-${location.id}`}
                  id={`saved-location-marker-${location.id}`}
                  coordinate={[location.lng, location.lat]}
                >
                  <View collapsable={false} style={styles.savedLocationMarker} />
                </MapboxGL.PointAnnotation>
              ))}

            {/* Earthquake impact radii in real map distance, not fixed screen pixels. */}
            {earthquakeMarkers.map((earthquake, index) => {
              const markerId = String(earthquake.id ?? `earthquake-${index}`).replace(/[^a-zA-Z0-9_-]/g, '_');
              const radiusRings = getEarthquakeRadiusRings(earthquake);

              return (
                <React.Fragment key={`earthquake-${markerId}`}>
                  {radiusRings.map(ring => (
                    <ShapeSource
                      key={`earthquake-radius-${markerId}-${ring.key}`}
                      id={`earthquake-radius-source-${markerId}-${ring.key}`}
                      shape={createRadiusPolygon(
                        earthquake.coordinates.longitude,
                        earthquake.coordinates.latitude,
                        ring.radiusKm
                      )}
                    >
                      <FillLayer
                        id={`earthquake-radius-layer-${markerId}-${ring.key}`}
                        style={{
                          fillColor: ring.fillColor,
                          fillOpacity: ring.fillOpacity,
                          fillOutlineColor: ring.outlineColor,
                          fillAntialias: true,
                        }}
                      />
                    </ShapeSource>
                  ))}

                  {/* Earthquake epicenter marker */}
                  <MapboxGL.PointAnnotation
                    id={`earthquake-epicenter-${markerId}`}
                    coordinate={[earthquake.coordinates.longitude, earthquake.coordinates.latitude]}
                    onSelected={() => onEarthquakePress?.(earthquake.id ?? markerId)}
                  >
                    <View
                      collapsable={false}
                      style={[
                        styles.tapMarker,
                        {
                          backgroundColor: getEarthquakeSeverityColor(earthquake.severity),
                          width: 16,
                          height: 16,
                          borderWidth: 3,
                        },
                      ]}
                    />
                  </MapboxGL.PointAnnotation>
                </React.Fragment>
              );
            })}

            {areMarkersReady && children}
          </>
        )}
      </MapboxGL.MapView>

      {/* Simple detail view */}
      {selectedMarker && (
        <View style={styles.detailsOverlay} pointerEvents="box-none">
          <Pressable style={styles.detailsBackdrop} onPress={() => setSelectedMarker(null)} />
          <DetailsCard
            selectedMarker={selectedMarker}
            isDark={isDark}
            onClose={() => setSelectedMarker(null)}
            onRequestRoute={
              onRequestRouteToCenter
                ? center => {
                    setSelectedMarker(null);
                    onRequestRouteToCenter(center);
                  }
                : undefined
            }
            isRouteLoading={isRouteLoading && selectedRouteCenterId === selectedMarker.id}
          />
        </View>
      )}

      {selectedDangerZone && (
        <View style={styles.detailsOverlay} pointerEvents="box-none">
          <Pressable style={styles.detailsBackdrop} onPress={() => setSelectedDangerZone(null)} />
          <View
            style={[
              styles.dangerZoneCard,
              { backgroundColor: isDark ? Colors.background.dark : Colors.background.light },
            ]}
          >
            <Text size="lg" bold>
              {formatDangerZoneLabel(selectedDangerZone.type)}
            </Text>
            <Text size="xs" emphasis="light">
              {selectedDangerZone.geometryType.toUpperCase()} - {selectedDangerZone.severity.toUpperCase()} - {selectedDangerZone.status}
            </Text>
            <Text size="sm" style={styles.dangerZoneDescription}>
              {selectedDangerZone.description}
            </Text>
            <HoveredButton
              onPress={() => setSelectedDangerZone(null)}
              style={[styles.dangerZoneCloseButton, { backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light }]}
            >
              <Text size="sm" style={{ color: '#fff' }}>
                Close
              </Text>
            </HoveredButton>
          </View>
        </View>
      )}

      {showEvacuationLegend && (
        <View pointerEvents="box-none" style={styles.legendWrapper}>
          <HoveredButton
            onPress={toggleLegend}
            style={[styles.legendToggle, { backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light }]}
          >
            <List size={16} color={'#fff'} />
            <Text size="sm" style={{ color: '#fff' }}>
              Legend
            </Text>
          </HoveredButton>

          {isLegendOpen && (
            <View
              style={[
                styles.legendContainer,
                {
                  backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
                  borderColor: isDark ? Colors.border.dark : Colors.border.light,
                },
              ]}
            >
              <Text size="xs" bold style={{ marginBottom: 6 }}>
                Evacuation Centers
              </Text>
              <ScrollView
                style={styles.legendScroll}
                contentContainerStyle={styles.legendContent}
                showsVerticalScrollIndicator={false}
              >
                {EVACUATION_CENTER_LEGEND.map(item => (
                  <View key={item.type} style={styles.legendRow}>
                    <Image
                      source={item.icon}
                      style={item.type === 'other' ? styles.otherLegendIcon : styles.legendIcon}
                    />
                    <Text size="sm">{item.label}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {selectedRoadCondition && (
        <View style={styles.detailsOverlay} pointerEvents="box-none">
          <Pressable style={styles.detailsBackdrop} onPress={() => setSelectedRoadCondition(null)} />
          <View
            style={[
              styles.roadConditionCard,
              { backgroundColor: isDark ? Colors.background.dark : Colors.background.light },
            ]}
          >
            <View style={styles.roadConditionHeader}>
              <View
                style={[
                  styles.roadConditionSwatch,
                  { backgroundColor: getRoadConditionColor(selectedRoadCondition.condition) },
                ]}
              />
              <View style={styles.roadConditionTitleGroup}>
                <Text size="lg" bold>
                  {getRoadConditionDisplayLabel(selectedRoadCondition)}
                </Text>
              </View>
            </View>
            {getRoadConditionDetailText(selectedRoadCondition) && (
              <Text size="sm" style={styles.dangerZoneDescription}>
                {getRoadConditionDetailText(selectedRoadCondition)}
              </Text>
            )}
            {selectedRoadCondition.condition !== 'unknown' ? (
              <Text size="xs" emphasis="light">
                Condition: {selectedRoadCondition.condition.toUpperCase()}
                {selectedRoadCondition.congestionNumeric !== null &&
                selectedRoadCondition.congestionNumeric !== undefined
                  ? ` - Traffic level ${selectedRoadCondition.congestionNumeric}`
                  : ''}
              </Text>
            ) : null}
            {selectedRoadCondition.speedMetersPerSecond ? (
              <Text size="xs" emphasis="light">
                Estimated speed: {(selectedRoadCondition.speedMetersPerSecond * 3.6).toFixed(1)} km/h
              </Text>
            ) : null}
            <HoveredButton
              onPress={() => setSelectedRoadCondition(null)}
              style={[styles.dangerZoneCloseButton, { backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light }]}
            >
              <Text size="sm" style={{ color: '#fff' }}>
                Close
              </Text>
            </HoveredButton>
          </View>
        </View>
      )}

      {(routeSummary || routeError || mapNotice) && !selectedMarker && !selectedDangerZone && !selectedRoadCondition && (
        <View
          style={[
            styles.routeStatusCard,
            { backgroundColor: isDark ? Colors.background.dark : Colors.background.light },
          ]}
        >
          {routeSummary ? (
            <>
              <Text size="sm" bold>
                Route to {routeSummary.selectedCenterName}
              </Text>
              <Text size="xs" emphasis="light">
                {formatTravelMode(routeSummary.travelMode)} - {formatRouteDistance(routeSummary.distanceMeters)} -{' '}
                {formatRouteDuration(routeSummary.durationSeconds)} - {routeSummary.provider}
              </Text>
              {routeSummary.durationTypicalSeconds ? (
                <Text size="xs" emphasis="light">
                  Typical time: {formatRouteDuration(routeSummary.durationTypicalSeconds)}
                </Text>
              ) : null}
              {routeSummary.roadConditionLabel ? (
                <Text size="xs" emphasis="light">
                  Road condition: {routeSummary.roadConditionLabel}
                </Text>
              ) : null}
              <Text size="xs" emphasis="light" style={styles.routeLegendText}>
                Blue is the route. Colored parts show road conditions.
              </Text>
            </>
          ) : (
            <Text size="sm" bold style={styles.routeErrorText}>
              {routeError ?? mapNotice}
            </Text>
          )}
          {routeWarnings.map(warning => (
            <Text key={warning} size="xs" emphasis="light" style={styles.routeWarningText}>
              {warning}
            </Text>
          ))}
          {!routeSummary && !routeError && mapNotice && onDismissMapNotice ? (
            <HoveredButton
              onPress={onDismissMapNotice}
              style={[styles.clearRouteButton, { backgroundColor: isDark ? Colors.border.dark : Colors.border.light }]}
            >
              <Text size="xs" bold>
                Close
              </Text>
            </HoveredButton>
          ) : onClearRoute ? (
            <HoveredButton
              onPress={onClearRoute}
              style={[styles.clearRouteButton, { backgroundColor: isDark ? Colors.border.dark : Colors.border.light }]}
            >
              <Text size="xs" bold>
                Clear route
              </Text>
            </HoveredButton>
          ) : null}
        </View>
      )}

      {(showButtons || showStyleSelector) && (
        <>
          {showButtons && (
            <HoveredButton
              onPress={() => router.back()}
              style={[styles.toggleButton, { backgroundColor: isDark ? Colors.border.dark : Colors.border.light }]}
            >
              <ChevronLeft size={24} color={isDark ? Colors.border.light : Colors.border.dark} />
            </HoveredButton>
          )}

          {showStyleSelector && (
            <HoveredButton
              onPress={toggleMapStyles}
              style={[
                styles.mapStyleButton,
                {
                  top: mapStyleButtonTop,
                  backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light,
                },
              ]}
            >
              <MapIcon size={24} color={Colors.border.light} />
            </HoveredButton>
          )}

          {showButtons && onRequestBestRoute && (
            <HoveredButton
              onPress={
                isRouteLoading
                  ? undefined
                  : () => {
                      setSelectedMarker(null);
                      setSelectedDangerZone(null);
                      onRequestBestRoute();
                    }
              }
              style={[
                styles.bestRouteButton,
                {
                  backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light,
                  opacity: isRouteLoading ? 0.65 : 1,
                },
              ]}
            >
              <Navigation size={18} color="#fff" />
              <Text size="sm" bold style={styles.bestRouteButtonText}>
                {isRouteLoading ? 'Routing...' : 'Best Route'}
              </Text>
            </HoveredButton>
          )}

          {showButtons && onTravelModeChange && (
            <View
              style={[
                styles.travelModeSelector,
                {
                  backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
                  borderColor: isDark ? Colors.border.dark : Colors.border.light,
                },
              ]}
            >
              {([
                { mode: 'driving' as const, label: 'Driving', icon: Car },
                { mode: 'walking' as const, label: 'Walking', icon: Footprints },
              ]).map(option => {
                const Icon = option.icon;
                const isActive = travelMode === option.mode;
                return (
                  <TouchableOpacity
                    key={option.mode}
                    onPress={() => {
                      setSelectedMarker(null);
                      setSelectedDangerZone(null);
                      setSelectedRoadCondition(null);
                      onTravelModeChange(option.mode);
                    }}
                    style={[
                      styles.travelModeOption,
                      { backgroundColor: isActive ? Colors.brand.light : 'transparent' },
                    ]}
                  >
                    <Icon size={14} color={isActive ? '#fff' : isDark ? Colors.text.dark : Colors.text.light} />
                    <Text
                      size="xs"
                      bold={isActive}
                      style={{ color: isActive ? '#fff' : isDark ? Colors.text.dark : Colors.text.light }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {showButtons && savedLocationsList.length > 0 && (
            <HoveredButton
              onPress={toggleSavedLocations}
              style={[
                styles.savedLocationsButton,
                {
                  backgroundColor: showSavedLocations
                    ? Colors.brand.light
                    : isDark
                      ? Colors.brand.dark
                      : Colors.brand.light,
                },
              ]}
            >
              <Bookmark size={24} color={Colors.border.light} />
            </HoveredButton>
          )}

          {showMapStyles && showStyleSelector && (
            <View
              style={[
                styles.mapStyleSelector,
                {
                  top: mapStyleSelectorTop,
                  backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
                  borderColor: isDark ? Colors.border.dark : Colors.border.light,
                },
              ]}
            >
              {[
                { label: 'Street', value: MapboxGL.StyleURL.Street },
                { label: 'Satellite', value: MapboxGL.StyleURL.SatelliteStreet },
                { label: 'Dark', value: MapboxGL.StyleURL.Dark },
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.mapStyleOption,
                    {
                      backgroundColor:
                        mapStyleState === option.value
                          ? isDark
                            ? Colors.brand.dark
                            : Colors.brand.light
                          : 'transparent',
                    },
                  ]}
                  onPress={() =>
                    handleStyleChange(
                      option.value as
                        | MapboxGL.StyleURL.Street
                        | MapboxGL.StyleURL.Dark
                        | MapboxGL.StyleURL.SatelliteStreet
                    )
                  }
                >
                  <Text
                    style={[
                      styles.mapStyleText,
                      {
                        color: mapStyleState === option.value ? 'white' : isDark ? Colors.text.dark : Colors.text.light,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapStyle: {
    flex: 1,
  },
  tapMarker: {
    width: 20,
    height: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsMarker: {
    width: 20,
    height: 20,
    borderRadius: 20,
    backgroundColor: Colors.semantic.error,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedLocationMarker: {
    width: 16,
    height: 16,
    borderRadius: 16,
    backgroundColor: Colors.brand.dark,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    position: 'absolute',
    top: 25,
    left: 20,
    padding: 12,
    alignSelf: 'flex-start',
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  mapStyleButton: {
    position: 'absolute',
    top: 80,
    right: 20,
    padding: 12,
    alignSelf: 'flex-start',
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  savedLocationsButton: {
    position: 'absolute',
    top: 190,
    right: 20,
    padding: 12,
    alignSelf: 'flex-start',
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  bestRouteButton: {
    position: 'absolute',
    top: 135,
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignSelf: 'flex-start',
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  bestRouteButtonText: {
    color: '#fff',
  },
  travelModeSelector: {
    position: 'absolute',
    top: 80,
    left: 20,
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  travelModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  mapStyleSelector: {
    position: 'absolute',
    top: 130,
    right: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    minWidth: 150,
  },
  mapStyleOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  mapStyleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 60,
  },
  detailsBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  dangerZoneCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  dangerZoneDescription: {
    lineHeight: 20,
  },
  dangerZoneCloseButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  roadConditionCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  roadConditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roadConditionSwatch: {
    width: 14,
    height: 36,
    borderRadius: 999,
  },
  roadConditionTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
  routeStatusCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 78,
    borderRadius: 14,
    padding: 14,
    gap: 7,
    elevation: 7,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 7,
  },
  routeWarningText: {
    lineHeight: 17,
  },
  routeLegendText: {
    lineHeight: 17,
  },
  routeErrorText: {
    color: Colors.semantic.error,
  },
  clearRouteButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  legendWrapper: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    alignItems: 'flex-start',
  },
  legendToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  legendContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
    minWidth: 170,
    maxHeight: 450,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  legendScroll: {
    maxHeight: 900,
  },
  legendContent: {
    gap: 6,
    paddingBottom: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  otherLegendIcon: {
    marginHorizontal: 5,
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
});
