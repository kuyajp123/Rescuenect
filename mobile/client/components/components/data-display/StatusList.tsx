import { EmptyState } from '@/components/components/empty-state';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import type { StatusData } from '@/types/components';
import { ChevronDown } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { StatusTemplate } from '../PostTemplate/StatusTemplate';
import { Button } from '../button/Button';

interface StatusListProps {
  /**
   * Array of status updates to display
   */
  statusUpdates?: StatusData[];

  /**
   * Custom title for empty state
   */
  emptyTitle?: string;

  /**
   * Custom subtitle for empty state
   */
  emptySubtitle?: string;

  /**
   * Custom container style
   */
  containerStyle?: object;

  /**
   * Toggle filter visibility (used for scroll hide/show)
   */
  showFilter?: boolean;

  /**
   * Enable internal filtering UI
   */
  enableFilter?: boolean;
}

type FilterKey = 'all' | 'safe' | 'evacuated' | 'affected' | 'missing';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All Status' },
  { key: 'safe', label: 'Safe' },
  { key: 'evacuated', label: 'Evacuated' },
  { key: 'affected', label: 'Affected' },
  { key: 'missing', label: 'Missing' },
];

export const StatusList: React.FC<StatusListProps> = ({
  statusUpdates = [],
  emptyTitle = 'No status updates yet',
  emptySubtitle = 'Community members will share their safety status here during emergencies',
  containerStyle,
  showFilter = true,
  enableFilter = true,
}) => {
  const { isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const filterAnim = useRef(new Animated.Value(showFilter ? 1 : 0)).current;

  const filteredUpdates = useMemo(() => {
    if (!enableFilter) return statusUpdates;
    if (activeFilter === 'all') return statusUpdates;
    return statusUpdates.filter(status => status?.condition?.toLowerCase() === activeFilter);
  }, [statusUpdates, activeFilter, enableFilter]);

  const activeFilterLabel = FILTERS.find(filter => filter.key === activeFilter)?.label ?? 'All Status';

  const surfaceColor = isDark ? Colors.muted.dark.background : Colors.muted.light.background;
  const borderColor = isDark ? Colors.border.dark : Colors.border.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const mutedText = isDark ? Colors.muted.dark.text : Colors.muted.light.text;

  useEffect(() => {
    if (!showFilter || !enableFilter) {
      setShowStatusMenu(false);
    }
    Animated.timing(filterAnim, {
      toValue: showFilter && enableFilter ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [showFilter, enableFilter, filterAnim]);

  const filterHeight = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 92],
  });
  const filterMargin = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });
  const filterTranslate = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  // Show EmptyState when no status updates are available
  if (statusUpdates.length === 0) {
    return (
      <View style={[styles.container, containerStyle]}>
        <EmptyState
          title={emptyTitle}
          subtitle={emptySubtitle}
          animationSource={require('@/assets/animations/not-found.json')}
          animationSize={120}
          containerStyle={styles.emptyStateContainer}
          autoPlay={false}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {enableFilter && (
        <Animated.View
          style={{
            maxHeight: filterHeight,
            marginBottom: filterMargin,
            opacity: filterAnim,
            transform: [{ translateY: filterTranslate }],
            position: 'relative',
            zIndex: showStatusMenu ? 50 : 1,
            elevation: showStatusMenu ? 50 : 0,
            overflow: showStatusMenu ? 'visible' : 'hidden',
          }}
        >
          <View
            style={[
              styles.filterBar,
              {
                backgroundColor: surfaceColor,
                borderColor,
              },
            ]}
          >
            <View style={styles.filterGroup}>
              <Text size="xs" style={{ color: mutedText }}>
                Status
              </Text>
              <Pressable
                onPress={() => setShowStatusMenu(prev => !prev)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={({ pressed }) => [
                  styles.dropdownButton,
                  {
                    backgroundColor: isDark ? Colors.background.dark : '#ffffff',
                    borderColor,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text size="sm" style={{ color: textColor }}>
                  {activeFilterLabel}
                </Text>
                <ChevronDown size={16} color={mutedText} />
              </Pressable>

              {showStatusMenu && (
                <View
                  style={[
                    styles.dropdownMenu,
                    { borderColor, backgroundColor: isDark ? Colors.background.dark : '#fff' },
                  ]}
                >
                  {FILTERS.map(option => {
                    const isActive = option.key === activeFilter;
                    return (
                      <Button
                        key={option.key}
                        onPress={() => {
                          setActiveFilter(option.key);
                          setShowStatusMenu(false);
                        }}
                        variant={isActive ? 'solid' : 'link'}
                        style={StyleSheet.flatten([
                          styles.dropdownItem,
                          { backgroundColor: isActive ? Colors.brand.light : 'transparent' },
                        ])}
                      >
                        <Text size="sm" style={{ color: isActive ? '#ffffff' : textColor }}>
                          {option.label}
                        </Text>
                      </Button>
                    );
                  })}
                </View>
              )}
            </View>

            <Pressable
              onPress={() => {
                setActiveFilter('all');
                setShowStatusMenu(false);
              }}
              disabled={activeFilter === 'all'}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.resetButton,
                {
                  backgroundColor: activeFilter === 'all' ? surfaceColor : isDark ? Colors.background.dark : '#ffffff',
                  borderColor,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text size="sm" style={{ color: activeFilter === 'all' ? mutedText : textColor }}>
                Reset
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {filteredUpdates.length === 0 ? (
        <EmptyState
          title={
            enableFilter && statusUpdates.length > 0 && activeFilter !== 'all'
              ? `No ${activeFilterLabel} updates`
              : emptyTitle
          }
          subtitle={
            enableFilter && statusUpdates.length > 0 && activeFilter !== 'all'
              ? 'Try another status filter or check back soon'
              : emptySubtitle
          }
          animationSource={require('@/assets/animations/not-found.json')}
          animationSize={120}
          containerStyle={styles.emptyStateContainer}
          autoPlay={false}
        />
      ) : (
        filteredUpdates.map((status, index) => (
          <View key={status.uid} style={index > 0 ? styles.statusSpacing : undefined}>
            <StatusTemplate {...status} />
          </View>
        ))
      )}

      <View style={styles.reachContent}>
        <Text emphasis="light">No other content to display.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 10,
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
    overflow: 'hidden',
    gap: 10,
    zIndex: 100,
    elevation: 24,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  resetButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  statusSpacing: {
    marginTop: 10,
  },
  reachContent: {
    padding: 40,
    alignItems: 'center',
  },
});

/*
===========================================
STATUS LIST COMPONENT USAGE GUIDE
===========================================

BASIC USAGE:
-----------
import { StatusList } from '@/components/ui/PostTemplate/StatusList';

// With status updates
<StatusList statusUpdates={statusData} />

// Empty state (no status updates)
<StatusList statusUpdates={[]} />

ADVANCED USAGE:
--------------
// Custom empty state messaging
<StatusList 
  statusUpdates={[]}
  emptyTitle="All quiet in your area"
  emptySubtitle="No emergency alerts or status updates at this time"
/>

// With backend data
const [statusUpdates, setStatusUpdates] = useState([]);

useEffect(() => {
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status-updates');
      const data = await response.json();
      setStatusUpdates(data);
    } catch (error) {
      console.error('Failed to fetch status updates:', error);
    }
  };
  
  fetchStatus();
}, []);

return (
  <StatusList 
    statusUpdates={statusUpdates}
    emptyTitle="No recent status updates"
    emptySubtitle="Community members will share updates here during emergencies"
  />
);

PROPS:
------
- statusUpdates?: StatusTemplateProps[] - Array of status updates
- emptyTitle?: string - Custom empty state title
- emptySubtitle?: string - Custom empty state subtitle  
- containerStyle?: object - Custom container styling

FEATURES:
---------
✅ Automatic empty state when no status updates
✅ Custom empty state messaging
✅ Notification/alert themed animation
✅ Proper spacing between status items
✅ TypeScript support
✅ Responsive design
*/
