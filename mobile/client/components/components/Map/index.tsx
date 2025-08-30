import { Button } from '@/components/components/button/Button';
import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper
} from '@/components/ui/actionsheet';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Image } from '@/components/ui/image';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Colors } from '@/constants/Colors';
import { useMap } from '@/contexts/MapContext';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import MapboxGL from "@rnmapbox/maps";
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef } from "react";
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HoveredButton } from '../button/Button';

const index = () => {
    const [showActionsheet, setShowActionsheet] = React.useState(false);
    const handleClose = () => setShowActionsheet(false);
    const { isDark } = useTheme();
    const { mapRef, zoomLevel, centerCoordinate, animationDuration } = useMap();

    // Bottom Sheet setup
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

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
                    <Text style={[styles.bottomSheetTitle, { color: isDark ? Colors.text.dark : Colors.text.light }]}>
                        Map Information
                    </Text>
                    
                    <HStack space="md" className="justify-center items-center">
                        <Box className="w-[50px] h-full px-2 border border-solid border-outline-300 rounded-sm">
                            <Image
                                source={{ uri: 'https://i.imgur.com/UwTLr26.png' }}
                                resizeMode="contain"
                                className="flex-1"
                            />
                        </Box>
                        <VStack className="flex-1">
                            <Text className="font-bold" style={{ color: isDark ? Colors.text.dark : Colors.text.light }}>
                                Location Details
                            </Text>
                            <Text style={{ color: isDark ? Colors.text.dark : Colors.text.light }}>
                                Additional information here
                            </Text>
                        </VStack>
                    </HStack>

                    {/* Control buttons */}
                    <HStack space="sm" className="justify-center mt-4">
                        <Button
                            variant="outline"
                            onPress={() => handleSnapPress(0)}
                        >
                            <Text>Minimize</Text>
                        </Button>
                        <Button
                            variant="outline"
                            onPress={() => handleSnapPress(1)}
                        >
                            <Text>Half</Text>
                        </Button>
                        <Button
                            variant="outline"
                            onPress={() => handleSnapPress(2)}
                        >
                            <Text>Full</Text>
                        </Button>
                    </HStack>
                </VStack>
            </BottomSheetView>
        </BottomSheet>

        {/* Keep your existing Actionsheet if needed */}
        <Actionsheet
        isOpen={showActionsheet}
        onClose={handleClose}
        snapPoints={[36]}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent className="">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack className="w-full pt-5">
            <HStack space="md" className="justify-center items-center">
              <Box className="w-[50px] h-full px-2 border border-solid border-outline-300 rounded-sm">
                <Image
                  source={{ uri: 'https://i.imgur.com/UwTLr26.png' }}
                  resizeMode="contain"
                  className="flex-1"
                />
              </Box>
              <VStack className="flex-1">
                <Text className="font-bold">Mastercard</Text>
                <Text>Card ending in 2345</Text>
              </VStack>
            </HStack>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
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
    floatingBox: {
    position: "absolute",
    bottom: 0,
    backgroundColor: "black",
    padding: 15,
    borderRadius: 12,
    elevation: 5, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
})