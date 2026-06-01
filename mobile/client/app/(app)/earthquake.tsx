import Dialog from '@/components/ui/Dialog';
import { MapView } from '@/components/ui/map/MapView';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getClientEarthquakeMapZoomSettings,
  getClientMapCenter,
  getEarthquakeMaxBoundsFromCenter,
} from '@/helper/clientMapScope';
import { useUserData } from '@/store/useBackendResponse';
import { EarthquakeData, useEarthquakeStore } from '@/store/useEarthquakeStore';
import { useRouter } from 'expo-router';
import { Checkbox } from 'heroui-native';
import { Button } from 'heroui-native/button';
import { Activity, History, List, MapPin, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HISTORY_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const getPhilippineDayKey = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

const formatEventDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const getSeverityColor = (severity: EarthquakeData['severity']) => {
  switch (severity) {
    case 'micro':
      return '#84CC16';
    case 'minor':
      return '#EAB308';
    case 'light':
      return '#F59E0B';
    case 'moderate':
      return '#F97316';
    case 'strong':
      return '#EF4444';
    case 'major':
      return '#991B1B';
    case 'great':
      return '#450A0A';
    default:
      return '#64748B';
  }
};

const getDistance = (earthquake: EarthquakeData) => {
  return earthquake.clientImpacts?.[0]?.distanceKm ?? earthquake.distance_km ?? null;
};

const EarthquakeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const userData = useUserData(state => state.userData);
  const earthquakes = useEarthquakeStore(state => state.earthquakes);
  const [todayKey, setTodayKey] = useState(getPhilippineDayKey(Date.now()));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedEarthquake, setSelectedEarthquake] = useState<EarthquakeData | null>(null);
  const [showList, setShowList] = useState(false);
  const earthquakeZoom = useMemo(() => getClientEarthquakeMapZoomSettings(userData), [userData]);
  const center = useMemo(() => {
    return getClientMapCenter(userData);
  }, [
    userData.mapSettings?.centerLongitude,
    userData.mapSettings?.centerLatitude,
    userData.weatherLongitude,
    userData.weatherLatitude,
  ]);
  const maxBounds = useMemo(() => {
    return getEarthquakeMaxBoundsFromCenter(center, 3);
  }, [center]);

  const historyEarthquakes = useMemo(() => {
    const retentionStart = Date.now() - HISTORY_DAYS * DAY_MS;
    return earthquakes
      .filter(earthquake => typeof earthquake.time === 'number' && earthquake.time >= retentionStart)
      .sort((left, right) => right.time - left.time);
  }, [earthquakes]);

  const todaysEarthquakes = useMemo(
    () => historyEarthquakes.filter(earthquake => getPhilippineDayKey(earthquake.time) === todayKey),
    [historyEarthquakes, todayKey]
  );

  const historyIdsKey = historyEarthquakes.map(earthquake => earthquake.id).join('|');
  const todayIdsKey = todaysEarthquakes.map(earthquake => earthquake.id).join('|');
  const selectedEarthquakes = historyEarthquakes.filter(earthquake => selectedIds.has(earthquake.id));
  const firstSelectedEarthquake = selectedEarthquakes[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setTodayKey(getPhilippineDayKey(Date.now()));
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const validIds = new Set(historyEarthquakes.map(earthquake => earthquake.id));
    const todayIds = todaysEarthquakes.map(earthquake => earthquake.id);

    setSelectedIds(prev => {
      const next = new Set([...prev].filter(id => validIds.has(id)));
      todayIds.forEach(id => next.add(id));
      return next;
    });
  }, [historyIdsKey, todayIdsKey]);

  const toggleEarthquake = (earthquake: EarthquakeData, value: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (value) {
        next.add(earthquake.id);
      } else {
        next.delete(earthquake.id);
      }
      return next;
    });
    setSelectedEarthquake(earthquake);
  };

  const showToday = () => {
    setSelectedIds(new Set(todaysEarthquakes.map(earthquake => earthquake.id)));
    setSelectedEarthquake(todaysEarthquakes[0] ?? null);
  };

  const showAllHistory = () => {
    setSelectedIds(new Set(historyEarthquakes.map(earthquake => earthquake.id)));
  };

  const clearMap = () => {
    setSelectedIds(new Set());
    setSelectedEarthquake(null);
  };

  return (
    <View style={styles.container}>
      <MapView
        showButtons={true}
        showStyleSelector={true}
        show3DBuildings={false}
        earthquakeDataList={selectedEarthquakes}
        maxBounds={maxBounds}
        centerCoordinate={
          firstSelectedEarthquake
            ? [firstSelectedEarthquake.coordinates.longitude, firstSelectedEarthquake.coordinates.latitude]
            : undefined
        }
        zoomLevel={firstSelectedEarthquake ? 8 : earthquakeZoom.zoomLevel}
        minZoomLevel={earthquakeZoom.minZoomLevel}
        maxZoomLevel={earthquakeZoom.maxZoomLevel}
        onEarthquakePress={earthquakeId => {
          const earthquake = historyEarthquakes.find(item => item.id === earthquakeId);
          if (earthquake) setSelectedEarthquake(earthquake);
        }}
      />

      {/* Floating Bottom Bar (when list is collapsed) */}
      {!showList && (
        <View
          style={[
            styles.floatingBottomBar,
            {
              bottom: insets.bottom + 16,
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.92)',
              borderColor: isDark ? Colors.border.dark : Colors.border.light,
            },
          ]}
        >
          <Button style={styles.actionButton} onPress={showToday}>
            <Text style={styles.actionButtonText} bold>
              Show today
            </Text>
          </Button>
          <Button
            style={[styles.actionButtonSecondary, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}
            onPress={showAllHistory}
          >
            <Text style={{ color: isDark ? '#FFFFFF' : '#1F2937' }} bold>
              Show history
            </Text>
          </Button>
          <Button
            style={[styles.listToggleButton, { backgroundColor: Colors.brand.dark }]}
            onPress={() => setShowList(true)}
          >
            <List size={20} color="#FFFFFF" />
          </Button>
        </View>
      )}

      {/* Slide-up transculent panel for the history checklist (when list is expanded) */}
      {showList && (
        <View
          style={[
            styles.slidingPanel,
            {
              bottom: insets.bottom + 16,
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark ? Colors.border.dark : Colors.border.light,
            },
          ]}
        >
          <View style={styles.panelHeader}>
            <View>
              <Text size="lg" bold>
                Earthquake History
              </Text>
              <Text size="xs" style={styles.sectionSubtitle}>
                USGS events in your scope
              </Text>
            </View>
            <Pressable
              onPress={() => setShowList(false)}
              style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
            >
              <X size={20} color={isDark ? '#FFFFFF' : '#1F2937'} />
            </Pressable>
          </View>

          {/* Panel Statistics */}
          <View style={[styles.panelSummaryRow, { borderColor: isDark ? Colors.border.dark : Colors.border.light }]}>
            <View style={styles.panelSummaryItem}>
              <Activity size={16} color="#F97316" />
              <Text size="xs" style={styles.summaryLabel}>
                Today
              </Text>
              <Text size="sm" bold>
                {todaysEarthquakes.length}
              </Text>
            </View>
            <View style={styles.panelSummaryItem}>
              <History size={16} color={Colors.brand.dark} />
              <Text size="xs" style={styles.summaryLabel}>
                {HISTORY_DAYS}-day
              </Text>
              <Text size="sm" bold>
                {historyEarthquakes.length}
              </Text>
            </View>
            <View style={styles.panelSummaryItem}>
              <MapPin size={16} color="#22C55E" />
              <Text size="xs" style={styles.summaryLabel}>
                On map
              </Text>
              <Text size="sm" bold>
                {selectedEarthquakes.length}
              </Text>
            </View>
          </View>

          {/* Panel Filters */}
          <View style={styles.panelFilterRow}>
            <Button style={styles.panelFilterButton} onPress={showToday}>
              <Text style={styles.actionButtonText} size="xs" bold>
                Show today
              </Text>
            </Button>
            <Button
              style={[
                styles.panelFilterButtonSecondary,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' },
              ]}
              onPress={showAllHistory}
            >
              <Text style={{ color: isDark ? '#FFFFFF' : '#1F2937' }} size="xs" bold>
                Show history
              </Text>
            </Button>
            <Button style={styles.panelFilterButtonGhost} onPress={clearMap}>
              <Text size="xs" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                Clear
              </Text>
            </Button>
          </View>

          {/* Scrollable list */}
          <ScrollView
            style={styles.panelScroll}
            contentContainerStyle={styles.panelScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {historyEarthquakes.length === 0 ? (
              <View style={[styles.emptyHistory, { borderColor: isDark ? Colors.border.dark : Colors.border.light }]}>
                <Text size="sm" bold>
                  No earthquake records nearby
                </Text>
                <Text size="xs" style={styles.sectionSubtitle}>
                  We will show records here when USGS reports an earthquake in your scope.
                </Text>
              </View>
            ) : (
              historyEarthquakes.map(earthquake => {
                const isToday = getPhilippineDayKey(earthquake.time) === todayKey;
                const distance = getDistance(earthquake);

                return (
                  <Pressable
                    key={earthquake.id}
                    style={[
                      styles.historyItem,
                      {
                        borderColor: selectedIds.has(earthquake.id)
                          ? getSeverityColor(earthquake.severity)
                          : isDark
                            ? Colors.border.dark
                            : Colors.border.light,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                      },
                    ]}
                    onPress={() => setSelectedEarthquake(earthquake)}
                  >
                    <Checkbox
                      isSelected={selectedIds.has(earthquake.id)}
                      onSelectedChange={value => toggleEarthquake(earthquake, value)}
                    >
                      <Checkbox.Indicator iconProps={{ color: '#FFFFFF', size: 16, strokeWidth: 3 }} />
                    </Checkbox>
                    <View style={styles.historyContent}>
                      <View style={styles.historyTitleRow}>
                        <View
                          style={[styles.magnitudeBadge, { backgroundColor: getSeverityColor(earthquake.severity) }]}
                        >
                          <Text size="xs" bold style={{ color: '#FFFFFF' }}>
                            M{earthquake.magnitude}
                          </Text>
                        </View>
                        <Text size="xs" style={{ color: isToday ? '#F97316' : undefined }}>
                          {isToday ? 'Today' : 'Historical'}
                        </Text>
                      </View>
                      <Text size="sm" bold numberOfLines={1}>
                        {earthquake.place}
                      </Text>
                      <Text size="xs" style={styles.sectionSubtitle}>
                        {formatEventDate(earthquake.time)}
                        {typeof distance === 'number' ? ` - ${distance.toFixed(1)} km away` : ''}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {/* Details Dialog */}
      <Dialog
        modalVisible={Boolean(selectedEarthquake)}
        onClose={() => setSelectedEarthquake(null)}
        headerTitle="Earthquake record"
        primaryButtonText="Close"
        primaryButtonOnPress={() => setSelectedEarthquake(null)}
        primaryButtonVariant="solid"
        size="lg"
      >
        {selectedEarthquake && (
          <View style={styles.dialogContent}>
            <View style={[styles.dialogMagnitude, { backgroundColor: getSeverityColor(selectedEarthquake.severity) }]}>
              <Text size="xl" bold style={{ color: '#FFFFFF' }}>
                M{selectedEarthquake.magnitude}
              </Text>
            </View>
            <Text size="md" bold style={{ textAlign: 'center' }}>
              {selectedEarthquake.place}
            </Text>
            <Text size="sm" style={{ textAlign: 'center', opacity: 0.8 }}>
              Occurred {formatEventDate(selectedEarthquake.time)}
            </Text>
            <View style={styles.dialogGrid}>
              <View style={styles.dialogMetric}>
                <Text size="xs">Depth</Text>
                <Text size="sm" bold>
                  {selectedEarthquake.coordinates.depth} km
                </Text>
              </View>
              <View style={styles.dialogMetric}>
                <Text size="xs">Severity</Text>
                <Text size="sm" bold>
                  {selectedEarthquake.severity}
                </Text>
              </View>
              <View style={styles.dialogMetric}>
                <Text size="xs">Distance</Text>
                <Text size="sm" bold>
                  {typeof getDistance(selectedEarthquake) === 'number'
                    ? `${getDistance(selectedEarthquake)?.toFixed(1)} km`
                    : 'Not available'}
                </Text>
              </View>
            </View>
            {selectedEarthquake.tsunami_warning && (
              <View style={styles.tsunamiNotice}>
                <Text size="sm" bold style={{ color: '#7F1D1D' }}>
                  Tsunami warning is attached to this USGS event.
                </Text>
              </View>
            )}
          </View>
        )}
      </Dialog>
    </View>
  );
};

export default EarthquakeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingBottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  actionButton: {
    flex: 1.2,
    borderRadius: 10,
  },
  actionButtonSecondary: {
    flex: 1.2,
    borderRadius: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
  },
  listToggleButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  slidingPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 440,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionSubtitle: {
    opacity: 0.7,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelSummaryRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  panelSummaryItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
    alignItems: 'center',
  },
  summaryLabel: {
    opacity: 0.6,
  },
  panelFilterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  panelFilterButton: {
    flex: 1,
    borderRadius: 8,
    height: 36,
    paddingVertical: 0,
  },
  panelFilterButtonSecondary: {
    flex: 1,
    borderRadius: 8,
    height: 36,
    paddingVertical: 0,
  },
  panelFilterButtonGhost: {
    borderRadius: 8,
    height: 36,
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
  },
  panelScroll: {
    flex: 1,
  },
  panelScrollContent: {
    gap: 8,
    paddingBottom: 4,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  historyContent: {
    flex: 1,
    gap: 3,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  magnitudeBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  emptyHistory: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    gap: 4,
    alignItems: 'center',
  },
  dialogContent: {
    alignItems: 'center',
    gap: 12,
  },
  dialogMagnitude: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  dialogMetric: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'rgba(148,163,184,0.12)',
    gap: 2,
  },
  tsunamiNotice: {
    width: '100%',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
});
