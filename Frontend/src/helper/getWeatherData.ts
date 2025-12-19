import { db } from '@/lib/firebaseConfig';
import { DailyWeather, HourlyWeather, RealTimeWeather, WeatherData } from '@/types/types';
import { collection, onSnapshot } from 'firebase/firestore';
import { getUsersBarangay } from './getUserLocation';

export const subscribeToWeatherData = (location: string, callback: (data: WeatherData) => void) => {
  const barangay = getUsersBarangay(location);

  const realtime = collection(db, 'weather', barangay, 'realtime');
  const hourly = collection(db, 'weather', barangay, 'hourly');
  const daily = collection(db, 'weather', barangay, 'daily');

  const data: WeatherData = {
    realtime: [],
    hourly: [],
    daily: [],
  };

  let unsubscribeCallbacks: (() => void)[] = [];

  // Counter to track when all collections have loaded
  let loadedCollections = 0;
  const totalCollections = 3;

  const checkAndUpdate = () => {
    loadedCollections++;
    if (loadedCollections >= totalCollections) {
      callback(data);
      // localStorage.setItem('weatherData', JSON.stringify(data));
    }
  };

  const unsubscribeRealtime = onSnapshot(realtime, snapshot => {
    const realtimeData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as RealTimeWeather[];
    data.realtime = realtimeData;
    checkAndUpdate();
  });

  const unsubscribeHourly = onSnapshot(hourly, snapshot => {
    const hourlyData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as HourlyWeather[];
    data.hourly = hourlyData;
    checkAndUpdate();
  });

  const unsubscribeDaily = onSnapshot(daily, snapshot => {
    const dailyData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as DailyWeather[];
    data.daily = dailyData;
    checkAndUpdate();
  });

  unsubscribeCallbacks = [unsubscribeRealtime, unsubscribeHourly, unsubscribeDaily];

  // Return unsubscribe function
  return () => {
    unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
  };
};
