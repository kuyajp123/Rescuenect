import { permissionAllowed } from '@/config/notificationPermission.ts';
import { useEarthquakeSnapshot } from '@/hooks/useEarthquakeSnapshot';
import { useResidentsStore } from '@/hooks/useFetchResidents';
import { useNotificationSubscriber } from '@/hooks/useNotificationSubscriber';
import { useStatusHistory } from '@/hooks/useStatusHistory';
import { useAuth } from '@/stores/useAuth';
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
  const CURRENT_USER_LOCATION = 'bancaan';
  const setWeather = useWeatherStore(state => state.setWeather);
  const setStatus = useStatusStore(state => state.setData);
  const fetchStatuses = useStatusHistory(state => state.fetchStatusHistory);

  // Get real-time current statuses for the map and status page
  const { statuses } = useCurrentStatuses();

  const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  const authUser = useAuth(state => state.auth);

  // Fetch all latest statuses once for dashboard analytics
  const { refetch: refetchAllStatuses } = useAllLatestStatuses();

  useEffect(() => {
    setStatus(statuses);
  }, [statuses, setStatus]);

  // Fetch all latest statuses when auth is ready
  useEffect(() => {
    if (authUser) {
      refetchAllStatuses();
    }
  }, [authUser]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  useEffect(() => {
    const unsubscribe = subscribeToWeatherData(CURRENT_USER_LOCATION, weatherData => {
      setWeather(weatherData);
    });

    return () => {
      unsubscribe();
    };
  }, [CURRENT_USER_LOCATION, setWeather]);

  useEffect(() => {
    const enableNotification = async () => {
      try {
        const fcmToken = await permissionAllowed(VAPID_KEY);

        if (fcmToken && authUser) {
          // Update token in backend
          await saveFCMtoken(fcmToken, authUser);
        }
      } catch (error) {
        console.error('Failed to enable notifications:', error);
      }
    };
    enableNotification();
  }, [authUser]);

  useEarthquakeSnapshot();

  // Subscribe to notifications
  useNotificationSubscriber({
    userLocation: CURRENT_USER_LOCATION,
    userId: authUser?.uid,
    maxNotifications: 100,
  });

  // Fetch residents when auth is available
  const fetchResidents = useResidentsStore(state => state.fetchResidents);

  useEffect(() => {
    if (authUser) {
      fetchResidents();
    }
  }, [authUser, fetchResidents]);

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}

export default App;
