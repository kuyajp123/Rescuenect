import { HeaderBackButton } from '@/components/components/button/Button';
import { Button } from 'heroui-native';
import { ImageModal } from '@/components/components/image-modal/ImageModal';
import { StatusList } from '@/components/components/PostTemplate';
import BodyLayout from '@/components/ui/layout/Body';
import { MapView } from '@/components/ui/map/MapView';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useStatusStore } from '@/store/useCurrentStatusStore';
import type { StatusData } from '@/types/components';
import { useNavigation } from '@react-navigation/native';
import { ShapeSource, SymbolLayer } from '@rnmapbox/maps';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import type { FeatureCollection, Point } from 'geojson';
import { Dialog as HeroDialog } from 'heroui-native/dialog';
import { ChevronDown, List, MapIcon, MapPin, Maximize2, Minimize2, Phone, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView as ScrollViewType } from 'react-native';
import { Animated, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FilterKey = 'all' | 'safe' | 'evacuated' | 'affected' | 'missing';
type StatusCondition = Exclude<FilterKey, 'all'>;
type ViewMode = 'list' | 'map';

type StatusMapItem = {
  markerId: string;
  status: StatusData;
  condition: StatusCondition;
};

type StatusFeatureProperties = {
  condition: StatusCondition;
  markerId: string;
  selected: boolean;
};

type StatusFeatureCollection = FeatureCollection<Point, StatusFeatureProperties>;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All Status' },
  { key: 'safe', label: 'Safe' },
  { key: 'evacuated', label: 'Evacuated' },
  { key: 'affected', label: 'Affected' },
  { key: 'missing', label: 'Missing' },
];

const STATUS_CONDITIONS: StatusCondition[] = ['safe', 'evacuated', 'affected', 'missing'];

const STATUS_META: Record<
  StatusCondition,
  {
    label: string;
    color: string;
    markerName: string;
    markerImage: number;
  }
> = {
  safe: {
    label: 'Safe',
    color: Colors.semantic.success,
    markerName: 'status-safe-marker',
    markerImage: require('@/assets/images/marker/marker-icon-green.png'),
  },
  evacuated: {
    label: 'Evacuated',
    color: Colors.semantic.info,
    markerName: 'status-evacuated-marker',
    markerImage: require('@/assets/images/marker/marker-icon-blue.png'),
  },
  affected: {
    label: 'Affected',
    color: Colors.semantic.warning,
    markerName: 'status-affected-marker',
    markerImage: require('@/assets/images/marker/marker-icon-orange.png'),
  },
  missing: {
    label: 'Missing',
    color: Colors.semantic.error,
    markerName: 'status-missing-marker',
    markerImage: require('@/assets/images/marker/marker-icon-red.png'),
  },
};

const DEFAULT_CENTER: [number, number] = [120.750674, 14.31808];
const WORLD_TILE_SIZE = 256;

const clampNumber = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const getLatitudeRadians = (latitude: number) => {
  const sin = Math.sin((latitude * Math.PI) / 180);
  const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
  return clampNumber(radX2, -Math.PI, Math.PI) / 2;
};

const getStatusMapZoomLevel = ({
  maxLat,
  maxLng,
  minLat,
  minLng,
  viewportHeight,
  viewportWidth,
}: {
  maxLat: number;
  maxLng: number;
  minLat: number;
  minLng: number;
  viewportHeight: number;
  viewportWidth: number;
}) => {
  const latFraction = Math.max(Math.abs(getLatitudeRadians(maxLat) - getLatitudeRadians(minLat)) / Math.PI, 0.00001);
  const lngDiff = Math.max(Math.abs(maxLng - minLng), 0.002);
  const lngFraction = Math.max(lngDiff / 360, 0.00001);
  const latZoom = Math.log2(viewportHeight / WORLD_TILE_SIZE / latFraction);
  const lngZoom = Math.log2(viewportWidth / WORLD_TILE_SIZE / lngFraction);

  return clampNumber(Math.min(latZoom, lngZoom) - 0.8, 3, 14);
};

