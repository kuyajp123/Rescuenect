import { Text } from '@/components/ui/text';
import MapboxGL from "@rnmapbox/maps";
import { useMap } from '@/contexts/MapContext';
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HoveredButton } from '@/components/components/button/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import Body from '@/components/ui/layout/Body';

export const createStatus = () => {
  const insets = useSafeAreaInsets();
  const [isMapReady, setIsMapReady] = useState(false);
  const { isDark } = useTheme();
  const router = useRouter();
  const { mapRef, zoomLevel, centerCoordinate, animationDuration } = useMap();

  useEffect(() => {
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Body style={[
      styles.container,
      {
        paddingTop: insets.top,
        paddingBottom: 0,
      }
      ]}>
      {isMapReady && (
        <MapboxGL.MapView 
          ref={mapRef}
          style={styles.map}
          onDidFinishRenderingMapFully={() => console.log("Map rendering completed")}
          onDidFailLoadingMap={() => console.error("Map loading failed")}
          styleURL={isDark ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Light}
        >
          <MapboxGL.Camera
            zoomLevel={zoomLevel}
            centerCoordinate={centerCoordinate}
            animationDuration={animationDuration}
          />
        </MapboxGL.MapView>
      )}

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

      {/* Floating Section */}
      <View style={[
        styles.floatingBox,
        {
          bottom: Math.max(insets.bottom + 30), // Tab bar height + safe area + margin
        }
      ]}>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>Floating Section</Text>
        <Text>Some info or actions here</Text>
      </View>
    </Body>
  );
}

export default createStatus

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 0 
  },
  map: { 
    flex: 1 
  },
  floatingBox: {
    position: "absolute",
    // bottom: removed from here, now set dynamically in component
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
  toggleButton: {
    position: "absolute",
    top: 60,
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
});