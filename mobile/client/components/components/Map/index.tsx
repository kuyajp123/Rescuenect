import { useCoords } from '@/store/useCoords';
import { useGetAddress } from '@/store/useGetAddress';
import { useMapSettingsStore } from '@/store/useMapSettings';
import { useStatusFormStore } from '@/store/useStatusForm';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Colors } from '@/constants/Colors';
import { useMap } from '@/contexts/MapContext';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useFocusEffect } from 'expo-router';
import { Bookmark, Ellipsis, Navigation, Settings, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
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

export interface NumberInputField {
  key: string;
  label: string;
  placeholder: string;
  value: number;
  onChangeText: (value: number) => void;
  errorText?: string;
  onIncrement?: () => void;
  onDecrement?: () => void;
  min?: number;
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

// Header actions (has data)
interface HeaderActionWithData {
  createdAt?: string | number; // Optional created at time
  leftAction?: {
    icon?: React.ReactNode;
    onPress?: () => void;
  };
  rightAction?: {
    icon?: React.ReactNode;
    onPress?: () => void;
  };
}

// header actions (no data)
interface HeaderActionNoData {
  icon?: React.ReactNode;
  onPress?: () => void;
}

export interface HeaderActionsProps {
  headerActionWithData?: HeaderActionWithData;
  headerActionNoData?: HeaderActionNoData;
}

export interface MapNewProps {
  // Bottom sheet content customization
  title?: string;
  label?: string;
  titleStyle?: any;

  // Form fields
  textInputFields?: TextInputField[];
  numberInputFields?: NumberInputField[];
  radioFields?: RadioField[];
  toggleFields?: ToggleField[];
  errMessage?: string;

  // header actions prop
  headerActions?: HeaderActionsProps;

  // Custom components
  customComponents?: React.ReactNode[];

  // Action buttons
  primaryButton?: {
    label: string;
    onPress: () => void;
    style?: any;
  };
  secondaryButton?: {
    label: string;
    onPress: () => void;
    style?: any;
  };

  // Quick action buttons (when no location selected)
  quickActionButtons?: CustomButton[];

  // Location display customization
  GPSlocationLabel?: string;
  tappedLocationLabel?: string;
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
  numberInputFields = [],
  radioFields = [],
  toggleFields = [],
  customComponents = [],
  primaryButton,
  secondaryButton,
  quickActionButtons = [
    {
      key: 'saved-location',
      label: 'saved location',
      icon: <Bookmark size={16} color={'white'} />,
      onPress: () => {},
    },
    {
      key: 'location-services',
      label: 'Turn on location',
      icon: <Navigation size={16} color={'white'} />,
      onPress: () => {},
    },
  ],
  GPSlocationLabel = 'GPS Location',
  tappedLocationLabel = 'Coordinates',
  showCoordinates = true,
  stopTracking,
  headerActions,
  snapPoints = ['14%', '90%'],
  onLocationClear,
  errMessage = '',
}: MapNewProps) => {
  const { setHasButtons } = useMapSettingsStore();
  const { mapContainer } = useMap();
  const coords = useCoords(state => state.coords);
  const oneTimeLocationCoords = useCoords(state => state.oneTimeLocationCoords);
  const { isDark } = useTheme();
  const [bottomSheetEnabled, setBottomSheetEnabled] = React.useState(false);
  const statusForm = useStatusFormStore(state => state.formData);
  const addressCoordsLoading = useGetAddress(state => state.addressCoordsLoading);
  const addressGPSLoading = useGetAddress(state => state.addressGPSLoading);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const bottomSheetIndexRef = useRef(0);

  // Single variable that handles all snap point logic
  let memoizedSnapPoints;
  // If both coordinates exist, use larger initial height
  const hasValidCoords = coords && coords.length >= 2 && coords[0] !== null && coords[1] !== null;
  const hasValidOneTimeCoords =
    oneTimeLocationCoords &&
    oneTimeLocationCoords.length >= 2 &&
    oneTimeLocationCoords[0] !== null &&
    oneTimeLocationCoords[1] !== null;

  if (hasValidCoords && hasValidOneTimeCoords) {
    memoizedSnapPoints = ['25%', '90%'];
  } else if (hasValidCoords || hasValidOneTimeCoords) {
    // If only one coordinate exists, use default from props
    memoizedSnapPoints = snapPoints;
  } else {
    // If no coordinates exist (after deletion), use 14% as initial height
    memoizedSnapPoints = ['14%', '90%'];
  }

  // Auto-snap to index 0 when no coordinates are available (after deletion)
  useEffect(() => {
    const hasValidCoords = coords && coords.length >= 2 && coords[0] !== null && coords[1] !== null;
    const hasValidOneTimeCoords =
      oneTimeLocationCoords &&
      oneTimeLocationCoords.length >= 2 &&
      oneTimeLocationCoords[0] !== null &&
      oneTimeLocationCoords[1] !== null;

    // If no coordinates exist, snap to the first snap point (14%)
    if (!hasValidCoords && !hasValidOneTimeCoords) {
      bottomSheetRef.current?.snapToIndex(0);
    }
  }, [coords, oneTimeLocationCoords]);

  // Compute values on each render
  const textValueColor = isDark ? Colors.text.dark : Colors.text.light;

  // Control bottom sheet enabled state based on coords
  useEffect(() => {
    const hasValidCoords = coords && coords.length >= 2 && coords[0] !== null && coords[1] !== null;
    const hasValidOneTimeCoords =
      oneTimeLocationCoords &&
      oneTimeLocationCoords.length >= 2 &&
      oneTimeLocationCoords[0] !== null &&
      oneTimeLocationCoords[1] !== null;

    if (hasValidCoords || hasValidOneTimeCoords) {
      setBottomSheetEnabled(true);
    } else {
      setBottomSheetEnabled(false);
    }
  }, [coords, oneTimeLocationCoords]);

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      bottomSheetIndexRef.current = 0;

      const onBackPress = () => {
        if (bottomSheetIndexRef.current > 0) {
          bottomSheetRef.current?.snapToIndex(0);
          return true; // Prevent default back action
        }
        return false; // Allow default back action (navigate to previous screen)
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // Bottom Sheet callbacks
  const handleSheetChanges = (index: number) => {
    bottomSheetIndexRef.current = index;

    if (index === 2 || index === 1) {
      setHasButtons(false);
    } else {
      Keyboard.dismiss();
      setHasButtons(true);
    }
  };

  const handleLocationClear = () => {
    bottomSheetRef.current?.snapToIndex(0);
    onLocationClear?.();
  };

  const handleClearOneTimeLocation = () => {
    bottomSheetRef.current?.snapToIndex(0);
    stopTracking?.();
  };

  const handleInputFocus = () => {
    // Only expand bottom sheet when input is focused if there's a marker coordinate
    if (coords && coords.length >= 2 && coords[0] !== null && coords[1] !== null) {
      bottomSheetRef.current?.snapToIndex(2);
    }
  };

  const renderActionContents = () => {
    const hasValidCoords = coords && coords.length >= 2 && coords[0] !== null && coords[1] !== null;
    const hasValidOneTimeCoords =
      oneTimeLocationCoords &&
      oneTimeLocationCoords.length >= 2 &&
      oneTimeLocationCoords[0] !== null &&
      oneTimeLocationCoords[1] !== null;

    // Show both coordinates if both are available
    if (hasValidCoords && hasValidOneTimeCoords) {
      return (
        <VStack space="md" style={{ width: '100%' }}>
          {/* Tapped Location */}
          <HStack style={styles.head}>
            <VStack>
              <View style={styles.textLocationName}>
                {addressCoordsLoading ? (
                  <ActivityIndicator size="large" color={Colors.brand.light} style={{ marginLeft: 8 }} />
                ) : (
                  <Text size="md">{tappedLocationLabel}</Text>
                )}
              </View>
              {showCoordinates && coords && coords.length >= 2 && coords[0] !== null && coords[1] !== null && (
                <Text emphasis="light" size="sm">
                  {`${Number(coords[1]).toFixed(6)}, ${Number(coords[0]).toFixed(6)}`}
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
              <View style={styles.textLocationName}>
                {addressGPSLoading ? (
                  <ActivityIndicator size="large" color={Colors.brand.light} style={{ marginLeft: 8 }} />
                ) : (
                  <Text size="md">{GPSlocationLabel}</Text>
                )}
              </View>
              {showCoordinates &&
                oneTimeLocationCoords &&
                oneTimeLocationCoords.length >= 2 &&
                oneTimeLocationCoords[0] !== null &&
                oneTimeLocationCoords[1] !== null && (
                  <Text emphasis="light" size="sm">
                    {`${Number(oneTimeLocationCoords[1]).toFixed(6)}, ${Number(oneTimeLocationCoords[0]).toFixed(6)}`}
                  </Text>
                )}
            </VStack>
            <Button
              width="fit"
              style={{ width: 'auto' }}
              action={'error'}
              onPress={handleClearOneTimeLocation || (() => {})}
            >
              <Text>Stop</Text>
            </Button>
          </HStack>
        </VStack>
      );
    }

    // Show only tapped coordinates if only coords is available
    if (hasValidCoords) {
      return (
        <HStack style={styles.head}>
          <VStack>
            <View style={styles.textLocationName}>
              {addressCoordsLoading ? (
                <ActivityIndicator size="large" color={Colors.brand.light} style={{ marginLeft: 8 }} />
              ) : (
                <Text size="md">{tappedLocationLabel}</Text>
              )}
            </View>
            {showCoordinates && coords && coords.length >= 2 && coords[0] !== null && coords[1] !== null && (
              <Text emphasis="light" size="sm">
                {`${Number(coords[1]).toFixed(6)}, ${Number(coords[0]).toFixed(6)}`}
              </Text>
            )}
          </VStack>
          <IconButton style={styles.button} onPress={handleLocationClear}>
            <X size={24} color={Colors.semantic.error} />
          </IconButton>
        </HStack>
      );
    }

    // Show only GPS coordinates if only oneTimeLocationCoords is available
    if (hasValidOneTimeCoords) {
      return (
        <HStack style={styles.head}>
          <VStack>
            <View style={styles.textLocationName}>
              {addressGPSLoading ? (
                <ActivityIndicator size="large" color={Colors.brand.light} style={{ marginLeft: 8 }} />
              ) : (
                <Text size="md">{GPSlocationLabel}</Text>
              )}
            </View>
            {showCoordinates &&
              oneTimeLocationCoords &&
              oneTimeLocationCoords.length >= 2 &&
              oneTimeLocationCoords[0] !== null &&
              oneTimeLocationCoords[1] !== null && (
                <Text emphasis="light" size="sm">
                  {`${Number(oneTimeLocationCoords[1]).toFixed(6)}, ${Number(oneTimeLocationCoords[0]).toFixed(6)}`}
                </Text>
              )}
          </VStack>
          <Button
            width="fit"
            style={{ width: 'auto' }}
            action={'error'}
            onPress={handleClearOneTimeLocation || (() => {})}
          >
            <Text>Stop</Text>
          </Button>
        </HStack>
      );
    }

    return (
      <View>
        <Text size="sm">{label}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={statusForm ? styles.quickActions : { marginTop: 10 }}
        >
          {quickActionButtons.length > 0 && (
            <HStack style={[styles.choices, { marginHorizontal: quickActionButtons.length > 2 ? 20 : 0 }]}>
              {quickActionButtons.map(button => (
                <Button key={button.key} style={[styles.buttons, button.style]} onPress={button.onPress}>
                  {button.icon}
                  <RNText style={styles.textColor}>{button.label}</RNText>
                </Button>
              ))}
            </HStack>
          )}
        </ScrollView>
      </View>
    );
  };

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
          handleComponent={() => {
            const hasValidCoords = coords && coords.length >= 2 && coords[0] !== null && coords[1] !== null;
            const hasValidOneTimeCoords =
              oneTimeLocationCoords &&
              oneTimeLocationCoords.length >= 2 &&
              oneTimeLocationCoords[0] !== null &&
              oneTimeLocationCoords[1] !== null;

            return (
              <View style={styles.handleContainer}>
                {(hasValidCoords || hasValidOneTimeCoords) && (
                  <View
                    style={[
                      styles.defaultHandle,
                      {
                        backgroundColor: isDark ? Colors.border.light : Colors.border.dark,
                      },
                    ]}
                  />
                )}
              </View>
            );
          }}
        >
          <BottomSheetScrollView
            style={styles.bottomSheetContent}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 20,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
          >
            <VStack space="md" className="w-full">
              {renderActionContents()}
            </VStack>

            {/* Conditional Header Actions */}
            {headerActions && (
              <>
                {headerActions.headerActionWithData ? (
                  <HStack space="4xl" style={{ marginTop: 20, alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Left Action (optional) */}
                    {headerActions.headerActionWithData.leftAction && (
                      <IconButton onPress={headerActions.headerActionWithData.leftAction.onPress || (() => {})}>
                        {headerActions.headerActionWithData.leftAction.icon || (
                          <Settings color={isDark ? Colors.icons.dark : Colors.icons.light} />
                        )}
                      </IconButton>
                    )}

                    {/* Expiration Time (center) */}
                    {headerActions.headerActionWithData.createdAt && (
                      <View
                        style={{
                          flex: 1,
                          justifyContent: 'flex-end',
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Text>{headerActions.headerActionWithData.createdAt}</Text>
                      </View>
                    )}

                    {/* Right Action (optional) */}
                    {headerActions.headerActionWithData.rightAction && (
                      <IconButton onPress={headerActions.headerActionWithData.rightAction.onPress || (() => {})}>
                        {headerActions.headerActionWithData.rightAction.icon || (
                          <Ellipsis color={isDark ? Colors.icons.dark : Colors.icons.light} />
                        )}
                      </IconButton>
                    )}
                  </HStack>
                ) : headerActions.headerActionNoData ? (
                  <HStack style={{ marginTop: 20, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <IconButton onPress={headerActions.headerActionNoData.onPress || (() => {})}>
                      {headerActions.headerActionNoData.icon || (
                        <Settings color={isDark ? Colors.icons.dark : Colors.icons.light} />
                      )}
                    </IconButton>
                  </HStack>
                ) : null}
              </>
            )}

            {/* Dynamic Form Content */}
            {((coords && coords.length >= 2 && coords[0] !== null && coords[1] !== null) ||
              (oneTimeLocationCoords &&
                oneTimeLocationCoords.length >= 2 &&
                oneTimeLocationCoords[0] !== null &&
                oneTimeLocationCoords[1] !== null)) && (
              <VStack style={styles.bottomSheetForm}>
                {/* Custom Title */}
                {title &&
                  ((coords && coords.length >= 2 && coords[0] !== null && coords[1] !== null) ||
                    (oneTimeLocationCoords &&
                      oneTimeLocationCoords.length >= 2 &&
                      oneTimeLocationCoords[0] !== null &&
                      oneTimeLocationCoords[1] !== null)) && (
                    <Text size="lg" style={[styles.bottomSheetTitle, titleStyle]}>
                      {title}
                    </Text>
                  )}

                {/* Text Input Fields */}
                {textInputFields.map(field => (
                  <VStack key={field.key} style={{ marginBottom: 12 }}>
                    <HStack>
                      <Text>{field.label}</Text>
                      {field.errorText && <Text style={styles.errorText}>{field.errorText}</Text>}
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
                        field.multiline
                          ? {
                              ...styles.textInputMultiline,
                              height: field.numberOfLines ? field.numberOfLines * 24 + 24 : 100,
                              borderColor: isDark ? Colors.border.dark : Colors.border.light,
                            }
                          : {
                              ...styles.textInput,
                              borderColor: isDark ? Colors.border.dark : Colors.border.light,
                            },
                        { color: textValueColor },
                      ]}
                    />
                  </VStack>
                ))}

                {/* Number Input Fields */}
                {numberInputFields.map(field => (
                  <VStack key={field.key} style={{ marginBottom: 12 }}>
                    <HStack>
                      <Text>{field.label}</Text>
                      {field.errorText && <Text style={styles.errorText}>{field.errorText}</Text>}
                    </HStack>
                    <TextInput
                      placeholder={field.placeholder}
                      value={field.value.toString()}
                      onChangeText={text => {
                        const num = parseInt(text) || field.min || 1;
                        field.onChangeText(num);
                      }}
                      onFocus={handleInputFocus}
                      keyboardType="numeric"
                      style={[
                        styles.textInput,
                        {
                          borderColor: isDark ? Colors.border.dark : Colors.border.light,
                          color: textValueColor,
                        },
                      ]}
                    />
                    {(field.onIncrement || field.onDecrement) && (
                      <HStack style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        {field.onDecrement && (
                          <IconButton onPress={field.onDecrement}>
                            <Text style={{ fontSize: 20, color: textValueColor }}>−</Text>
                          </IconButton>
                        )}
                        {field.onIncrement && (
                          <IconButton onPress={field.onIncrement}>
                            <Text style={{ fontSize: 20, color: textValueColor }}>+</Text>
                          </IconButton>
                        )}
                      </HStack>
                    )}
                  </VStack>
                ))}

                {/* Radio Fields */}
                {radioFields.map(field => (
                  <VStack key={field.key} style={{ marginBottom: 12 }}>
                    <HStack>
                      <Text>{field.label}</Text>
                      {field.errorText && <Text style={styles.errorText}>{field.errorText}</Text>}
                    </HStack>
                    <View style={styles.radioGroup}>
                      {field.options.map(option => (
                        <View key={option.value} style={styles.radioItem}>
                          <View style={styles.radioOption}>
                            <View
                              style={[
                                styles.radioCircle,
                                {
                                  borderColor:
                                    field.selectedValue === option.value
                                      ? Colors.brand.light
                                      : isDark
                                      ? Colors.border.dark
                                      : Colors.border.light,
                                },
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
                {toggleFields.map(field => (
                  <View key={field.key} style={styles.toggleContainer}>
                    <Text>{field.label}</Text>
                    <ToggleButton isEnabled={field.isEnabled} onToggle={field.onToggle} />
                  </View>
                ))}

                <Text
                  style={{
                    color: Colors.semantic.error,
                    marginVertical: 8,
                    textAlign: 'center',
                  }}
                >
                  {errMessage}
                </Text>

                {/* Primary Action Button */}
                {primaryButton && (
                  <Button onPress={primaryButton.onPress} style={[{ marginTop: 20 }, primaryButton.style]}>
                    <RNText style={styles.submitText}>{primaryButton.label}</RNText>
                  </Button>
                )}

                {secondaryButton && (
                  <Button onPress={secondaryButton.onPress} style={{ marginTop: 20 }} action="secondary">
                    <RNText style={styles.submitText}>{secondaryButton.label}</RNText>
                  </Button>
                )}
              </VStack>
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </KeyboardAvoidingView>
    </>
  );
};

export default Map;

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
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 12,
    alignSelf: 'flex-start', // Prevents stretching to full width
    borderRadius: 24, // Changed from '50%' to numeric value
    elevation: 5, // Android shadow
    shadowColor: '#000',
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
  textLocationName: {
    flexDirection: 'row',
    width: '85%',
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
  quickActions: {
    marginHorizontal: -20,
    marginTop: 10,
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
