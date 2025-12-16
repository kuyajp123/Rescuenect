import { HoveredButton } from '@/components/components/button/Button';
import DetailsCard from '@/components/components/card/DetailsCard';
import { storageHelpers } from '@/components/helper/storage';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { Colors } from '@/constants/Colors';
import { useMap } from '@/contexts/MapContext';
import { useTheme } from '@/contexts/ThemeContext';
import { EvacuationCenter } from '@/types/components';
import MapboxGL, { Images, ShapeSource, SymbolLayer } from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import type { FeatureCollection } from 'geojson';
import { ChevronLeft, MapIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../text';

// Get color based on earthquake severity
const getEarthquakeSeverityColor = (severity: string) => {
  switch (severity) {
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

// Get the appropriate radius image based on earthquake severity
const getEarthquakeRadiusImage = (severity: string) => {
  switch (severity) {
    case 'micro':
      return require('@/assets/images/marker/radius/micro.png');
    case 'minor':
      return require('@/assets/images/marker/radius/minor.png');
    case 'light':
      return require('@/assets/images/marker/radius/light.png');
    case 'moderate':
      return require('@/assets/images/marker/radius/moderate.png');
    case 'strong':
      return require('@/assets/images/marker/radius/strong.png');
    case 'major':
      return require('@/assets/images/marker/radius/major.png');
    case 'great':
      return require('@/assets/images/marker/radius/great.png');
    default:
      return require('@/assets/images/marker/radius/moderate.png'); // fallback
  }
};

interface EarthquakeData {
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
}

interface MapViewProps {
  coords?: { lat: number; lng: number };
  data?: EvacuationCenter[];
  earthquakeData?: EarthquakeData;
  handleMapPress?: (event: any) => void;
  onPress?: (coords: [number, number]) => void;
  showButtons?: boolean;
  showStyleSelector?: boolean;
  interactive?: boolean;
  pitchEnabled?: boolean;
  compassEnabled?: boolean;
  rotateEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  centerCoordinate?: [number, number];
  maxBounds?: [[number, number], [number, number]];
  zoomLevel?: number;
  minZoomLevel?: number;
  maxZoomLevel?: number;
  followUserLocation?: boolean;
  hasAnimation?: boolean;
  show3DBuildings?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  coords,
  data,
  earthquakeData,
  handleMapPress,
  pitchEnabled = false,
  rotateEnabled = true,
  scrollEnabled = true,
  compassEnabled = true,
  zoomEnabled = true,
  showButtons = true,
  showStyleSelector = true,
  interactive = true,
  centerCoordinate = [120.750674, 14.31808],
  maxBounds = [
    [120.735, 14.305],
    [120.765, 14.33],
  ],
  zoomLevel = 15,
  minZoomLevel = 15,
  maxZoomLevel = 19,
  followUserLocation = false,
  hasAnimation = true,
  show3DBuildings = true,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const { setMapStyle } = useMap();
  const [showMapStyles, setShowMapStyles] = useState(false);
  const [mapStyleState, setMapStyleState] = useState<MapboxGL.StyleURL>(MapboxGL.StyleURL.Street);
  const [selectedMarker, setSelectedMarker] = useState<EvacuationCenter | null>(null);

  useEffect(() => {
    const loadMapStyle = async () => {
      try {
        const savedStyle = await storageHelpers.getField(STORAGE_KEYS.USER_SETTINGS, 'mapStyle');
        if (savedStyle && Object.values(MapboxGL.StyleURL).includes(savedStyle as MapboxGL.StyleURL)) {
          setMapStyleState(savedStyle as MapboxGL.StyleURL);
        }
      } catch (error) {
        console.error('Error loading map style:', error);
      }
    };

    loadMapStyle();
  }, []);

  const toggleMapStyles = useCallback(() => {
    setShowMapStyles(prev => !prev);
  }, []);

  const handleStyleChange = useCallback(
    async (style: MapboxGL.StyleURL.Street | MapboxGL.StyleURL.Dark | MapboxGL.StyleURL.SatelliteStreet) => {
      try {
        if (setMapStyle) {
          setMapStyle(style);
        }
        setMapStyleState(style);
        setShowMapStyles(false);
        // Save the selected style to storage
        await storageHelpers.setField(STORAGE_KEYS.USER_SETTINGS, 'mapStyle', style);
      } catch (error) {
        console.error('Error saving map style:', error);
      }
    },
    []
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
        compassViewMargins={{ x: 20, y: 20 }}
        onPress={handleMapPress}
      >
        <MapboxGL.Camera
          zoomLevel={zoomLevel}
          centerCoordinate={centerCoordinate}
          maxBounds={{
            ne: [maxBounds[1][0], maxBounds[1][1]],
            sw: [maxBounds[0][0], maxBounds[0][1]],
          }}
          animationDuration={300}
          animationMode={hasAnimation ? 'flyTo' : 'none'}
          minZoomLevel={minZoomLevel}
          maxZoomLevel={maxZoomLevel}
          followUserLocation={followUserLocation}
          followZoomLevel={16}
        />

        {/* Register your icon asset here */}
        <Images
          images={{
            pin: require('@/assets/images/marker/marker-icon-blue.png'), // <-- use a PNG image instead of SVG
            earthquakeRadius: earthquakeData
              ? getEarthquakeRadiusImage(earthquakeData.severity)
              : require('@/assets/images/marker/radius/moderate.png'),
          }}
        />

        {/* Marker source */}
        {evacuationCentersGeoJson && (
          <ShapeSource
            id="marker-source"
            shape={evacuationCentersGeoJson}
            onPress={e => {
              const feature = e.features[0]; // clicked marker feature
              setSelectedMarker(
                evacuationCentersGeoJson?.features.find(f => f.id === feature.id)?.properties as EvacuationCenter
              );
            }}
          >
            <SymbolLayer
              id="marker-layer"
              style={{
                iconImage: 'pin', // matches the key from <Images>
                iconSize: 1, // adjust size here
                iconAllowOverlap: true,
                iconIgnorePlacement: true,
              }}
            />
          </ShapeSource>
        )}

        {show3DBuildings && (
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

        {coords && (
          <MapboxGL.PointAnnotation
            key={`tap-marker-${coords ? 'green' : 'blue'}-${coords.lat}-${coords.lng}`}
            id={`tap-marker-${coords ? 'green' : 'blue'}-${coords.lat}-${coords.lng}`}
            coordinate={[coords.lng, coords.lat]}
          >
            <View style={[styles.tapMarker, { backgroundColor: Colors.brand.dark }]} />
          </MapboxGL.PointAnnotation>
        )}

        {/* Earthquake radius using PNG image overlay */}
        {earthquakeData && (
          <>
            {/* Earthquake radius image using ShapeSource for better positioning */}
            <ShapeSource
              id="earthquake-radius-source"
              shape={{
                type: 'FeatureCollection',
                features: [
                  {
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: [earthquakeData.coordinates.longitude, earthquakeData.coordinates.latitude],
                    },
                    properties: {},
                  },
                ],
              }}
            >
              <SymbolLayer
                id="earthquake-radius-layer"
                style={{
                  iconImage: 'earthquakeRadius',
                  iconSize: 0.2, // Adjust size as needed
                  iconAllowOverlap: true,
                  iconIgnorePlacement: false,
                  iconOpacity: 0.4,
                }}
              />
            </ShapeSource>

            {/* Earthquake epicenter marker */}
            <MapboxGL.PointAnnotation
              id="earthquake-epicenter"
              coordinate={[earthquakeData.coordinates.longitude, earthquakeData.coordinates.latitude]}
            >
              <View
                style={[
                  styles.tapMarker,
                  {
                    backgroundColor: getEarthquakeSeverityColor(earthquakeData.severity),
                    width: 16,
                    height: 16,
                    borderWidth: 3,
                  },
                ]}
              />
            </MapboxGL.PointAnnotation>
          </>
        )}
      </MapboxGL.MapView>

      {/* Simple detail view */}
      {selectedMarker && (
        <DetailsCard selectedMarker={selectedMarker} isDark={isDark} onClose={() => setSelectedMarker(null)} />
      )}

      {showButtons && (
        <>
          <HoveredButton
            onPress={() => router.back()}
            style={[styles.toggleButton, { backgroundColor: isDark ? Colors.border.dark : Colors.border.light }]}
          >
            <ChevronLeft size={24} color={isDark ? Colors.border.light : Colors.border.dark} />
          </HoveredButton>

          {showStyleSelector && (
            <HoveredButton
              onPress={toggleMapStyles}
              style={[styles.mapStyleButton, { backgroundColor: isDark ? Colors.border.dark : Colors.border.light }]}
            >
              <MapIcon size={24} color={isDark ? Colors.border.light : Colors.border.dark} />
            </HoveredButton>
          )}

          {showMapStyles && showStyleSelector && (
            <View
              style={[
                styles.mapStyleSelector,
                {
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
});
