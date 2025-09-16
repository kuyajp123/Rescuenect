import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Colors } from '@/constants/Colors';
import { useMap } from '@/contexts/MapContext';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Bookmark, Navigation, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Text as RNText, StyleSheet, TextInput, View } from 'react-native';
import { useMapButtonStore } from '@/components/store/useMapButton';
import { Button, IconButton, ToggleButton } from '../button/Button';

// Types for flexible form fields
export interface TextInputField {
  key: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  errorText?: string;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  onFocus?: () => void;
}

export interface RadioOption {
  label: string;
  value: string;
}

export interface RadioField {
  key: string;
  label: string;
  options: RadioOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  errorText?: string;
}

export interface ToggleField {
  key: string;
  label: string;
  isEnabled: boolean;
  onToggle: () => void;
}

export interface CustomButton {
  key: string;
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  style?: any;
}

export interface MapNewProps {
  // Bottom sheet content customization
  title?: string;
  label?: string;
  titleStyle?: any;
  
  // Form fields
  textInputFields?: TextInputField[];
  radioFields?: RadioField[];
  toggleFields?: ToggleField[];
  errMessage?: string;
  
  // Custom components
  customComponents?: React.ReactNode[];
  
  // Action buttons
  primaryButton?: {
    label: string;
    onPress: () => void;
    style?: any;
  };
  
  // Quick action buttons (when no location selected)
  quickActionButtons?: CustomButton[];
  
  // Location display customization
  locationDisplayLabel?: string;
  showCoordinates?: boolean;
  
  // Location tracking functions
  stopTracking?: () => void;
  
  // Additional props
  snapPoints?: string[];
  onLocationClear?: () => void;
}

