import CustomImagePicker from '@/components/components/CustomImagePicker';
import { formatContactNumber, formatName, isValidContactNumber } from '@/components/helper/commonHelpers';
import { storage } from '@/components/helper/storage';
import { StatusForm } from '@/components/shared/types/components';
import CustomRadio from '@/components/ui/CustomRadio';
import { HStack } from '@/components/ui/hstack';
import { InlineLoading } from '@/components/ui/loading/InlineLoading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Colors } from '@/constants/Colors';
import { useMap } from '@/contexts/MapContext';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import MapboxGL from "@rnmapbox/maps";
import { router } from 'expo-router';
import { Bookmark, ChevronLeft, Info, Map as MapIcon, Navigation, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Text as RNText, StyleSheet, TextInput, View } from 'react-native';
import { Button, HoveredButton, IconButton, ToggleButton } from '../button/Button';

type MapProps = {
    hasBottomSheet?: boolean;
    isMapReady: boolean;
    hasMarker?: boolean; // simulate marker
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
};

const index = ({ 
  hasBottomSheet = false,
  isMapReady = false,
  hasMarker = false,
  firstName,
  lastName,
  phoneNumber,
}: MapProps) => {
    const { isDark } = useTheme();
    const { mapRef, zoomLevel, centerCoordinate, animationDuration, isContextReady } = useMap();
    const [isMapMounted, setIsMapMounted] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [formErrors, setFormErrors] = useState<Partial<StatusForm>>({});
    const [isVisible, setIsVisible] = useState(true);
    const [mapStyle, setMapStyle] = useState(MapboxGL.StyleURL.Street);
    const [showMapStyles, setShowMapStyles] = useState(false);
    const [statusForm, setStatusForm] = useState<StatusForm>({
        firstName: firstName || '',
        lastName: lastName || '',
        status: '',
        phoneNumber: phoneNumber || '',
        lat: null,
        lng: null,
        loc: null,
        image: '',
        note: '',
        shareLocation: true,
        shareContact: true,
    });

    // Memoize computed values to prevent unnecessary re-renders
    const textValueColor = useMemo(() => isDark ? Colors.text.dark : Colors.text.light, [isDark]);

    // Bottom Sheet setup
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['14%', '90%'], []);

    // Keyboard handling
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
            setKeyboardHeight(event.endCoordinates.height);
            // Expand bottom sheet when keyboard shows and ensure it's at full height
            bottomSheetRef.current?.snapToIndex(1);
        });

        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
            // Optionally collapse back to first snap point when keyboard hides
            // bottomSheetRef.current?.snapToIndex(0);
        });

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        };
    }, []);

    // Wait for both context and component to be fully ready
    useEffect(() => {
        if (isMapReady && isContextReady) {
            const timer = setTimeout(() => {
                setIsMapMounted(true);
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [isMapReady, isContextReady]);

    // Load saved map style from storage
    useEffect(() => {
        const loadMapStyle = async () => {
            try {
                const savedStyle = await storage.get<string>('mapStyle');
                if (savedStyle && Object.values(MapboxGL.StyleURL).includes(savedStyle as MapboxGL.StyleURL)) {
                    setMapStyle(savedStyle as MapboxGL.StyleURL);
                }
            } catch (error) {
                console.error('Error loading map style:', error);
            }
        };
        
        loadMapStyle();
    }, []);

    // Bottom Sheet callbacks
    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
        if (index === 2 || index === 1) {
            setIsVisible(false);
        } else {
          setIsVisible(true);
        }
    }, []);

    const handleSnapPress = useCallback((index: number) => {
        bottomSheetRef.current?.snapToIndex(index);
    }, []);

    const handleClosePress = useCallback(() => {
        bottomSheetRef.current?.close();
    }, []);

    const handleSubmit = useCallback(() => {
        // Validate form
        const errors: Partial<StatusForm> = {};
        
        if (!statusForm.firstName.trim()) {
            errors.firstName = 'First name is required';
        }
        if (!statusForm.lastName.trim()) {
            errors.lastName = 'Last name is required';
        }
        if (!statusForm.status) {
            errors.status = 'Status is required';
        }
        if (!statusForm.phoneNumber.trim()) {
            errors.phoneNumber = 'Phone number is required';
        }
        if (!isValidContactNumber(statusForm.phoneNumber)) {
            errors.phoneNumber = 'Please enter a valid mobile number';
        }
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        
        // Submit form data
        console.log('Submitting status form:', statusForm);
        // Here you would typically send the data to your backend
    }, [statusForm]);

    const handleInputChange = useCallback((field: keyof StatusForm, value: string | boolean) => {

      if (field === 'phoneNumber' && typeof value === 'string') {
        // Format phone number if needed
        value = formatContactNumber(value);
      }
      if (field === 'firstName' && typeof value === 'string') {
        // Format first name if needed
        value = formatName(value);
      }
      if (field === 'lastName' && typeof value === 'string') {
        // Format last name if needed
        value = formatName(value);
      }
        setStatusForm(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    }, [formErrors]);

    // Memoized input handlers to prevent re-renders
    const handleFirstNameChange = useCallback((text: string) => {
        handleInputChange('firstName', text);
    }, [handleInputChange]);

    const handleLastNameChange = useCallback((text: string) => {
        handleInputChange('lastName', text);
    }, [handleInputChange]);

    const handlePhoneChange = useCallback((text: string) => {
        handleInputChange('phoneNumber', text);
    }, [handleInputChange]);

    const handleNoteChange = useCallback((text: string) => {
        handleInputChange('note', text);
    }, [handleInputChange]);

    const handleStatusChange = useCallback((value: string) => {
        handleInputChange('status', value);
    }, [handleInputChange]);

    const handleInputFocus = useCallback(() => {
        // Ensure bottom sheet is expanded when any input is focused
        bottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleMapReady = useCallback(() => {
        console.log("Map rendering completed");
        setMapError(null);
    }, []);

    const handleMapError = useCallback(() => {
        console.error("Map loading failed");
        setMapError("Failed to load map");
    }, []);

    const handleMapStyleChange = useCallback(async (styleURL: MapboxGL.StyleURL) => {
        try {
            setMapStyle(styleURL);
            setShowMapStyles(false);
            // Save the selected style to storage
            await storage.set('mapStyle', styleURL);
        } catch (error) {
            console.error('Error saving map style:', error);
        }
    }, []);

    const toggleMapStyles = useCallback(() => {
        setShowMapStyles(prev => !prev);
    }, []);

    const mapStyleOptions = useMemo(() => [
        { label: 'Street', value: MapboxGL.StyleURL.Street },
        { label: 'Satellite', value: MapboxGL.StyleURL.SatelliteStreet },
        { label: 'Dark', value: MapboxGL.StyleURL.Dark }
    ], []);

    if (!isMapReady || !isMapMounted) {
        return <InlineLoading visible={true} />;
    }

    if (mapError) {
        return (
            <View style={styles.errorContainer}>
                <Text>{mapError}</Text>
            </View>
        );
    }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={{ flex: 1 }}>
        <MapboxGL.MapView 
            ref={mapRef}
            style={styles.map}
            onDidFinishRenderingMapFully={handleMapReady}
            onDidFailLoadingMap={handleMapError}
            styleURL={mapStyle}
            logoEnabled={false}
            compassEnabled={isVisible}
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
                {mapStyleOptions.map((option) => (
                  <Button
                    key={option.value}
                    onPress={() => handleMapStyleChange(option.value)}
                    style={[
                      styles.mapStyleOption,
                      {
                        backgroundColor: mapStyle === option.value 
                          ? (isDark ? Colors.brand.dark : Colors.brand.light)
                          : 'transparent'
                      }
                    ]}
                  >
                    <Text style={{
                      color: mapStyle === option.value 
                        ? 'white'
                        : (isDark ? Colors.text.dark : Colors.text.light)
                    }}>
                      {option.label}
                    </Text>
                  </Button>
                ))}
              </View>
            )}
          </>
        )}


        {/* @gorhom/bottom-sheet */}
        {hasBottomSheet && (
          <BottomSheet
              ref={bottomSheetRef}
              index={0}
              snapPoints={snapPoints}
              onChange={handleSheetChanges}
              keyboardBehavior="extend"
              keyboardBlurBehavior="restore"
              android_keyboardInputMode="adjustResize"
              backgroundStyle={{
                  backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
              }}
              handleIndicatorStyle={{
                  backgroundColor: isDark ? Colors.border.light : Colors.border.dark,
              }}
          >
              <BottomSheetScrollView 
                style={styles.bottomSheetContent}
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                  <VStack space="md" className="w-full">
                    {/* simulate marker */}
                    {hasMarker ? (
                      <HStack style={styles.head}>
                        <VStack>
                          <Text size='md'>Bucana Sasahan</Text>
                          <Text emphasis='light' size='sm'>120.20340, 14.23420</Text>
                        </VStack>
                        <IconButton style={styles.button} onPress={() => {}}>
                            <X size={24} color={Colors.semantic.error} />
                        </IconButton>
                    </HStack>
                    ) : (
                      <>
                        <Text size='sm'>Long press on map to pin a marker</Text>
                        <HStack style={styles.choices}>
                          <Button style={styles.buttons} onPress={() => {}}>
                            <Bookmark size={16} color={'white'} />
                            <RNText style={styles.textColor}>saved location</RNText>
                          </Button>
                          <Button style={styles.buttons} onPress={() => {}}>
                            <Navigation size={16} color={'white'} />
                            <RNText style={styles.textColor}>Turn on location</RNText>
                          </Button>
                      </HStack>
                      </>
                    )}
                  </VStack>

                  <VStack style={styles.bottomSheetForm}>
                    <Text size='lg' style={styles.bottomSheetTitle}>Let us know your status during disaster!</Text>

                    <HStack>
                      <Text>First Name</Text>
                      <Text style={styles.errorText}>{formErrors.firstName}</Text>
                    </HStack>
                    <TextInput
                      placeholder="Enter your First Name"
                      value={statusForm.firstName}
                      onChangeText={handleFirstNameChange}
                      onFocus={handleInputFocus}
                      style={[styles.textInput, { color: textValueColor }]}
                    />

                    <HStack>
                      <Text>Last Name</Text>
                      <Text style={styles.errorText}>{formErrors.lastName}</Text>
                    </HStack>
                    <TextInput
                      placeholder="Enter your Last Name"
                      value={statusForm.lastName}
                      onChangeText={handleLastNameChange}
                      onFocus={handleInputFocus}
                      style={[styles.textInput, { color: textValueColor }]}
                    />

                    <HStack>
                      <Text>Set your Status</Text>
                      <Text style={styles.errorText}>{formErrors.status}</Text>
                    </HStack>
                    <View style={styles.radioGroup}>
                        <CustomRadio 
                            label="Safe" 
                            value="safe" 
                            selectedValue={statusForm.status}
                            onSelect={handleStatusChange}
                            isDark={isDark}
                            textValueColor={textValueColor}
                        />
                        <CustomRadio 
                            label="Evacuated" 
                            value="evacuated" 
                            selectedValue={statusForm.status}
                            onSelect={handleStatusChange}
                            isDark={isDark}
                            textValueColor={textValueColor}
                        />
                        <CustomRadio 
                            label="Affected" 
                            value="affected" 
                            selectedValue={statusForm.status}
                            onSelect={handleStatusChange}
                            isDark={isDark}
                            textValueColor={textValueColor}
                        />
                        <CustomRadio 
                            label="Missing" 
                            value="missing" 
                            selectedValue={statusForm.status}
                            onSelect={handleStatusChange}
                            isDark={isDark}
                            textValueColor={textValueColor}
                        />
                    </View>

                    <HStack>
                      <Text>Contact Number</Text>
                      <Text style={styles.errorText}>{formErrors.phoneNumber}</Text>
                    </HStack>
                    <TextInput
                      placeholder="Enter your Contact Number"
                      value={statusForm.phoneNumber}
                      onChangeText={handlePhoneChange}
                      onFocus={handleInputFocus}
                      style={[styles.textInput, { color: textValueColor }]}
                    />

                    <Text>Leave a Note</Text>
                    <TextInput
                      placeholder="Enter your Note"
                      editable
                      multiline
                      numberOfLines={4}
                      maxLength={500}
                      value={statusForm.note}
                      onChangeText={handleNoteChange}
                      onFocus={handleInputFocus}
                      style={[styles.textInputMultiline, { color: textValueColor }]}
                    />

                    <CustomImagePicker id="map-image-picker-actionSheet" />

                    <View style={{ marginVertical: 20 }}></View>

                    <Text>What information you want to share with community?</Text>
                    <View style={styles.toggleContainer}>
                      <Text>Share my Location</Text>
                      <ToggleButton
                        isEnabled={statusForm.shareLocation}
                        onToggle={() => handleInputChange('shareLocation', !statusForm.shareLocation)}
                      />
                    </View>
                    <View style={styles.toggleContainer}>
                      <Text>Share my Contact Number</Text>
                      <ToggleButton
                        isEnabled={statusForm.shareContact}
                        onToggle={() => handleInputChange('shareContact', !statusForm.shareContact)}
                      />
                    </View>

                    <HStack style={styles.infoContainer}>
                      <Info size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                      <Text size='2xs' emphasis='light'>All information entered here will remain visible to the admin for detailed status tracking.</Text>
                    </HStack>

                    <Button onPress={handleSubmit}>
                      <RNText style={styles.submitText}>Submit</RNText>
                    </Button>

                  </VStack>
              </BottomSheetScrollView>
          </BottomSheet>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

export default index

const styles = StyleSheet.create({
    map: { 
    flex: 1 
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    paddingBottom: 20,
  },
  choices: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
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
    borderColor: Colors.icons.light,
    width: 50,
    height: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColor: {
    color: 'white',
  },
  bottomSheetForm: {
    marginTop: 20,
    width: '100%',
    // borderWidth: 1,
    // borderColor: Colors.border.light,
  },
  bottomSheetTitle: {
    color: Colors.brand.light,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '100%',
  },
  textInputMultiline: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '100%',
    height: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 12,
    width: '100%',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '400',
  },
  radioItem: {
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
  },
  infoContainer: {
    minWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 8,
    marginBottom: 20,
  },
  errorText: {
    color: Colors.semantic.error,
    fontWeight: '400',
    marginLeft: 10,
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
    top: 80,
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
  submitText: {
    color: 'white',
    fontWeight: '600',
  },
})