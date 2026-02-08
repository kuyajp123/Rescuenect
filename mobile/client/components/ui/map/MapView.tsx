import { HoveredButton } from '@/components/components/button/Button';
import DetailsCard from '@/components/components/card/DetailsCard';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { Colors } from '@/constants/Colors';
import { useMap } from '@/contexts/MapContext';
import { useTheme } from '@/contexts/ThemeContext';
import { storageHelpers } from '@/helper/storage';
import { useSavedLocationsStore } from '@/store/useSavedLocationsStore';
import { CenterType, EvacuationCenter } from '@/types/components';
import MapboxGL, { Images, ShapeSource, SymbolLayer } from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import type { FeatureCollection } from 'geojson';
import { Bookmark, ChevronLeft, List, MapIcon } from 'lucide-react-native';
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

// Get the appropriate radius image based on earthquake severity
const getEarthquakeRadiusImage = (severity: string) => {
  switch (severity.toLowerCase()) {
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

type saveLocationData = {
  id: string;
  label: string;
  location: string;
  lat: number;
  lng: number;
};

interface MapViewProps {
  coords?: { lat: number; lng: number };
  data?: EvacuationCenter[];
  earthquakeData?: EarthquakeData;
  handleMapPress?: (event: any) => void;
  onPress?: (coords: [number, number]) => void;
  showButtons?: boolean;
  showStyleSelector?: boolean;
  showEvacuationLegend?: boolean;
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
  onMarkerPress?: (markerId: string) => void;
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
  showEvacuationLegend = false,
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
  onMarkerPress,
  savedLocations,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const { setMapStyle } = useMap();
  const savedLocationsFromStore = useSavedLocationsStore(state => state.savedLocations);
  const savedLocationsList = savedLocations ?? savedLocationsFromStore;
  const [showMapStyles, setShowMapStyles] = useState(false);
  const [mapStyleState, setMapStyleState] = useState<MapboxGL.StyleURL>(MapboxGL.StyleURL.Street);
  const [selectedMarker, setSelectedMarker] = useState<EvacuationCenter | null>(null);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [areMarkersReady, setAreMarkersReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showSavedLocations, setShowSavedLocations] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

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

  // Sequential loading: Wait for style -> Wait for Images -> Show Markers
  useEffect(() => {
    let timeout: NodeJS.Timeout;
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

  // Handle hardware back press
  useEffect(() => {
    const handleBackPress = () => {
      if (selectedMarker) {
        setSelectedMarker(null);
        return true; // Prevent default behavior (navigation back)
      }
      return false; // Allow default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => backHandler.remove();
  }, [selectedMarker]);

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
        setMapStyleState(style);
        setShowMapStyles(false);
        // Save the selected style to storage
        await storageHelpers.setField(STORAGE_KEYS.USER_SETTINGS, 'mapStyle', style);
      } catch (error) {
        console.error('Error saving map style:', error);
      }
    },
    [mapStyleState]
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
        onDidFinishLoadingMap={() => setIsMapReady(true)}
        onDidFailLoadingMap={() => setIsMapReady(false)}
        onDidFinishLoadingStyle={() => setIsStyleLoaded(true)}
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

        {isStyleLoaded && isMapReady && (
          <>
            {/* Register your icon asset here */}
            <Images
              images={{
                pin: require('@/assets/images/marker/marker-icon-blue.png'),
                'marker-school': require('@/assets/images/marker/evacuation-center-marker/marker-school.png'),
                'marker-barangay-hall': require('@/assets/images/marker/evacuation-center-marker/marker-barangay-hall.png'),
                'marker-gymnasium': require('@/assets/images/marker/evacuation-center-marker/marker-gymnasium.png'),
                'marker-church': require('@/assets/images/marker/evacuation-center-marker/marker-church.png'),
                'marker-government-building': require('@/assets/images/marker/evacuation-center-marker/marker-government-building.png'),
                'marker-private-facility': require('@/assets/images/marker/evacuation-center-marker/marker-private-facility.png'),
                'marker-vacant-building': require('@/assets/images/marker/evacuation-center-marker/marker-vacant-building.png'),
                'marker-covered-court': require('@/assets/images/marker/evacuation-center-marker/marker-covered-court.png'),
                'others-marker': require('@/assets/images/marker/evacuation-center-marker/others-marker.png'),
                earthquakeRadius: earthquakeData
                  ? getEarthquakeRadiusImage(earthquakeData.severity)
                  : require('@/assets/images/marker/radius/moderate.png'),
              }}
            />

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
              <MapboxGL.PointAnnotation
                key={`tap-marker-${coords ? 'green' : 'blue'}-${coords.lat}-${coords.lng}`}
                id={`tap-marker-${coords ? 'green' : 'blue'}-${coords.lat}-${coords.lng}`}
                coordinate={[coords.lng, coords.lat]}
              >
                <View style={[styles.tapMarker, { backgroundColor: Colors.brand.dark }]} />
              </MapboxGL.PointAnnotation>
            )}

            {showSavedLocations &&
              savedLocationsList.map(location => (
                <MapboxGL.PointAnnotation
                  key={`saved-location-marker-${location.id}`}
                  id={`saved-location-marker-${location.id}`}
                  coordinate={[location.lng, location.lat]}
                >
                  <View style={styles.savedLocationMarker} />
                </MapboxGL.PointAnnotation>
              ))}

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
                      iconIgnorePlacement: true,
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
          </>
        )}
      </MapboxGL.MapView>

      {/* Simple detail view */}
      {selectedMarker && (
        <View style={styles.detailsOverlay} pointerEvents="box-none">
          <Pressable style={styles.detailsBackdrop} onPress={() => setSelectedMarker(null)} />
          <DetailsCard selectedMarker={selectedMarker} isDark={isDark} onClose={() => setSelectedMarker(null)} />
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

          {savedLocationsList.length > 0 && (
            <HoveredButton
              onPress={toggleSavedLocations}
              style={[
                styles.savedLocationsButton,
                {
                  backgroundColor: showSavedLocations
                    ? Colors.brand.light
                    : isDark
                      ? Colors.border.dark
                      : Colors.border.light,
                },
              ]}
            >
              <Bookmark size={24} color={isDark ? Colors.border.light : Colors.border.dark} />
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
    top: 135,
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
