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
  const setStatus = useStatusStore(state => state.setData);
  const fetchStatuses = useStatusHistory(state => state.fetchStatusHistory);
  const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  const authUser = useAuth(state => state.auth);
  const userData = useAuth(state => state.userData);
  const canLoadAdminData = Boolean(authUser && userData?.onboardingComplete);

  // Get real-time current statuses for the map and status page
  const { statuses } = useCurrentStatuses(canLoadAdminData);

  const lguWeatherLocation =
    userData?.role === 'lgu_admin' && userData.clientId && userData.clientId !== 'naic'
      ? userData.weatherLocationKey || userData.clientId
      : userData?.barangay || CURRENT_USER_LOCATION;

  // Fetch all latest statuses once for dashboard analytics
  const { refetch: refetchAllStatuses } = useAllLatestStatuses(canLoadAdminData);

  useEffect(() => {
    setStatus(statuses);
  }, [statuses, setStatus]);

  // Fetch all latest statuses when auth is ready
  useEffect(() => {
    if (canLoadAdminData) {
      refetchAllStatuses();
    }
  }, [canLoadAdminData]);

  useEffect(() => {
    if (canLoadAdminData) {
      fetchStatuses();
    }
  }, [canLoadAdminData, fetchStatuses]);

  useEffect(() => {
    const unsubscribe = subscribeToWeatherData(lguWeatherLocation, weatherData => {
      setWeather(weatherData);
    });

    return () => {
      unsubscribe();
    };
  }, [lguWeatherLocation, setWeather]);

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
    userLocation: userData?.barangay || CURRENT_USER_LOCATION,
    clientId: userData?.role === 'lgu_admin' ? userData.clientId || undefined : undefined,
    userId: authUser?.uid,
    maxNotifications: 100,
  });

  // Fetch residents when auth is available
  const fetchResidents = useResidentsStore(state => state.fetchResidents);

  useEffect(() => {
    if (canLoadAdminData) {
      fetchResidents();
    }
  }, [canLoadAdminData, fetchResidents]);

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}

export default App;
