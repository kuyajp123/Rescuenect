import { HoveredButton } from '@/components/components/button/Button';
import { useMapButtonStore } from '@/components/components/Map';
import { storage } from '@/components/helper/storage';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import MapboxGL from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapIcon } from 'lucide-react-native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { create } from 'zustand';

type coordTypes = [number, number] | null;

interface CoordsState {
    coords: coordTypes;
    locationCoords: coordTypes;
    oneTimeLocationCoords: coordTypes;
    followUserLocation?: boolean;
    setCoords: (coords: coordTypes) => void;
    setLocationCoords: (coords: coordTypes) => void;
    setOneTimeLocationCoords: (coords: coordTypes) => void;
    setFollowUserLocation: (follow: boolean) => void;
}

export const useCoords = create<CoordsState>((set) => ({
    coords: null,
    // locationCoords: [120.788432, 14.303068],
    locationCoords: null,
    oneTimeLocationCoords: null,
    followUserLocation: false,
    setCoords: (coords) => set({ coords }),
    setLocationCoords: (coords) => set({ locationCoords: coords }),
    setOneTimeLocationCoords: (coords) => set({ oneTimeLocationCoords: coords }),
    setFollowUserLocation: (follow) => set({ followUserLocation: follow }),
}));

type MapContextType = {
    isMapReady: boolean;
    mapContainer: React.ReactElement | null;
    coords: coordTypes;
    // locationCoords: coordTypes;
    oneTimeLocationCoords: coordTypes;
    mapStyle: MapboxGL.StyleURL;
    setMapStyle: (style: MapboxGL.StyleURL) => void;
    showMapStyles: boolean;
    toggleMapStyles: () => void;
};

