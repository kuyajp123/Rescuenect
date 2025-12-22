import { getUsersBarangay } from '@/config/getUserLocation';
import { db } from '@/lib/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

export const subscribeToWeatherData = (location: string, callback: (data: any) => void) => {
  try {
    const barangay = getUsersBarangay(location);

    const realtime = collection(db, 'weather', barangay, 'realtime');
    const hourly = collection(db, 'weather', barangay, 'hourly');
    const daily = collection(db, 'weather', barangay, 'daily');

    const data: {
      realtime: any[];
      hourly: any[];
      daily: any[];
    } = {
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

    const unsubscribeRealtime = onSnapshot(
      realtime,
      snapshot => {
        const realtimeData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        data['realtime'] = realtimeData;
        checkAndUpdate();
      },
      error => {
        console.error('Error fetching realtime weather:', error);
      }
    );

    const unsubscribeHourly = onSnapshot(
      hourly,
      snapshot => {
        const hourlyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        data['hourly'] = hourlyData;
        checkAndUpdate();
      },
      error => {
        console.error('Error fetching hourly weather:', error);
      }
    );

    const unsubscribeDaily = onSnapshot(
      daily,
      snapshot => {
        const dailyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        data['daily'] = dailyData;
        checkAndUpdate();
      },
      error => {
        console.error('Error fetching daily weather:', error);
      }
    );

    unsubscribeCallbacks = [unsubscribeRealtime, unsubscribeHourly, unsubscribeDaily];

    // Return unsubscribe function
    return () => {
      unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    };
  } catch (error) {
    console.error('Error setting up weather subscription:', error);
    return () => {}; // return empty unsubscribe
  }
};
