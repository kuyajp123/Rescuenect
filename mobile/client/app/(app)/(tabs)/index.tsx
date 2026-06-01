import Announcement from '@/components/components/AnnouncementList/Announcement';
import { AdvancedCarousel } from '@/components/components/carousel/AdvancedCarousel';
import StatusIndicator from '@/components/components/data-display/StatusIndicator';
import QuickActions from '@/components/components/home/QuickActions';
import { CardWeather } from '@/components/components/weather/CardWeather';
import { Body } from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { Colors } from '@/constants/Colors';
import { storageHelpers } from '@/helper/storage';
import { syncAuthenticatedUserProfile } from '@/services/userProfileSync';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import { useEarthquakeStore } from '@/store/useEarthquakeStore';
import { useStatusFormStore } from '@/store/useStatusForm';
import { User, loggedInUser } from '@/types/components';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, View } from 'react-native';

const formatDeletionDate = (value: unknown): string | null => {
  if (!value) return null;

  const timestamp = value as { _seconds?: number; seconds?: number; toDate?: () => Date };
  const date =
    typeof value === 'number'
      ? new Date(value)
      : typeof timestamp.toDate === 'function'
        ? timestamp.toDate()
        : typeof timestamp._seconds === 'number'
          ? new Date(timestamp._seconds * 1000)
          : typeof timestamp.seconds === 'number'
            ? new Date(timestamp.seconds * 1000)
            : typeof value === 'string'
              ? new Date(value)
              : null;

  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;
};

const getClientWarning = (status?: string | null, deletionEffectiveAt?: unknown) => {
  if (status === 'deletion_scheduled') {
    const deletionDate = formatDeletionDate(deletionEffectiveAt);

    return {
      title: 'Client deletion scheduled',
      message: deletionDate
        ? `This client is scheduled for deletion on ${deletionDate}. Resident updates are read-only until deletion is cancelled or processed.`
        : 'Resident updates are read-only until deletion is cancelled or processed.',
    };
  }

  if (status === 'inactive') {
    return {
      title: 'Client is inactive',
      message: 'New updates are temporarily unavailable. Please contact your support for any concerns.',
    };
  }

  if (status === 'deleting' || status === 'deleted') {
    return {
      title: 'Client access is ending',
      message: 'New updates are unavailable. You can still review or remove your existing data where available.',
    };
  }

  if (status && status !== 'active') {
    return {
      title: 'Client is not active',
      message: 'Some features are read-only until your LGU client is active again.',
    };
  }

  return null;
};

const getPhilippineDayKey = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

const formatEarthquakeDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function HomeScreen() {
  const [userData, setUserData] = useState<loggedInUser | null>(null);
  const [userStatus, setUserStatus] = useState({});
  const userAuth = useAuth(state => state.authUser);
  const formData = useStatusFormStore(state => state.formData);
  const userPhotoURL = userAuth?.photoURL || '';
  const userDataBackend = useUserData(state => state.userData);
  const clientWarning = getClientWarning(userDataBackend.clientStatus, userDataBackend.clientDeletionEffectiveAt);
  const earthquakes = useEarthquakeStore(state => state.earthquakes);
  const [todayKey, setTodayKey] = useState(getPhilippineDayKey(Date.now()));
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const todaysEarthquakes = earthquakes.filter(earthquake => getPhilippineDayKey(earthquake.time) === todayKey);
  const latestTodayEarthquake = todaysEarthquakes[0];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (userAuth) {
        await syncAuthenticatedUserProfile(userAuth);
      }
      const data = await storageHelpers.getData(STORAGE_KEYS.USER);
      const latestUserData = useUserData.getState().userData;
      setUserData({ photoURL: userPhotoURL, ...data, ...latestUserData });
      setRefreshTrigger(prev => prev + 1);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [userAuth, userPhotoURL]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTodayKey(getPhilippineDayKey(Date.now()));
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const data = await storageHelpers.getData(STORAGE_KEYS.USER);

      return data;
    };

    getUser().then(res => {
      setUserData({ photoURL: userPhotoURL, ...res, ...userDataBackend });
    });
  }, [userPhotoURL, userDataBackend]);

  useEffect(() => {
    // Clear userStatus immediately if formData is null (user logged out or no status)
    if (!formData) {
      setUserStatus({});
      return;
    }

    // Combine user data with status data if status exists
    const userDataFiltered = {
      ...userData,
      ...formData, // This includes condition, expirationDuration, and other status fields
    };
    setUserStatus(userDataFiltered);
  }, [userData, formData]);

  return (
    <Body style={{ paddingBottom: 110 }} gap={20} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {clientWarning && (
        <View
          style={{
            borderWidth: 1,
            borderColor: Colors.semantic.warning,
            backgroundColor: '#FFF7E6',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Text size="sm" bold style={{ color: Colors.semantic.warning }}>
            {clientWarning.title}
          </Text>
          <Text size="xs" style={{ color: Colors.semantic.warning, marginTop: 4 }}>
            {clientWarning.message}
          </Text>
        </View>
      )}
      {latestTodayEarthquake && (
        <View
          style={{
            borderWidth: 1,
            borderColor: '#F97316',
            backgroundColor: '#FFF7ED',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Text size="sm" bold style={{ color: '#C2410C' }}>
            Earthquake recorded today
          </Text>
          <Text size="xs" style={{ color: '#9A3412', marginTop: 4 }}>
            Magnitude {latestTodayEarthquake.magnitude} near {latestTodayEarthquake.place} at{' '}
            {formatEarthquakeDate(latestTodayEarthquake.time)}.
          </Text>
        </View>
      )}
      <StatusIndicator userStatus={userStatus as User | undefined} loggedInUser={userData || undefined} />
      <CardWeather />

      <QuickActions />

      <Announcement refreshTrigger={refreshTrigger} />

      <View>
        <AdvancedCarousel />
      </View>
    </Body>
  );
}