type MapProviderProps = { children: React.ReactNode };

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider = ({ children }: MapProviderProps) => {
  const mapRef = useRef<MapboxGL.MapView | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const { coords, oneTimeLocationCoords, setCoords, followUserLocation } = useCoords();
  const [mapStyle, setMapStyleState] = useState<MapboxGL.StyleURL>(MapboxGL.StyleURL.Street);
  const [showMapStyles, setShowMapStyles] = useState(false);
  const { isVisible } = useMapButtonStore();
  const router = useRouter();
  const { isDark } = useTheme();

  // Load saved map style from storage
  useEffect(() => {
    const loadMapStyle = async () => {
      try {
        const savedStyle = await storage.get<string>('mapStyle');
        if (savedStyle && Object.values(MapboxGL.StyleURL).includes(savedStyle as MapboxGL.StyleURL)) {
          setMapStyleState(savedStyle as MapboxGL.StyleURL);
        }
      } catch (error) {
        console.error('Error loading map style:', error);
      }
    };
    
    loadMapStyle();
  }, []);

  const setMapStyle = useCallback(async (style: MapboxGL.StyleURL) => {
    try {
      setMapStyleState(style);
      setShowMapStyles(false);
      // Save the selected style to storage
      await storage.set('mapStyle', style);
    } catch (error) {
      console.error('Error saving map style:', error);
    }
  }, []);

  const toggleMapStyles = useCallback(() => {
    setShowMapStyles(prev => !prev);
  }, []);



    // Function that triggers when user presses the map
    const handlePress = useCallback((event: any) => {
      // Try to extract coordinates from the event
      let mapCoords = null;
      
      // Check for different possible event structures
      if (event && event.geometry && event.geometry.coordinates) {
        mapCoords = event.geometry.coordinates;
      } else if (event && event.coordinates) {
        mapCoords = event.coordinates;
      } else if (event && event.nativeEvent && event.nativeEvent.coordinate) {
        mapCoords = [event.nativeEvent.coordinate.longitude, event.nativeEvent.coordinate.latitude];
      } else {
        console.error("Could not extract coordinates from event. Event keys:", Object.keys(event || {}));
        return;
      }
      
      // Validate coordinates
      if (!mapCoords || mapCoords.length !== 2 || 
          typeof mapCoords[0] !== 'number' || typeof mapCoords[1] !== 'number') {
        console.error("Invalid coordinates:", mapCoords);
        return;
      }
      
      console.log("Setting marker coordinate to:", mapCoords);
      
      const markerCoordinate: [number, number] = [mapCoords[0], mapCoords[1]];
      setCoords(markerCoordinate);
    }, [coords, setCoords]);

  const mapContainer = useMemo(() => {
    console.log('Creating map container');
    return (
        <View style={styles.mapStyle}>
            <MapboxGL.MapView
                ref={mapRef}
                style={styles.mapStyle}
                onDidFinishLoadingMap={() => setIsMapReady(true)}
                onDidFailLoadingMap={() => setIsMapReady(false)}
                styleURL={mapStyle}
                logoEnabled={false}
                compassEnabled={true}
                compassViewPosition={1}
                compassViewMargins={{ x: 20, y: 20 }}
                onPress={handlePress}
                
            >
                {/* Add your default map children here */}
                <MapboxGL.Camera
                zoomLevel={12}
                centerCoordinate={[120.7752839, 14.2919325]} // [lng, lat]
                animationDuration={300}
                minZoomLevel={11}
                maxZoomLevel={20}
                followUserLocation={followUserLocation}
                followZoomLevel={16}
                // maxBounds={{
                //   ne: [120.8739, 14.3628],
                //   sw: [120.6989, 14.2214],
                // }}
                />
                <MapboxGL.VectorSource id="buildingSource" url="mapbox://mapbox.mapbox-streets-v8">
                <MapboxGL.FillExtrusionLayer
                    id="3d-buildings"
                    sourceLayerID="building"
                    minZoomLevel={11}
                    maxZoomLevel={20}
                    style={{
                    fillExtrusionColor: "#aaa",
                    fillExtrusionHeight: ["get", "height"],
                    fillExtrusionBase: ["get", "min_height"],
                    fillExtrusionOpacity: 0.6,
                    }}
                />
                </MapboxGL.VectorSource>
                  {oneTimeLocationCoords && coords && (
                    <>
                      <MapboxGL.PointAnnotation
                      id="user-marker"
                      coordinate={oneTimeLocationCoords}
                      >
                        <View style={styles.GpsMarker} />
                      </MapboxGL.PointAnnotation>
                      <MapboxGL.PointAnnotation
                        id="user-marker"
                        coordinate={coords}
                      >
                          <View style={styles.tapMarker} />

                      </MapboxGL.PointAnnotation>
                    </>
                  )}

                  {!coords && oneTimeLocationCoords && (
                    <MapboxGL.PointAnnotation
                      id="user-marker"
                      coordinate={oneTimeLocationCoords}
                      >
                        <View style={styles.GpsMarker} />
                      </MapboxGL.PointAnnotation>
                  )}

                  {coords && !oneTimeLocationCoords && (
                    <MapboxGL.PointAnnotation
                      id="user-marker"
                      coordinate={coords}
                      >
                        <View style={styles.tapMarker} />
                      </MapboxGL.PointAnnotation>
                  )}
                </MapboxGL.MapView>
            
            {isVisible && (
                <>
                    <HoveredButton
                        onPress={() => {
                        router.back();
                        }}
                        style={[
                            styles.toggleButton,
                            {
                            backgroundColor: isDark ? Colors.border.dark : Colors.border.light,
                            }
                        ]}
                    >
                        <ChevronLeft size={24} color={isDark ? Colors.border.light : Colors.border.dark} />
                    </HoveredButton>

                    <HoveredButton
                        onPress={toggleMapStyles}
                        style={[
                            styles.mapStyleButton,
                            {
                            backgroundColor: isDark ? Colors.border.dark : Colors.border.light,
                            }
                        ]}
                    >
                        <MapIcon size={24} color={isDark ? Colors.border.light : Colors.border.dark} />
                    </HoveredButton>

                    {showMapStyles && (
                    <View style={[
                        styles.mapStyleSelector,
                        {
                        backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
                        borderColor: isDark ? Colors.border.dark : Colors.border.light,
                        }
                    ]}>
                        {[
                        { label: 'Street', value: MapboxGL.StyleURL.Street },
                        { label: 'Satellite', value: MapboxGL.StyleURL.SatelliteStreet },
                        { label: 'Dark', value: MapboxGL.StyleURL.Dark }
                        ].map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                            styles.mapStyleOption,
                            {
                                backgroundColor: mapStyle === option.value 
                                ? (isDark ? Colors.brand.dark : Colors.brand.light)
                                : 'transparent'
                            }
                            ]}
                            onPress={() => setMapStyle(option.value)}
                        >
                            <Text style={[
                            styles.mapStyleText,
                            {
                                color: mapStyle === option.value 
                                ? 'white'
                                : (isDark ? Colors.text.dark : Colors.text.light)
                            }
                            ]}>
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
  }, [handlePress, coords, oneTimeLocationCoords, mapStyle, showMapStyles, isDark, isVisible, followUserLocation]);

    const value = {
        isMapReady,
        mapContainer,
        coords,
        oneTimeLocationCoords,
        mapStyle,
        setMapStyle,
        showMapStyles,
        toggleMapStyles
    };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within MapProvider');
  }
  return context;
};

export default MapProvider;

const styles = StyleSheet.create({
    mapStyle: {
        flex: 1,
    },
    markerImage: {
        width: 40,
        height: 40,
    },
    tapMarker: {
        width: 20,
        height: 20,
        borderRadius: 20,
        backgroundColor: Colors.brand.dark,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    GpsMarker: {
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
        position: "absolute",
        top: 25,
        left: 20,
        padding: 12,
        alignSelf: 'flex-start', // Prevents stretching to full width
        borderRadius: 24, // Changed from '50%' to numeric value
        elevation: 5, // Android shadow
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 4,
    },
    mapStyleButton: {
        position: "absolute",
        top: 80,
        right: 20,
        padding: 12,
        alignSelf: 'flex-start',
        borderRadius: 24,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 4,
    },
    mapStyleSelector: {
        position: "absolute",
        top: 130,
        right: 20,
        borderRadius: 12,
        borderWidth: 1,
        padding: 8,
        elevation: 5,
        shadowColor: "#000",
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
})