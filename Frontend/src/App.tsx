import { getDesktopNotificationPreference, permissionAllowed } from '@/config/notificationPermission.ts';
import { useEarthquakeSnapshot } from '@/hooks/useEarthquakeSnapshot';
import { useResidentsStore } from '@/hooks/useFetchResidents';
import { useNotificationSubscriber } from '@/hooks/useNotificationSubscriber';
import { useStatusHistory } from '@/hooks/useStatusHistory';
import { useAuth } from '@/stores/useAuth';
import { useTheme } from '@heroui/use-theme';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { saveFCMtoken } from './helper/commonHelpers.ts';
import { subscribeToWeatherData } from './helper/getWeatherData';
import { useAllLatestStatuses } from './hooks/useAllLatestStatuses.tsx';
import { useCurrentStatuses } from './hooks/useCurrentStatuses.tsx';
import Router from './router';
import { useStatusStore } from './stores/useStatusStore';
import { useWeatherStore } from './stores/useWeatherStores';

function App() {
  useTheme();
  const setWeather = useWeatherStore(state => state.setWeather);
  const clearWeather = useWeatherStore(state => state.clearWeather);
  const setStatus = useStatusStore(state => state.setData);
  const fetchStatuses = useStatusHistory(state => state.fetchStatusHistory);
  const clearStatusHistory = useStatusHistory(state => state.clearStatusHistory);
  const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  const authUser = useAuth(state => state.auth);
  const userData = useAuth(state => state.userData);
  const syncUserData = useAuth(state => state.syncUserData);
  const canLoadAdminData = Boolean(authUser && userData?.onboardingComplete);
  const canLoadClientScopedData =
    canLoadAdminData && (userData?.role !== 'lgu_admin' || Boolean(userData.clientId));

  // Get real-time current statuses for the map and status page
  const { statuses } = useCurrentStatuses(canLoadClientScopedData);

  const lguWeatherLocation = canLoadClientScopedData
    ? userData?.role === 'lgu_admin'
      ? userData.weatherLocationKey || null
      : userData?.weatherLocationKey || null
    : null;

  // Fetch all latest statuses once for dashboard analytics
  const { refetch: refetchAllStatuses } = useAllLatestStatuses(canLoadClientScopedData);

  useEffect(() => {
    setStatus(statuses);
  }, [statuses, setStatus]);

  useEffect(() => {
    if (!authUser) return;

    const revalidateAccess = () => {
      if (document.visibilityState === 'visible') {
        void syncUserData({ silent: true });
      }
    };

    window.addEventListener('focus', revalidateAccess);
    document.addEventListener('visibilitychange', revalidateAccess);
    const interval = window.setInterval(revalidateAccess, 60000);

    return () => {
      window.removeEventListener('focus', revalidateAccess);
      document.removeEventListener('visibilitychange', revalidateAccess);
      window.clearInterval(interval);
    };
  }, [authUser, syncUserData]);

  // Fetch all latest statuses when auth is ready
  useEffect(() => {
    if (canLoadClientScopedData) {
      refetchAllStatuses();
    }
  }, [canLoadClientScopedData]);

  useEffect(() => {
    if (canLoadClientScopedData) {
      fetchStatuses();
    } else {
      clearStatusHistory();
    }
  }, [canLoadClientScopedData, fetchStatuses, clearStatusHistory]);

  useEffect(() => {
    if (!canLoadClientScopedData || !lguWeatherLocation) {
      clearWeather();
      return;
    }

    const unsubscribe = subscribeToWeatherData(lguWeatherLocation, weatherData => {
      setWeather(weatherData);
    });

    return () => {
      unsubscribe();
    };
  }, [canLoadClientScopedData, lguWeatherLocation, setWeather, clearWeather]);

  useEffect(() => {
    const enableNotification = async () => {
      try {
        if (!VAPID_KEY || !getDesktopNotificationPreference(Boolean(userData?.fcmToken))) {
          return;
        }

        const fcmToken = await permissionAllowed(VAPID_KEY);

        if (fcmToken && authUser && userData?.onboardingComplete) {
          // Update token in backend
          await saveFCMtoken(fcmToken, authUser);
        }
      } catch (error) {
        console.error('Failed to enable notifications:', error);
      }
    };
    enableNotification();
  }, [VAPID_KEY, authUser, userData?.fcmToken, userData?.onboardingComplete]);

  useEarthquakeSnapshot();

  // Subscribe to notifications
  useNotificationSubscriber({
    enabled: canLoadClientScopedData,
    userLocation: userData?.weatherLocationKey || userData?.barangay || undefined,
    clientId: userData?.role === 'lgu_admin' ? userData.clientId || undefined : undefined,
    role: userData?.role ?? null,
    userId: authUser?.uid,
    maxNotifications: 100,
  });

  // Fetch residents when auth is available
  const fetchResidents = useResidentsStore(state => state.fetchResidents);
  const clearResidents = useResidentsStore(state => state.clearResidents);

  useEffect(() => {
    if (canLoadClientScopedData) {
      fetchResidents();
    } else {
      clearResidents();
    }
  }, [canLoadClientScopedData, fetchResidents, clearResidents]);

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}

export default App;
