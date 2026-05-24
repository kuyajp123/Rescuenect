import { permissionAllowed } from '@/config/notificationPermission.ts';
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
  const CURRENT_USER_LOCATION = 'bancaan';
  const setWeather = useWeatherStore(state => state.setWeather);
  const clearWeather = useWeatherStore(state => state.clearWeather);
  const setStatus = useStatusStore(state => state.setData);
  const fetchStatuses = useStatusHistory(state => state.fetchStatusHistory);
  const clearStatusHistory = useStatusHistory(state => state.clearStatusHistory);
  const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  const authUser = useAuth(state => state.auth);
  const userData = useAuth(state => state.userData);
  const canLoadAdminData = Boolean(authUser && userData?.onboardingComplete);
  const canLoadClientScopedData =
    canLoadAdminData && (userData?.role !== 'lgu_admin' || Boolean(userData.clientId));

  // Get real-time current statuses for the map and status page
  const { statuses } = useCurrentStatuses(canLoadClientScopedData);

  const lguWeatherLocation = canLoadClientScopedData
    ? userData?.role === 'lgu_admin'
      ? userData.weatherLocationKey || userData.clientId || userData.barangay
      : userData?.barangay || CURRENT_USER_LOCATION
    : null;

  // Fetch all latest statuses once for dashboard analytics
  const { refetch: refetchAllStatuses } = useAllLatestStatuses(canLoadClientScopedData);

  useEffect(() => {
    setStatus(statuses);
  }, [statuses, setStatus]);

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
  }, [authUser, userData?.onboardingComplete]);

  useEarthquakeSnapshot();

  // Subscribe to notifications
  useNotificationSubscriber({
    enabled: canLoadClientScopedData,
    userLocation: userData?.weatherLocationKey || userData?.barangay || undefined,
    clientId: userData?.role === 'lgu_admin' ? userData.clientId || undefined : undefined,
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