const Map = ({
  title,
  label,
  titleStyle,
  textInputFields = [],
  radioFields = [],
  toggleFields = [],
  customComponents = [],
  primaryButton,
  quickActionButtons = [
    {
      key: 'saved-location',
      label: 'saved location',
      icon: <Bookmark size={16} color={'white'} />,
      onPress: () => {}
    },
    {
      key: 'location-services',
      label: 'Turn on location',
      icon: <Navigation size={16} color={'white'} />,
      onPress: () => {}
    }
  ],
  locationDisplayLabel = "Location name here",
  showCoordinates = true,
  stopTracking,
  snapPoints = ['14%', '90%'],
  onLocationClear,
  errMessage = '',
}: MapNewProps) => {
    const { setIsVisible } = useMapButtonStore();
    const { coords, mapContainer, oneTimeLocationCoords } = useMap();
    const { isDark } = useTheme();
    const [bottomSheetEnabled, setBottomSheetEnabled] = React.useState(false);

    const bottomSheetRef = useRef<BottomSheet>(null);
    
    // Single useMemo that handles all snap point logic
    const memoizedSnapPoints = useMemo(() => {
      // If both coordinates exist, use larger initial height
      if (coords && oneTimeLocationCoords) {
        return ['20%', '90%'];
      }
      // If only one or no coordinates, use default
      return snapPoints;
    }, [coords, oneTimeLocationCoords, snapPoints]);

    // Memoize computed values to prevent unnecessary re-renders
    const textValueColor = useMemo(() => isDark ? Colors.text.dark : Colors.text.light, [isDark]);

    // Control bottom sheet enabled state based on coords
    React.useEffect(() => {
      if (coords || oneTimeLocationCoords) {
        setBottomSheetEnabled(true);
      } else {
        setBottomSheetEnabled(false);
      }
    }, [coords, oneTimeLocationCoords]);

    // Bottom Sheet callbacks
    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
        
        if (index === 2 || index === 1) {
            setIsVisible(false);
        } else {
          Keyboard.dismiss();
          setIsVisible(true);
        }
    }, [coords, setIsVisible]);

    const handleLocationClear = useCallback(() => {
        bottomSheetRef.current?.snapToIndex(0);
        onLocationClear?.();
    }, [onLocationClear]);

    const handleClearOneTimeLocation = useCallback(() => {
        bottomSheetRef.current?.snapToIndex(0);
        stopTracking?.();
    }, [stopTracking]);

    const handleInputFocus = useCallback(() => {
        // Only expand bottom sheet when input is focused if there's a marker coordinate
        if (coords) {
            bottomSheetRef.current?.snapToIndex(2);
        }
    }, [coords]);

    const renderActionContents = useCallback(() => {
      // Show both coordinates if both are available
      if (coords && oneTimeLocationCoords) {
        return (
          <VStack space="md" style={{ width: '100%' }}>
            {/* Tapped Location */}
            <HStack style={styles.head}>
              <VStack>
                <Text size='md'>Tapped Location</Text>
                {showCoordinates && (
                  <Text emphasis='light' size='sm'>
                    {`${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`}
                  </Text>
                )}
              </VStack>
              <IconButton style={styles.button} onPress={handleLocationClear}>
                  <X size={24} color={Colors.semantic.error} />
              </IconButton>
            </HStack>
            
            {/* GPS Location */}
              <HStack style={styles.head}>
                <VStack>
                  <Text size='md'>{locationDisplayLabel}</Text>
                  {showCoordinates && oneTimeLocationCoords && (
                    <Text emphasis='light' size='sm'>
                      {`${oneTimeLocationCoords[1].toFixed(6)}, ${oneTimeLocationCoords[0].toFixed(6)}`}
                    </Text>
                  )}
                </VStack>
                <Button width='fit' style={{ width: 'auto' }} action={"error"} onPress={handleClearOneTimeLocation || (() => {})}>
                    <Text>Stop</Text>
                </Button>
            </HStack>
          </VStack>
        )
      }
      
      // Show only tapped coordinates if only coords is available
      if (coords) {
        return (
          <HStack style={styles.head}>
            <VStack>
              <Text size='md'>{locationDisplayLabel}</Text>
              {showCoordinates && coords && (
                <Text emphasis='light' size='sm'>
                  {`${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`}
                </Text>
              )}
            </VStack>
            <IconButton style={styles.button} onPress={handleLocationClear}>
                <X size={24} color={Colors.semantic.error} />
            </IconButton>
          </HStack>
        )
      } 

      // Show only GPS coordinates if only oneTimeLocationCoords is available
      if (oneTimeLocationCoords) {
        return (
          <HStack style={styles.head}>
            <VStack>
              <Text size='md'>{locationDisplayLabel}</Text>
              {showCoordinates && oneTimeLocationCoords && (
                <Text emphasis='light' size='sm'>
                  {`${oneTimeLocationCoords[1].toFixed(6)}, ${oneTimeLocationCoords[0].toFixed(6)}`}
                </Text>
              )}
            </VStack>
            <Button width='fit' style={{ width: 'auto' }} action={"error"} onPress={handleClearOneTimeLocation || (() => {})}>
                <Text>Stop</Text>
            </Button>
          </HStack>
        )
      }

      return (
        <>
          <Text size='sm'>{label}</Text>
          {quickActionButtons.length > 0 && (
            <HStack style={styles.choices}>
              {quickActionButtons.map((button) => (
                <Button 
                  key={button.key}
                  style={[styles.buttons, button.style]} 
                  onPress={button.onPress}
                >
                  {button.icon}
                  <RNText style={styles.textColor}>{button.label}</RNText>
                </Button>
              ))}
            </HStack>
          )}
        </>
      )

    }, [stopTracking, coords, oneTimeLocationCoords, label, quickActionButtons, locationDisplayLabel, showCoordinates, handleLocationClear]);

  return (
    <>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        >
        {mapContainer}
        <BottomSheet
              ref={bottomSheetRef}
              index={0}
              snapPoints={memoizedSnapPoints}
              onChange={handleSheetChanges}
              keyboardBehavior="interactive"
              keyboardBlurBehavior="restore"
              android_keyboardInputMode="adjustPan"
              enableHandlePanningGesture={bottomSheetEnabled}
              enableContentPanningGesture={bottomSheetEnabled}
              backgroundStyle={{
                  backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
              }}
              handleComponent={() => (
                  <View style={styles.handleContainer}>
                      {(coords || oneTimeLocationCoords) && (
                          <View style={[
                              styles.defaultHandle,
                              {
                                  backgroundColor: isDark ? Colors.border.light : Colors.border.dark,
                              }
                          ]} />
                      )}
                  </View>
              )}
          >
            <BottomSheetScrollView 
              style={styles.bottomSheetContent}
              contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
            >
              <VStack space="md" className="w-full">
                {renderActionContents()}
              </VStack>

              {/* Dynamic Form Content */}
              {(coords || oneTimeLocationCoords) && (
                <VStack style={styles.bottomSheetForm}>
                  {/* Custom Title */}
                  {title && (coords || oneTimeLocationCoords) && (
                    <Text size='lg' style={[styles.bottomSheetTitle, titleStyle]}>
                      {title}
                    </Text>
                  )}

                  {/* Text Input Fields */}
                  {textInputFields.map((field) => (
                    <VStack key={field.key} style={{ marginBottom: 12 }}>
                      <HStack>
                        <Text>{field.label}</Text>
                        {field.errorText && (
                          <Text style={styles.errorText}>{field.errorText}</Text>
                        )}
                      </HStack>
                      <TextInput
                        placeholder={field.placeholder}
                        value={field.value}
                        onChangeText={field.onChangeText}
                        onFocus={field.onFocus || handleInputFocus}
                        multiline={field.multiline}
                        numberOfLines={field.numberOfLines}
                        maxLength={field.maxLength}
                        style={[
                          field.multiline ? styles.textInputMultiline : styles.textInput,
                          { color: textValueColor }
                        ]}
                      />
                    </VStack>
                  ))}

                  {/* Radio Fields */}
                  {radioFields.map((field) => (
                    <VStack key={field.key} style={{ marginBottom: 12 }}>
                      <HStack>
                        <Text>{field.label}</Text>
                        {field.errorText && (
                          <Text style={styles.errorText}>{field.errorText}</Text>
                        )}
                      </HStack>
                      <View style={styles.radioGroup}>
                        {field.options.map((option) => (
                          <View key={option.value} style={styles.radioItem}>
                            <View style={styles.radioOption}>
                              <View
                                style={[
                                  styles.radioCircle,
                                  {
                                    borderColor: field.selectedValue === option.value
                                      ? Colors.brand.light
                                      : (isDark ? Colors.border.dark : Colors.border.light)
                                  }
                                ]}
                                onTouchEnd={() => field.onSelect(option.value)}
                              >
                                {field.selectedValue === option.value && (
                                  <View style={[styles.radioInner, { backgroundColor: Colors.brand.light }]} />
                                )}
                              </View>
                              <Text 
                                style={[styles.radioLabel, { color: textValueColor }]}
                                onPress={() => field.onSelect(option.value)}
                              >
                                {option.label}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </VStack>
                  ))}

                  {/* Custom Components */}
                  {customComponents.map((component, index) => (
                    <View key={`custom-${index}`} style={{ marginVertical: 10 }}>
                      {component}
                    </View>
                  ))}

                  {/* Toggle Fields */}
                  {toggleFields.map((field) => (
                    <View key={field.key} style={styles.toggleContainer}>
                      <Text>{field.label}</Text>
                      <ToggleButton
                        isEnabled={field.isEnabled}
                        onToggle={field.onToggle}
                      />
                    </View>
                  ))}

                  <Text style={{ color: Colors.semantic.error, marginVertical: 8, textAlign: 'center', }}>{errMessage}</Text>

                  {/* Primary Action Button */}
                  {primaryButton && (
                    <Button 
                      onPress={primaryButton.onPress}
                      style={[{ marginTop: 20 }, primaryButton.style]}
                    >
                      <RNText style={styles.submitText}>{primaryButton.label}</RNText>
                    </Button>
                  )}
                </VStack>
              )}

            </BottomSheetScrollView>
        </BottomSheet>
      </KeyboardAvoidingView>
    </>
  )
}

export default Map

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  handleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  defaultHandle: {
    width: 30,
    height: 4,
    borderRadius: 2,
  },
   bottomSheetContent: {
    flex: 1,
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
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    paddingBottom: 20,
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
  textColor: {
    color: 'white',
  },
  // Form styles copied from Map/index.tsx
  bottomSheetForm: {
    marginTop: 20,
    width: '100%',
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
  errorText: {
    color: Colors.semantic.error,
    fontWeight: '400',
    marginLeft: 10,
  },
  submitText: {
    color: 'white',
    fontWeight: '600',
  },
});