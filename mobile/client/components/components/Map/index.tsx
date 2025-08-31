import { HStack } from '@/components/ui/hstack';
import { InlineLoading } from '@/components/ui/loading/InlineLoading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Colors } from '@/constants/Colors';
import { useMap } from '@/contexts/MapContext';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import MapboxGL from "@rnmapbox/maps";
import { router } from 'expo-router';
import { ChevronLeft, Star, Navigation, Check, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef } from "react";
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Button, HoveredButton, IconButton } from '../button/Button';

type MapProps = {
    hasBottomSheet?: boolean;
    isMapReady: boolean;
};

const index = ({ 
  hasBottomSheet = false,
  isMapReady = false
}: MapProps) => {
    const { isDark } = useTheme();
    const { mapRef, zoomLevel, centerCoordinate, animationDuration } = useMap();

    // Bottom Sheet setup
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['15%', '90%'], []);

    // Bottom Sheet callbacks
    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
    }, []);

    const handleSnapPress = useCallback((index: number) => {
        bottomSheetRef.current?.snapToIndex(index);
    }, []);

    const handleClosePress = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    <InlineLoading visible={!isMapReady} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <MapboxGL.MapView 
            ref={mapRef}
            style={styles.map}
            onDidFinishRenderingMapFully={() => console.log("Map rendering completed")}
            onDidFailLoadingMap={() => console.error("Map loading failed")}
            styleURL={isDark ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Light}
            logoEnabled={false}
            compassEnabled={true}
            compassViewPosition={1}
            compassViewMargins={{ x: 20, y: 20 }}
        >
            <MapboxGL.Camera
              zoomLevel={zoomLevel}
              centerCoordinate={centerCoordinate}
              animationDuration={animationDuration}
              minZoomLevel={11}
              maxZoomLevel={20}
              // maxBounds={{
              //   ne: [120.8739, 14.3628],
              //   sw: [120.6989, 14.2214],
              // }}
            />
        </MapboxGL.MapView>

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

        {/* @gorhom/bottom-sheet */}
        {hasBottomSheet && (
          <BottomSheet
              ref={bottomSheetRef}
              index={0}
              snapPoints={snapPoints}
              onChange={handleSheetChanges}
              backgroundStyle={{
                  backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
              }}
              handleIndicatorStyle={{
                  backgroundColor: isDark ? Colors.border.light : Colors.border.dark,
              }}
          >
              <BottomSheetView style={styles.bottomSheetContent}>
                  <VStack space="md" className="w-full">
                    {/* <HStack style={styles.head}>
                      <Text size='md'>120.20340, 14.23420</Text>
                      <View style={styles.buttons}>
                        <IconButton style={styles.button} onPress={() => {}}>
                            <X size={24} color={Colors.semantic.error} />
                        </IconButton>
                        <IconButton style={styles.button} onPress={() => {}}>
                            <Check size={24} color={Colors.semantic.success} />
                        </IconButton>
                      </View>
                    </HStack> */}
                      <Text size='sm'>Long press on map to pin a marker</Text>
                      <HStack style={styles.choices}>
                        <Button style={styles.buttons} onPress={() => {}}>
                          <Star size={16} color={'white'} />
                          <Text>saved location</Text>
                        </Button>
                        <Button style={styles.buttons} onPress={() => {}}>
                          <Navigation size={16} color={'white'} />
                          <Text>Turn on location</Text>
                        </Button>
                      </HStack>
                  </VStack>
              </BottomSheetView>
          </BottomSheet>
        )}
    </GestureHandlerRootView>
  )
}

export default index

const styles = StyleSheet.create({
    map: { 
    flex: 1 
  },
  toggleButton: {
    position: "absolute",
    top: 20,
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
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  choices: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  bottomSheetTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    width: 'auto',
    borderRadius: 40,
  },
  button: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    width: 50,
    height: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
})