import Body from '@/components/ui/layout/Body';
import { Button, HeaderBackButton } from '@/components/components/button/Button';
import { StatusList } from '@/components/components/PostTemplate';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronDown } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStatusStore } from '@/store/useCurrentStatusStore';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FilterKey = 'all' | 'safe' | 'evacuated' | 'affected' | 'missing';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All Status' },
  { key: 'safe', label: 'Safe' },
  { key: 'evacuated', label: 'Evacuated' },
  { key: 'affected', label: 'Affected' },
  { key: 'missing', label: 'Missing' },
];

export const status = () => {
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
  const scrollRef = useRef<ScrollView>(null);
  const chromeAnim = useRef(new Animated.Value(1)).current;
  const FILTER_BAR_HEIGHT = 108;
  const FILTER_BAR_GAP = 12;
  const HEADER_HEIGHT = 52;
  const contentTopPadding =
    insets.top + (chromeVisible ? HEADER_HEIGHT + FILTER_BAR_HEIGHT + FILTER_BAR_GAP : 0);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const filteredStatusData = useMemo(() => {
    if (activeFilter === 'all') return statusData;
    return statusData.filter(status => status?.condition?.toLowerCase() === activeFilter);
  }, [statusData, activeFilter]);

  const activeFilterLabel = FILTERS.find(filter => filter.key === activeFilter)?.label ?? 'All Status';

  const setChrome = useCallback((visible: boolean) => {
    if (chromeVisibleRef.current === visible) return;
    chromeVisibleRef.current = visible;
    setChromeVisible(visible);
    const chromeDelta = FILTER_BAR_HEIGHT + HEADER_HEIGHT + FILTER_BAR_GAP;
    const delta = visible ? -chromeDelta : chromeDelta;
    const nextOffset = Math.max(0, currentOffsetRef.current + delta);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: nextOffset, animated: false });
      currentOffsetRef.current = nextOffset;
      lastOffsetRef.current = nextOffset;
    }
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentOffset = event.nativeEvent.contentOffset.y;
      const layoutHeight = event.nativeEvent.layoutMeasurement.height;
      const contentHeight = event.nativeEvent.contentSize.height;
      const maxOffset = Math.max(0, contentHeight - layoutHeight);
      const atTop = currentOffset <= 10;
      const atBottom = maxOffset > 0 && currentOffset >= maxOffset - 10;
      const delta = currentOffset - lastOffsetRef.current;
      const threshold = 6;
      currentOffsetRef.current = currentOffset;

      if (atTop) {
        setChrome(true);
      } else if (delta > threshold) {
        setChrome(false);
      } else if (delta < -threshold && (!atBottom || isDraggingRef.current)) {
        setChrome(true);
      }

      lastOffsetRef.current = currentOffset;
    },
    [setChrome]
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

  const headerTranslate = chromeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-HEADER_HEIGHT, 0],
  });
  const filterTranslate = chromeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-(FILTER_BAR_HEIGHT + 8), 0],
  });

  return (
    <View style={styles.container}>
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
                      width="fit"
                      size="md"
                      action="primary"
                      variant={isActive ? 'solid' : 'outline'}
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
          width="fit"
          size="md"
          variant="outline"
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
      </Animated.View>

      <Body
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

        
      </Body>
    </View>
  );
}

export default status;

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
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 30,
    elevation: 12,
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
});