const isStatusCondition = (condition?: string | null): condition is StatusCondition => {
  return STATUS_CONDITIONS.includes((condition ?? '').toLowerCase() as StatusCondition);
};

const getStatusCondition = (status: StatusData): StatusCondition | null => {
  const condition = status.condition?.toLowerCase();
  return isStatusCondition(condition) ? condition : null;
};

const isValidCoordinate = (value: number | null | undefined) => {
  return typeof value === 'number' && Number.isFinite(value);
};

const canShowStatusOnMap = (status: StatusData) => {
  return (
    status.shareLocation !== false &&
    isValidCoordinate(status.lat) &&
    isValidCoordinate(status.lng) &&
    getStatusCondition(status) !== null
  );
};

const getStatusMarkerId = (status: StatusData, index: number) => {
  return `${status.versionId || status.parentId || status.uid || 'status'}-${index}`;
};

const formatStatusDate = (timestamp: StatusData['createdAt']) => {
  if (!timestamp) return 'Unknown time';

  const date =
    typeof timestamp === 'string'
      ? new Date(timestamp)
      : typeof (timestamp as any).toDate === 'function'
        ? (timestamp as any).toDate()
        : typeof (timestamp as any)._seconds === 'number'
          ? new Date((timestamp as any)._seconds * 1000)
          : typeof (timestamp as any).seconds === 'number'
            ? new Date((timestamp as any).seconds * 1000)
            : null;

  if (!date || Number.isNaN(date.getTime())) return 'Unknown time';

  return date.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const normalizeCategories = (value: StatusData['category'] | string | null | undefined) => {
  if (Array.isArray(value)) {
    return value.map(item => String(item)).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item)).filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return trimmed
    .split(',')
    .map(item => item.replace(/[\[\]"]+/g, '').trim())
    .filter(Boolean);
};

const formatCategoryLabel = (value: string) => {
  return value.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
};

const getDisplayName = (status: StatusData) => {
  const name = `${status.firstName ?? ''} ${status.lastName ?? ''}`.trim();
  return name || 'Community member';
};

export const StatusScreen = () => {
  const { statusData } = useStatusStore();
  const router = useRouter();
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [chromeVisible, setChromeVisible] = useState(true);
  const chromeVisibleRef = useRef(true);
  const lastOffsetRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const scrollRef = useRef<ScrollViewType>(null);
  const chromeAnim = useRef(new Animated.Value(1)).current;
  const FILTER_BAR_HEIGHT = 154;
  const FILTER_BAR_GAP = 12;
  const HEADER_HEIGHT = 52;
  const contentTopPadding = insets.top + HEADER_HEIGHT + FILTER_BAR_HEIGHT + FILTER_BAR_GAP;
  const mapTopOffset = insets.top + HEADER_HEIGHT + FILTER_BAR_HEIGHT + FILTER_BAR_GAP;
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isMapFullView, setIsMapFullView] = useState(false);

  const filteredStatusData = useMemo(() => {
    if (activeFilter === 'all') return statusData;
    return statusData.filter(status => status?.condition?.toLowerCase() === activeFilter);
  }, [statusData, activeFilter]);

  const activeFilterLabel = FILTERS.find(filter => filter.key === activeFilter)?.label ?? 'All Status';

  const mapStatusCount = useMemo(() => filteredStatusData.filter(canShowStatusOnMap).length, [filteredStatusData]);

  const setChrome = useCallback((visible: boolean) => {
    if (chromeVisibleRef.current === visible) return;
    chromeVisibleRef.current = visible;
    setChromeVisible(visible);
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (viewMode === 'map') return;

      const currentOffset = event.nativeEvent.contentOffset.y;
      const layoutHeight = event.nativeEvent.layoutMeasurement.height;
      const contentHeight = event.nativeEvent.contentSize.height;
      const maxOffset = Math.max(0, contentHeight - layoutHeight);
      const atTop = currentOffset <= 10;
      const atBottom = maxOffset > 0 && currentOffset >= maxOffset - 10;
      const delta = currentOffset - lastOffsetRef.current;
      const hideThreshold = 18;
      const showThreshold = 14;
      const canHideChrome = currentOffset > 72;
      currentOffsetRef.current = currentOffset;

      if (atTop) {
        setChrome(true);
      } else if (canHideChrome && delta > hideThreshold) {
        setChrome(false);
      } else if (delta < -showThreshold && (!atBottom || isDraggingRef.current)) {
        setChrome(true);
      }

      lastOffsetRef.current = currentOffset;
    },
    [setChrome, viewMode]
  );

  const handleScrollBeginDrag = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    const parent = navigation.getParent?.() ?? navigation;
    parent?.setOptions?.({ headerShown: false });
    return () => {
      parent?.setOptions?.({ headerShown: true });
    };
  }, [navigation]);

  useEffect(() => {
    Animated.timing(chromeAnim, {
      toValue: chromeVisible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [chromeVisible, chromeAnim]);

  useEffect(() => {
    if (!chromeVisible) {
      setShowStatusMenu(false);
    }
  }, [chromeVisible]);

  useEffect(() => {
    if (viewMode === 'map') {
      setChrome(true);
      setShowStatusMenu(false);
    }
  }, [setChrome, viewMode]);

  useEffect(() => {
    if (viewMode !== 'map' && isMapFullView) {
      setIsMapFullView(false);
    }
  }, [isMapFullView, viewMode]);

  const headerTranslate = chromeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-HEADER_HEIGHT, 0],
  });
  const filterTranslate = chromeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-(FILTER_BAR_HEIGHT + 8), 0],
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
      {viewMode === 'map' ? (
        <CommunityStatusMap
          activeFilter={activeFilter}
          activeFilterLabel={activeFilterLabel}
          bottomInset={insets.bottom}
          isFullView={isMapFullView}
          isDark={isDark}
          onToggleFullView={() => {
            setShowStatusMenu(false);
            setIsMapFullView(prev => !prev);
          }}
          safeTop={insets.top}
          statuses={filteredStatusData}
          topOffset={mapTopOffset}
        />
      ) : (
        <BodyLayout
          gap={10}
          style={{ padding: 0, paddingTop: contentTopPadding, paddingBottom: 20 }}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          scrollEventThrottle={16}
          scrollRef={scrollRef}
        >
          <StatusList
            statusUpdates={filteredStatusData}
            enableFilter={false}
            emptyTitle={activeFilter === 'all' ? 'No status updates yet' : `No ${activeFilterLabel} updates`}
            emptySubtitle={
              activeFilter === 'all'
                ? 'Community members will share their safety status here during emergencies'
                : 'Try another status filter or check back soon'
            }
          />
        </BodyLayout>
      )}

      {!(viewMode === 'map' && isMapFullView) && (
        <Animated.View
          style={[
            styles.header,
            {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
              paddingTop: insets.top,
              height: insets.top + HEADER_HEIGHT,
              opacity: chromeAnim,
              transform: [{ translateY: headerTranslate }],
            },
          ]}
        >
          <HeaderBackButton router={() => router.back()} />
        </Animated.View>
      )}

      {!(viewMode === 'map' && isMapFullView) && (
        <Animated.View
          pointerEvents={chromeVisible ? 'auto' : 'none'}
          style={[
            styles.filterWrapper,
            {
              top: insets.top + HEADER_HEIGHT + FILTER_BAR_GAP,
              backgroundColor: isDark ? Colors.muted.dark.background : Colors.muted.light.background,
              borderColor: isDark ? Colors.border.dark : Colors.border.light,
              opacity: chromeAnim,
              transform: [{ translateY: filterTranslate }],
            },
          ]}
        >
        <View style={styles.modeRow}>
          <View style={styles.modeTitleBlock}>
            <Text
              size="xs"
              numberOfLines={1}
              style={{ color: isDark ? Colors.muted.dark.text : Colors.muted.light.text }}
            >
              Community Status
            </Text>
            <Text size="sm" bold numberOfLines={1} style={{ color: isDark ? Colors.text.dark : Colors.text.light }}>
              {viewMode === 'map' ? `${mapStatusCount} on map` : `${filteredStatusData.length} updates`}
            </Text>
          </View>

          <View
            style={[
              styles.modeSegment,
              {
                backgroundColor: isDark ? Colors.background.dark : '#ffffff',
                borderColor: isDark ? Colors.border.dark : Colors.border.light,
              },
            ]}
          >
            {(['list', 'map'] as ViewMode[]).map(mode => {
              const isActive = viewMode === mode;
              const Icon = mode === 'list' ? List : MapIcon;
              return (
                <Pressable
                  key={mode}
                  onPress={() => {
                    setViewMode(mode);
                    setShowStatusMenu(false);
                  }}
                  style={({ pressed }) => [
                    styles.modeOption,
                    {
                      backgroundColor: isActive ? Colors.brand.light : 'transparent',
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Icon size={16} color={isActive ? '#ffffff' : isDark ? Colors.icons.dark : Colors.icons.light} />
                  <Text
                    size="xs"
                    bold={isActive}
                    style={{ color: isActive ? '#ffffff' : isDark ? Colors.text.dark : Colors.text.light }}
                  >
                    {mode === 'list' ? 'List' : 'Map'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.filterControlsRow}>
          <View style={styles.filterGroup}>
            <Text size="xs" style={{ color: isDark ? Colors.muted.dark.text : Colors.muted.light.text }}>
              Status
            </Text>
            <Pressable
              onPress={() => setShowStatusMenu(prev => !prev)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.dropdownButton,
                {
                  backgroundColor: isDark ? Colors.background.dark : '#ffffff',
                  borderColor: isDark ? Colors.border.dark : Colors.border.light,
                },
              ]}
            >
              <Text size="sm" style={{ color: isDark ? Colors.text.dark : Colors.text.light }}>
                {activeFilterLabel}
              </Text>
              <ChevronDown size={16} color={isDark ? Colors.muted.dark.text : Colors.muted.light.text} />
            </Pressable>

            {showStatusMenu && (
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    backgroundColor: isDark ? Colors.background.dark : '#ffffff',
                    borderColor: isDark ? Colors.border.dark : Colors.border.light,
                  },
                ]}
              >
                <View style={styles.optionRow}>
                  {FILTERS.map(option => {
                    const isActive = option.key === activeFilter;
                    return (
                      <Button
                        key={option.key}
                        variant={isActive ? 'primary' : 'tertiary'}
                        onPress={() => {
                          setActiveFilter(option.key);
                          setShowStatusMenu(false);
                        }}
                        style={StyleSheet.flatten([
                          styles.optionButton,
                          isActive ? styles.optionButtonActive : styles.optionButtonInactive,
                        ])}
                      >
                        <Text
                          size="xs"
                          style={{ color: isActive ? '#ffffff' : isDark ? Colors.text.dark : Colors.text.light }}
                        >
                          {option.label}
                        </Text>
                      </Button>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          <Button
            variant="ghost"
            onPress={() => {
              setActiveFilter('all');
              setShowStatusMenu(false);
            }}
            style={StyleSheet.flatten([
              styles.resetButton,
              {
                borderColor: isDark ? Colors.border.dark : Colors.border.light,
              },
            ])}
          >
            <Text size="sm" style={{ color: isDark ? Colors.text.dark : Colors.text.light }}>
              Reset
            </Text>
          </Button>
        </View>
        </Animated.View>
      )}
    </View>
  );
};

export { StatusScreen as status };
export default StatusScreen;

type CommunityStatusMapProps = {
  activeFilter: FilterKey;
  activeFilterLabel: string;
  bottomInset: number;
  isFullView: boolean;
  isDark: boolean;
  onToggleFullView: () => void;
  safeTop: number;
  statuses: StatusData[];
  topOffset: number;
};

const CommunityStatusMap = ({
  activeFilter,
  activeFilterLabel,
  bottomInset,
  isFullView,
  isDark,
  onToggleFullView,
  safeTop,
  statuses,
  topOffset,
}: CommunityStatusMapProps) => {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null);

  const statusMapItems = useMemo<StatusMapItem[]>(() => {
    return statuses.reduce<StatusMapItem[]>((items, status, index) => {
      if (!canShowStatusOnMap(status)) return items;

      const condition = getStatusCondition(status);
      if (!condition || !isValidCoordinate(status.lat) || !isValidCoordinate(status.lng)) return items;

      items.push({
        markerId: getStatusMarkerId(status, index),
        status,
        condition,
      });

      return items;
    }, []);
  }, [statuses]);

  const selectedItem = useMemo(() => {
    return statusMapItems.find(item => item.markerId === selectedStatusId) ?? null;
  }, [selectedStatusId, statusMapItems]);

  const selectedStatus = selectedItem?.status ?? null;

  const mapShape = useMemo<StatusFeatureCollection>(() => {
    return {
      type: 'FeatureCollection',
      features: statusMapItems.map(item => ({
        type: 'Feature',
        id: item.markerId,
        geometry: {
          type: 'Point',
          coordinates: [item.status.lng as number, item.status.lat as number],
        },
        properties: {
          condition: item.condition,
          markerId: item.markerId,
          selected: item.markerId === selectedStatusId,
        },
      })),
    };
  }, [selectedStatusId, statusMapItems]);

  const conditionCounts = useMemo(() => {
    return statusMapItems.reduce(
      (counts, item) => {
        counts[item.condition] += 1;
        return counts;
      },
      { safe: 0, evacuated: 0, affected: 0, missing: 0 } as Record<StatusCondition, number>
    );
  }, [statusMapItems]);

  const visibleLegendConditions = useMemo(() => {
    if (activeFilter !== 'all' && isStatusCondition(activeFilter)) {
      return [activeFilter];
    }

    return STATUS_CONDITIONS;
  }, [activeFilter]);

  const mapCamera = useMemo(() => {
    if (statusMapItems.length === 0) {
      return {
        centerCoordinate: DEFAULT_CENTER,
        zoomLevel: 13,
      };
    }

    const lngs = statusMapItems.map(item => item.status.lng as number);
    const lats = statusMapItems.map(item => item.status.lat as number);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const centerCoordinate: [number, number] = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
    const cameraTopOffset = isFullView ? safeTop + 72 : topOffset;
    const bottomOverlayHeight = selectedStatus
      ? Math.max(320, bottomInset + 320)
      : isFullView
        ? Math.max(70, bottomInset + 70)
        : Math.max(150, bottomInset + 150);
    const viewportWidth = Math.max(220, windowWidth - 96);
    const viewportHeight = Math.max(220, windowHeight - cameraTopOffset - bottomOverlayHeight);
    const hasSpread = Math.abs(maxLng - minLng) > 0.0001 || Math.abs(maxLat - minLat) > 0.0001;

    if (!hasSpread) {
      return {
        centerCoordinate,
        zoomLevel: 14,
      };
    }

    return {
      centerCoordinate,
      zoomLevel: getStatusMapZoomLevel({
        maxLat,
        maxLng,
        minLat,
        minLng,
        viewportHeight,
        viewportWidth,
      }),
    };
  }, [bottomInset, isFullView, safeTop, selectedStatus, statusMapItems, topOffset, windowHeight, windowWidth]);

  useEffect(() => {
    if (selectedStatusId && !selectedItem) {
      setSelectedStatusId(null);
    }
  }, [selectedItem, selectedStatusId]);

  const emptyTitle = activeFilter === 'all' ? 'No shared locations yet' : `No ${activeFilterLabel} locations`;
  const emptySubtitle =
    activeFilter === 'all'
      ? 'Statuses with shared coordinates will appear here as colored map markers.'
      : 'Try another status filter or wait for a shared location update.';

  return (
    <View style={styles.mapModeContainer}>
      <MapView
        centerCoordinate={mapCamera.centerCoordinate}
        cameraTriggerKey={`${activeFilter}-${statusMapItems.length}-${selectedStatusId ?? 'none'}`}
        compassEnabled
        compassViewMargins={{ x: 18, y: isFullView ? Math.max(20, safeTop + 16) : Math.max(24, topOffset + 10) }}
        hasAnimation={false}
        interactive
        maxBounds={null}
        maxZoomLevel={19}
        mapStyleButtonTop={isFullView ? safeTop + 74 : topOffset + 70}
        mapStyleSelectorTop={isFullView ? safeTop + 126 : topOffset + 122}
        minZoomLevel={3}
        pitchEnabled={false}
        rotateEnabled
        scrollEnabled
        showButtons={false}
        showStyleSelector
        zoomEnabled
        zoomLevel={mapCamera.zoomLevel}
      >
        {statusMapItems.length > 0 && (
          <ShapeSource
            id="community-status-source"
            shape={mapShape}
            hitbox={{ width: 48, height: 48 }}
            onPress={event => {
              const markerId = event.features?.[0]?.properties?.markerId;
              if (typeof markerId === 'string') {
                setSelectedStatusId(markerId);
              }
            }}
          >
            <SymbolLayer
              id="community-status-marker-layer"
              style={{
                iconImage: [
                  'match',
                  ['downcase', ['to-string', ['get', 'condition']]],
                  'safe',
                  STATUS_META.safe.markerName,
                  'evacuated',
                  STATUS_META.evacuated.markerName,
                  'affected',
                  STATUS_META.affected.markerName,
                  'missing',
                  STATUS_META.missing.markerName,
                  STATUS_META.safe.markerName,
                ],
                iconSize: ['case', ['==', ['get', 'selected'], true], 1.18, 1],
                iconAnchor: 'bottom',
                iconAllowOverlap: true,
                iconIgnorePlacement: true,
              }}
            />
          </ShapeSource>
        )}
      </MapView>

      <Pressable
        onPress={onToggleFullView}
        accessibilityRole="button"
        accessibilityLabel={isFullView ? 'Exit full map view' : 'Enter full map view'}
        style={({ pressed }) => [
          styles.fullViewToggle,
          {
            top: isFullView ? safeTop + 16 : topOffset + 70,
            backgroundColor: isDark ? 'rgba(23,23,23,0.94)' : 'rgba(255,255,255,0.96)',
            borderColor: isDark ? Colors.border.dark : Colors.border.light,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        {isFullView ? (
          <Minimize2 size={21} color={isDark ? Colors.icons.dark : Colors.icons.light} />
        ) : (
          <Maximize2 size={21} color={isDark ? Colors.icons.dark : Colors.icons.light} />
        )}
      </Pressable>

      {!isFullView && (
        <View
          pointerEvents="none"
          style={[
            styles.mapCountPill,
            {
              top: topOffset + 10,
              backgroundColor: isDark ? 'rgba(23,23,23,0.92)' : 'rgba(255,255,255,0.94)',
              borderColor: isDark ? Colors.border.dark : Colors.border.light,
            },
          ]}
        >
          <MapPin size={15} color={Colors.brand.light} />
          <Text size="xs" bold style={{ color: isDark ? Colors.text.dark : Colors.text.light }}>
            {statusMapItems.length} visible
          </Text>
          <Text size="xs" style={{ color: isDark ? Colors.muted.dark.text : Colors.muted.light.text }}>
            {activeFilterLabel}
          </Text>
        </View>
      )}

      {!isFullView && statusMapItems.length === 0 && (
        <View
          style={[
            styles.mapEmptyCard,
            {
              top: topOffset + 56,
              backgroundColor: isDark ? 'rgba(23,23,23,0.94)' : 'rgba(255,255,255,0.96)',
              borderColor: isDark ? Colors.border.dark : Colors.border.light,
            },
          ]}
        >
          <View style={[styles.emptyMapIcon, { backgroundColor: isDark ? Colors.muted.dark.background : '#eef6ff' }]}>
            <MapPin size={22} color={Colors.brand.light} />
          </View>
          <View style={styles.emptyMapText}>
            <Text size="md" bold style={{ color: isDark ? Colors.text.dark : Colors.text.light }}>
              {emptyTitle}
            </Text>
            <Text size="xs" style={{ color: isDark ? Colors.muted.dark.text : Colors.muted.light.text }}>
              {emptySubtitle}
            </Text>
          </View>
        </View>
      )}

      {!isFullView && !selectedStatus && statusMapItems.length > 0 && (
        <View
          style={[
            styles.mapLegend,
            {
              bottom: bottomInset + 16,
              backgroundColor: isDark ? 'rgba(23,23,23,0.92)' : 'rgba(255,255,255,0.94)',
              borderColor: isDark ? Colors.border.dark : Colors.border.light,
            },
          ]}
        >
          {visibleLegendConditions.map(condition => (
            <View key={condition} style={styles.legendItem}>
              <ExpoImage source={STATUS_META[condition].markerImage} style={styles.legendMarker} contentFit="contain" />
              <View>
                <Text size="xs" bold style={{ color: isDark ? Colors.text.dark : Colors.text.light }}>
                  {conditionCounts[condition]}
                </Text>
                <Text size="2xs" style={{ color: isDark ? Colors.muted.dark.text : Colors.muted.light.text }}>
                  {STATUS_META[condition].label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {selectedStatus && selectedItem && (
        <StatusMapDetailsDialog
          bottomInset={bottomInset}
          condition={selectedItem.condition}
          isDark={isDark}
          onClose={() => setSelectedStatusId(null)}
          status={selectedStatus}
        />
      )}
    </View>
  );
};

type StatusMapDetailsProps = {
  bottomInset: number;
  condition: StatusCondition;
  isDark: boolean;
  onClose: () => void;
  status: StatusData;
};

const StatusMapDetailsDialog = ({ bottomInset, condition, isDark, onClose, status }: StatusMapDetailsProps) => {
  const { height: windowHeight } = useWindowDimensions();
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const categories = normalizeCategories(status.category);
  const statusColor = STATUS_META[condition].color;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const mutedText = isDark ? Colors.muted.dark.text : Colors.muted.light.text;
  const surfaceColor = isDark ? Colors.background.dark : '#ffffff';
  const borderColor = isDark ? Colors.border.dark : Colors.border.light;
  const dialogMaxHeight = Math.min(430, Math.max(320, windowHeight * 0.5));

  const handleClose = () => {
    setIsImageModalVisible(false);
    onClose();
  };

  return (
    <>
      <HeroDialog
        isOpen
        onOpenChange={nextOpen => {
          if (!nextOpen) {
            handleClose();
          }
        }}
      >
        <HeroDialog.Portal
          style={[
            styles.detailDialogPortal,
            {
              paddingBottom: bottomInset + 16,
            },
          ]}
        >
          <HeroDialog.Overlay isCloseOnPress style={styles.detailDialogOverlay} />
          <HeroDialog.Content
            isSwipeable
            style={[
              styles.detailDialogContent,
              {
                maxHeight: dialogMaxHeight,
                backgroundColor: surfaceColor,
                borderColor,
              },
            ]}
          >
            <View
              style={[styles.detailHandle, { backgroundColor: isDark ? Colors.border.dark : Colors.border.medium }]}
            />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.detailHeader}>
                <View style={styles.detailProfileRow}>
                  {status.profileImage ? (
                    <ExpoImage source={{ uri: status.profileImage }} style={styles.detailAvatar} contentFit="cover" />
                  ) : (
                    <View
                      style={[
                        styles.detailAvatarFallback,
                        { backgroundColor: isDark ? Colors.border.dark : '#e0f2fe' },
                      ]}
                    >
                      <Text bold style={{ color: Colors.brand.light }}>
                        {status.firstName?.charAt(0) ?? ''}
                        {status.lastName?.charAt(0) ?? ''}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailNameBlock}>
                    <HeroDialog.Title style={[styles.detailTitle, { color: textColor }]} numberOfLines={1}>
                      {getDisplayName(status)}
                    </HeroDialog.Title>
                    <Text size="2xs" style={{ color: mutedText }}>
                      {formatStatusDate(status.createdAt)}
                    </Text>
                  </View>
                </View>

                <HeroDialog.Close
                  variant="ghost"
                  iconProps={{
                    size: 16,
                    color: isDark ? Colors.icons.dark : Colors.icons.light,
                  }}
                  style={[
                    styles.dialogCloseButton,
                    { backgroundColor: isDark ? Colors.muted.dark.background : Colors.muted.light.background },
                  ]}
                />
              </View>

              <View style={styles.detailMetaRow}>
                <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
                  <Text size="xs" bold style={{ color: '#ffffff' }}>
                    {STATUS_META[condition].label}
                  </Text>
                </View>

                {!!status.people && (
                  <View style={styles.inlineMeta}>
                    <Users size={14} color={mutedText} />
                    <Text size="xs" style={{ color: mutedText }}>
                      {status.people} {status.people === 1 ? 'person' : 'people'}
                    </Text>
                  </View>
                )}
              </View>

              {status.shareLocation !== false && status.location && (
                <View style={styles.detailInfoRow}>
                  <MapPin size={16} color={mutedText} />
                  <Text size="sm" style={[styles.detailInfoText, { color: textColor }]}>
                    {status.location}
                  </Text>
                </View>
              )}

              {status.shareContact && status.phoneNumber && (
                <View style={styles.detailInfoRow}>
                  <Phone size={16} color={mutedText} />
                  <Text size="sm" style={[styles.detailInfoText, { color: textColor }]}>
                    {status.phoneNumber}
                  </Text>
                </View>
              )}

              {categories.length > 0 && (
                <View style={styles.categoryRow}>
                  {categories.map(category => (
                    <View
                      key={category}
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor: isDark ? Colors.muted.dark.background : Colors.muted.light.background,
                          borderColor,
                        },
                      ]}
                    >
                      <Text size="2xs" style={{ color: textColor }}>
                        {formatCategoryLabel(category)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {!!status.note && (
                <Text size="sm" style={[styles.noteText, { color: textColor }]}>
                  {status.note}
                </Text>
              )}

              {!!status.image && (
                <Pressable
                  onPress={() => setIsImageModalVisible(true)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`${getDisplayName(status)} status image`}
                  style={({ pressed }) => [styles.detailImageButton, pressed && styles.detailImagePressed]}
                >
                  <ExpoImage source={{ uri: status.image }} style={styles.detailImage} contentFit="cover" />
                  <View style={styles.detailImageExpandBadge}>
                    <Maximize2 size={15} color="#ffffff" />
                  </View>
                </Pressable>
              )}
            </ScrollView>
          </HeroDialog.Content>
        </HeroDialog.Portal>
      </HeroDialog>

      {!!status.image && (
        <ImageModal
          visible={isImageModalVisible}
          imageUri={status.image}
          onClose={() => setIsImageModalVisible(false)}
          alt={`${getDisplayName(status)} status image`}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  filterWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    zIndex: 30,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modeTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  modeSegment: {
    minWidth: 160,
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  modeOption: {
    minHeight: 34,
    flex: 1,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  filterControlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  filterGroup: {
    flex: 1,
    gap: 8,
    position: 'relative',
  },
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    zIndex: 40,
    elevation: 20,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 36,
  },
  optionButtonActive: {
    borderColor: Colors.brand.light,
  },
  optionButtonInactive: {
    borderColor: Colors.border.medium,
  },
  resetButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  mapModeContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapCountPill: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    zIndex: 10,
    elevation: 5,
  },
  fullViewToggle: {
    position: 'absolute',
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  mapEmptyCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
  },
  emptyMapIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMapText: {
    flex: 1,
    gap: 3,
  },
  mapLegend: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    zIndex: 10,
    elevation: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  legendMarker: {
    width: 18,
    height: 28,
  },
  statusMarkerTouchTarget: {
    width: 48,
    height: 58,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  statusMarkerPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.96 }],
  },
  selectedMarkerHalo: {
    position: 'absolute',
    bottom: -4,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.36)',
  },
  statusMarkerImage: {
    width: 25,
    height: 41,
  },
  detailDialogPortal: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  detailDialogOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.14)',
  },
  detailDialogContent: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 18,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 0,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 18,
  },
  detailHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  detailScrollContent: {
    paddingBottom: 16,
    gap: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailProfileRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  detailAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailNameBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  dialogCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  inlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailInfoText: {
    flex: 1,
    lineHeight: 18,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  noteText: {
    lineHeight: 20,
  },
  detailImageButton: {
    height: 166,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  detailImagePressed: {
    opacity: 0.86,
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailImageExpandBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
