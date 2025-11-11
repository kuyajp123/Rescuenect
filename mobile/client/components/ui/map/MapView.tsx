import { HoveredButton } from '@/components/components/button/Button';
import { storageHelpers } from '@/components/helper/storage';
import { useCoords } from '@/components/store/useCoords';
import { useMapSettingsStore } from '@/components/store/useMapSettings';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import MapboxGL from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapIcon } from 'lucide-react-native';
import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MapViewProps {
  coords?: [number, number];
  handleMapPress?: (event: any) => void;
  onMapStyleChange?: (style: MapboxGL.StyleURL) => void;
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
  zoomLevel?: number;
  minZoomLevel?: number;
  maxZoomLevel?: number;
  followUserLocation?: boolean;
  show3DBuildings?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  coords,
  onMapStyleChange,
  handleMapPress,
  pitchEnabled = false,
  rotateEnabled = true,
  scrollEnabled = true,
  compassEnabled = true,
  zoomEnabled = true,
  showButtons = true,
  showStyleSelector = true,
  interactive = true,
  centerCoordinate = [120.7752839, 14.2919325],
  zoomLevel = 12,
  minZoomLevel = 11,
  maxZoomLevel = 20,
  followUserLocation = false,
  show3DBuildings = true,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const [showMapStyles, setShowMapStyles] = useState(false);
  const [mapStyleState, setMapStyleState] = useState<MapboxGL.StyleURL>(MapboxGL.StyleURL.Street);

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
    (style: MapboxGL.StyleURL) => {
      onMapStyleChange?.(style);
      setShowMapStyles(false);
    },
    [onMapStyleChange]
  );

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
          animationDuration={300}
          minZoomLevel={minZoomLevel}
          maxZoomLevel={maxZoomLevel}
          followUserLocation={followUserLocation}
          followZoomLevel={16}
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

        {coords && (
          <MapboxGL.PointAnnotation
            key={`tap-marker-${coords ? 'green' : 'blue'}-${coords[0]}-${coords[1]}`}
            id={`tap-marker-${coords ? 'green' : 'blue'}-${coords[0]}-${coords[1]}`}
            coordinate={coords}
          >
            <View style={[styles.tapMarker, { backgroundColor: Colors.brand.dark }]} />
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>

      {showButtons && (
        <>
          <HoveredButton
            onPress={() => router.back()}
            style={[styles.toggleButton, { backgroundColor: isDark ? Colors.border.dark : Colors.border.light }]}
          >
            <ChevronLeft size={24} color={isDark ? Colors.border.light : Colors.border.dark} />
          </HoveredButton>

          {showStyleSelector && onMapStyleChange && (
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
                  onPress={() => handleStyleChange(option.value)}
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
