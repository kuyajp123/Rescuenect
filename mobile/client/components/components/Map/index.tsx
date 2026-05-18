import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Colors } from '@/constants/Colors';
import { useMap } from '@/contexts/MapContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCoords } from '@/store/useCoords';
import { useGetAddress } from '@/store/useGetAddress';
import { useMapSettingsStore } from '@/store/useMapSettings';
import { useStatusFormStore } from '@/store/useStatusForm';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useFocusEffect } from 'expo-router';
import { Button, Input } from 'heroui-native';
import { Bookmark, ChevronUp, Ellipsis, HelpCircle, Info, Navigation, Settings, X } from 'lucide-react-native';
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
  View,
  useWindowDimensions,
} from 'react-native';
import { IconButton, ToggleButton } from '../button/Button';

const snapPointToHeightPx = (snapPoint: string | number, containerHeight: number) => {
  if (typeof snapPoint === 'number') return snapPoint;
  const trimmed = snapPoint.trim();
  if (!trimmed.endsWith('%')) return 0;
  const value = Number(trimmed.slice(0, -1));
  if (Number.isNaN(value)) return 0;
  return (value * containerHeight) / 100;
};

// Types for flexible form fields
export interface TextInputField {
  key: string;
  label: string;
  required?: boolean;
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
  required?: boolean;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
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
  required?: boolean;
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
    text?: string;
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
  snapPoints?: (string | number)[];
  onLocationClear?: () => void;
  animateOnMapTap?: boolean;
  animateOnActionTrigger?: number;
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
  snapPoints = ['14%', '100%'],
  onLocationClear,
  errMessage = '',
  animateOnMapTap = false,
  animateOnActionTrigger = 0,
}: MapNewProps) => {
  const { setHasButtons } = useMapSettingsStore();
  const { mapContainer } = useMap();
  const coords = useCoords(state => state.coords);
  const oneTimeLocationCoords = useCoords(state => state.oneTimeLocationCoords);
  const { isDark } = useTheme();
  const [bottomSheetEnabled, setBottomSheetEnabled] = React.useState(false);
  const { height: windowHeight } = useWindowDimensions();
  const [measuredHandleHeight, setMeasuredHandleHeight] = React.useState(0);
  const [measuredActionContentsHeight, setMeasuredActionContentsHeight] = React.useState(0);
  const statusForm = useStatusFormStore(state => state.formData);
  const addressCoordsLoading = useGetAddress(state => state.addressCoordsLoading);
  const addressGPSLoading = useGetAddress(state => state.addressGPSLoading);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const bottomSheetIndexRef = useRef(0);
  const hasAnimatedMapTapRef = useRef(false);
  const mapTapAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActionAnimationRef = useRef(0);

  const hasValidCoords = coords && coords.length >= 2 && coords[0] !== null && coords[1] !== null;
  const hasValidOneTimeCoords =
    oneTimeLocationCoords &&
    oneTimeLocationCoords.length >= 2 &&
    oneTimeLocationCoords[0] !== null &&
    oneTimeLocationCoords[1] !== null;

  const handleBottomSheetHandleLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const nextHeight = Math.ceil(event.nativeEvent.layout.height);
      setMeasuredHandleHeight(prev => (Math.abs(prev - nextHeight) > 1 ? nextHeight : prev));
    },
    []
  );

  const handleActionContentsLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const nextHeight = Math.ceil(event.nativeEvent.layout.height);
      setMeasuredActionContentsHeight(prev => (Math.abs(prev - nextHeight) > 1 ? nextHeight : prev));
    },
    []
  );

  const { memoizedSnapPoints, maxSnapHeightPx } = React.useMemo(() => {
    // Base snap points logic (existing behavior)
    const baseSnapPoints: (string | number)[] =
      hasValidCoords && hasValidOneTimeCoords
        ? ['25%', '100%']
        : hasValidCoords || hasValidOneTimeCoords
          ? snapPoints
          : ['14%', '100%'];

    const maxSnapPoint = baseSnapPoints[baseSnapPoints.length - 1] ?? '100%';
    const maxHeightPx = snapPointToHeightPx(maxSnapPoint, windowHeight);

    // Only adapt the *collapsed* snap point when we are showing an address/coords block.
    if (!(hasValidCoords || hasValidOneTimeCoords)) {
      return { memoizedSnapPoints: baseSnapPoints, maxSnapHeightPx: maxHeightPx };
    }

    if (measuredActionContentsHeight <= 0 || measuredHandleHeight <= 0 || windowHeight <= 0) {
      return { memoizedSnapPoints: baseSnapPoints, maxSnapHeightPx: maxHeightPx };
    }

    const baseCollapsed = baseSnapPoints[0] ?? '14%';
    const baseCollapsedHeightPx = snapPointToHeightPx(baseCollapsed, windowHeight);
    const requiredCollapsedHeightPx = measuredHandleHeight + measuredActionContentsHeight;

    const adaptiveCollapsedHeightPx = Math.min(
      Math.ceil(Math.max(baseCollapsedHeightPx, requiredCollapsedHeightPx)),
      // Ensure collapsed height never exceeds the max snap height.
      maxHeightPx > 0 ? maxHeightPx - 1 : Number.MAX_SAFE_INTEGER
    );

    const remainingSnapPoints = baseSnapPoints.slice(1).filter(point => {
      const heightPx = snapPointToHeightPx(point, windowHeight);
      if (heightPx <= 0) return true;
      return heightPx > adaptiveCollapsedHeightPx;
    });

    const nextSnapPoints = [adaptiveCollapsedHeightPx, ...remainingSnapPoints];
    return {
      memoizedSnapPoints: nextSnapPoints,
      maxSnapHeightPx: maxHeightPx,
    };
  }, [
    hasValidCoords,
    hasValidOneTimeCoords,
    measuredActionContentsHeight,
    measuredHandleHeight,
    snapPoints,
    windowHeight,
  ]);

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

  const runMapTapBounce = useCallback(() => {
    if (mapTapAnimationTimeoutRef.current) {
      clearTimeout(mapTapAnimationTimeoutRef.current);
    }

    const collapsedSnapPoint = memoizedSnapPoints[0] ?? '14%';
    const collapsedHeightPx = snapPointToHeightPx(collapsedSnapPoint, windowHeight);
    const effectiveMaxHeightPx =
      maxSnapHeightPx || snapPointToHeightPx(memoizedSnapPoints[memoizedSnapPoints.length - 1] ?? '100%', windowHeight);

    const bounceDeltaPx = 40;
    const bounceTo =
      collapsedHeightPx > 0
        ? Math.min(
            Math.ceil(collapsedHeightPx + bounceDeltaPx),
            effectiveMaxHeightPx > 0 ? effectiveMaxHeightPx - 1 : Number.MAX_SAFE_INTEGER
          )
        : '20%';

    bottomSheetRef.current?.snapToPosition(bounceTo, { duration: 260 });
    mapTapAnimationTimeoutRef.current = setTimeout(() => {
      bottomSheetRef.current?.snapToIndex(0, { duration: 320 });
      mapTapAnimationTimeoutRef.current = null;
    }, 380);
  }, [maxSnapHeightPx, memoizedSnapPoints, windowHeight]);

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

  useEffect(() => {
    const hasValidCoords = coords && coords.length >= 2 && coords[0] !== null && coords[1] !== null;

    if (!animateOnMapTap || hasAnimatedMapTapRef.current || !hasValidCoords || !bottomSheetEnabled) {
      return;
    }

    if (bottomSheetIndexRef.current !== 0) {
      hasAnimatedMapTapRef.current = true;
      return;
    }

    hasAnimatedMapTapRef.current = true;
    runMapTapBounce();
  }, [animateOnMapTap, bottomSheetEnabled, coords, runMapTapBounce]);

  useEffect(() => {
    const hasValidCoords = coords && coords.length >= 2 && coords[0] !== null && coords[1] !== null;
    const hasValidOneTimeCoords =
      oneTimeLocationCoords &&
      oneTimeLocationCoords.length >= 2 &&
      oneTimeLocationCoords[0] !== null &&
      oneTimeLocationCoords[1] !== null;

    if (animateOnActionTrigger <= lastActionAnimationRef.current) {
      return;
    }

    if (!bottomSheetEnabled || bottomSheetIndexRef.current !== 0) {
      return;
    }

    if (!hasValidCoords && !hasValidOneTimeCoords) {
      return;
    }

    runMapTapBounce();
    lastActionAnimationRef.current = animateOnActionTrigger;
  }, [animateOnActionTrigger, bottomSheetEnabled, coords, oneTimeLocationCoords, runMapTapBounce]);

  useEffect(() => {
    return () => {
      if (mapTapAnimationTimeoutRef.current) {
        clearTimeout(mapTapAnimationTimeoutRef.current);
        mapTapAnimationTimeoutRef.current = null;
      }
    };
  }, []);

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
      bottomSheetRef.current?.expand();
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
            <IconButton
              style={[
                styles.button,
                { backgroundColor: isDark ? Colors.muted.dark.background : Colors.muted.light.background },
              ]}
              onPress={handleLocationClear}
            >
              <X size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
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
              feedbackVariant="scale"
              variant="tertiary"
              style={{
                borderRadius: 10,
                backgroundColor: isDark ? Colors.border.dark : Colors.border.light,
              }}
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
          <IconButton
            style={[
              styles.button,
              { backgroundColor: isDark ? Colors.muted.dark.background : Colors.muted.light.background },
            ]}
            onPress={handleLocationClear}
          >
            <X size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
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
            feedbackVariant="scale"
            variant="tertiary"
            style={{
              borderRadius: 10,
              backgroundColor: isDark ? Colors.border.dark : Colors.border.light,
            }}
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
          enableDynamicSizing={false}
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
            const shouldShowHandle = hasValidCoords || hasValidOneTimeCoords;

            return (
              <View style={styles.handleContainer} onLayout={handleBottomSheetHandleLayout}>
                {shouldShowHandle && <ChevronUp size={24} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
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
            <View onLayout={handleActionContentsLayout}>
              <VStack space="md" className="w-full">
                {renderActionContents()}
              </VStack>
            </View>

            {/* Conditional Header Actions */}
            {headerActions && (
              <>
                {headerActions.headerActionWithData ? (
                  <HStack space="4xl" style={{ marginTop: 20, alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Left Action (optional) */}
                    {headerActions.headerActionWithData.leftAction && (
                      <IconButton onPress={headerActions.headerActionWithData.leftAction.onPress || (() => {})}>
                        {headerActions.headerActionWithData.leftAction.icon || (
                          <HelpCircle color={isDark ? Colors.icons.dark : Colors.icons.light} />
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
                      <Button
                        style={{ borderRadius: 10 }}
                        feedbackVariant="scale"
                        variant="danger-soft"
                        onPress={headerActions.headerActionWithData.rightAction.onPress || (() => {})}
                      >
                        {headerActions.headerActionWithData.rightAction.icon || (
                          <Ellipsis color={Colors.button.error.default} />
                        )}
                        {headerActions.headerActionWithData.rightAction.text && (
                          <Button.Label>
                            <Text style={{ color: Colors.button.error.default }}>
                              {headerActions.headerActionWithData.rightAction.text}
                            </Text>
                          </Button.Label>
                        )}
                      </Button>
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text>{field.label}</Text>
                        {field.required && (
                          <Text size="md" style={{ color: Colors.semantic.error }}>
                            *
                          </Text>
                        )}
                      </View>
                      {field.errorText && <Text style={styles.errorText}>{field.errorText}</Text>}
                    </HStack>
                    <Input
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
                    <VStack>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text>{field.label}</Text>
                        {field.required && (
                          <Text size="md" style={{ color: Colors.semantic.error }}>
                            *
                          </Text>
                        )}
                      </View>
                      {field.errorText && <Text style={[styles.errorText, { marginLeft: 0 }]}>{field.errorText}</Text>}
                    </VStack>
                    <Input
                      placeholder={field.placeholder}
                      value={field.value}
                      onChangeText={field.onChangeText}
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text>{field.label}</Text>
                        {field.required && (
                          <Text size="md" style={{ color: Colors.semantic.error }}>
                            *
                          </Text>
                        )}
                      </View>
                      {field.errorText && <Text style={styles.errorText}>{field.errorText}</Text>}
                    </HStack>
                    <View style={styles.radioGroup}>
                      {field.options.map(option => (
                        <View
                          key={option.value}
                          style={styles.radioItem}
                          onTouchEnd={() => field.onSelect(option.value)}
                        >
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
                            >
                              {field.selectedValue === option.value && (
                                <View style={[styles.radioInner, { backgroundColor: Colors.brand.light }]} />
                              )}
                            </View>
                            <Text
                              size="md"
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
                <HStack key="info-banner" style={styles.infoContainer}>
                  <Info size={20} color={Colors.icons.light} />
                  <Text size="2xs" emphasis="light" style={styles.infoText}>
                    All information entered here will remain visible to the admin for detailed status tracking.
                  </Text>
                </HStack>
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
                  <Button
                    onPress={primaryButton.onPress}
                    style={[{ marginTop: 20, borderRadius: 10 }, primaryButton.style]}
                  >
                    <RNText style={styles.submitText}>{primaryButton.label}</RNText>
                  </Button>
                )}
                {secondaryButton && (
                  <Button onPress={secondaryButton.onPress} style={{ marginTop: 20, borderRadius: 10 }}>
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
    gap: 4,
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
    width: 40,
    height: 40,
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
  infoContainer: {
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
    display: 'flex',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    flexShrink: 1,
  },
});
