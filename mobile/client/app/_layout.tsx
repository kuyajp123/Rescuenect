import RootLayoutContent from '@/components/components/_layout/RootLayout';
import '@/components/components/ActionSheet/sheets';
import { FontSizeProvider } from '@/contexts/FontSizeContext';
import { HighContrastProvider } from '@/contexts/HighContrastContext';
import { MapContextNew } from '@/contexts/MapContextNew';
import { ThemeProvider } from '@/contexts/ThemeContext';
import MapboxGL from "@rnmapbox/maps";
import React from 'react';
import { StyleSheet } from 'react-native';
import { SheetProvider } from "react-native-actions-sheet";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API_TOKEN!);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.gestureHandlerContainer}>
        <ThemeProvider>
          <FontSizeProvider>
            <HighContrastProvider>
              <SheetProvider>
                <MapContextNew>
                  <RootLayoutContent />
                </MapContextNew>
              </SheetProvider>
            </HighContrastProvider>
          </FontSizeProvider>
        </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureHandlerContainer: {
    flex: 1,
  },
});