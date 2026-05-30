import { CommunityStatus } from '@/components/components/community-status/communityStatus';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useEarthquakeStore } from '@/store/useEarthquakeStore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native/button';
import { Activity, History, MapPin } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const HISTORY_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const getPhilippineDayKey = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

const Community = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const earthquakes = useEarthquakeStore(state => state.earthquakes);
  const [todayKey, setTodayKey] = useState(getPhilippineDayKey(Date.now()));

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

  useEffect(() => {
    const interval = setInterval(() => {
      setTodayKey(getPhilippineDayKey(Date.now()));
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Body style={{ paddingBottom: 110 }} gap={28}>
      <View>
        <Text size="3xl" bold>
          Community
        </Text>
      </View>

      <CommunityStatus />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text size="lg" bold>
              Earthquake Awareness
            </Text>
            <Text size="xs" style={styles.sectionSubtitle}>
              Today's events stay visible first. Past records are kept for calm community tracking.
            </Text>
          </View>
        </View>

        <View style={[styles.summaryRow, { borderColor: isDark ? Colors.border.dark : Colors.border.light }]}>
          <View style={styles.summaryItem}>
            <Activity size={18} color="#F97316" />
            <Text size="xs">Today</Text>
            <Text size="lg" bold>
              {todaysEarthquakes.length}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <History size={18} color={Colors.brand.dark} />
            <Text size="xs">{HISTORY_DAYS}-day history</Text>
            <Text size="lg" bold>
              {historyEarthquakes.length}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <MapPin size={18} color="#22C55E" />
            <Text size="xs">On map</Text>
            <Text size="lg" bold>
              {todaysEarthquakes.length}
            </Text>
          </View>
        </View>

        <Button style={{ borderRadius: 10, marginTop: 4 }} onPress={() => router.push('/earthquake')}>
          <Text style={{ color: '#ffffff' }} bold>
            View Earthquake Map
          </Text>
        </Button>
      </View>

      <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Text size="lg" bold>
          Evacuation Centers
        </Text>
        <Text size="xs" style={{ textAlign: 'justify' }}>
          A safe shelter for community members during emergencies. Check real-time availability, capacity, and
          facilities to make informed evacuation decisions.
        </Text>
        <Image
          source={require('../../../assets/images/images/evacuation_map.png')}
          contentFit="contain"
          style={{ width: '100%', height: 300, borderRadius: 12 }}
          accessibilityLabel="Evacuation center map illustration"
        />

        <Button style={{ borderRadius: 10 }} onPress={() => router.push('/evacuation')}>
          <Text style={{ color: '#ffffff' }} bold>
            View Evacuation Center
          </Text>
        </Button>
      </View>
    </Body>
  );
};

export default Community;

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionSubtitle: {
    opacity: 0.7,
  },
  summaryRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  summaryItem: {
    flex: 1,
    padding: 12,
    gap: 3,
    alignItems: 'flex-start',
  },
});
