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
import { useCurrentStatuses } from './hooks/useCurrentStatuses.tsx';
import Router from './router';
import { useStatusStore } from './stores/useStatusStore';
import { useWeatherStore } from './stores/useWeatherStores';

function App() {
  const CURRENT_USER_LOCATION = 'bancaan';
  const setWeather = useWeatherStore(state => state.setWeather);
  const setStatus = useStatusStore(state => state.setData);
  const fetchStatuses = useStatusHistory(state => state.fetchStatusHistory);
  const { statuses } = useCurrentStatuses();
  const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  const auth = useAuth(state => state.auth);

  useEffect(() => {
    setStatus(statuses);
  }, [statuses, setStatus]);

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

        if (fcmToken && auth) {
          // Update token in backend
          const response = await saveFCMtoken(fcmToken, auth);
          console.log('FCM token saved response:', response);
        }
      } catch (error) {
        console.error('Failed to enable notifications:', error);
      }
      console.log('enableNotification called');
    };
    enableNotification();
    console.log('enableNotification effect ran');
  }, [auth]);

  useEarthquakeSnapshot();

  // Subscribe to notifications
  useNotificationSubscriber({
    userLocation: CURRENT_USER_LOCATION,
    userId: auth?.uid,
    maxNotifications: 100,
  });

  // Fetch residents when auth is available
  const fetchResidents = useResidentsStore(state => state.fetchResidents);

  useEffect(() => {
    if (auth) {
      fetchResidents();
    }
  }, [auth, fetchResidents]);

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}

export default App;
