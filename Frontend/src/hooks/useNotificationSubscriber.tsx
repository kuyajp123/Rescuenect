import { db } from '@/lib/firebaseConfig';
import { useEarthquakeStore } from '@/stores/useEarthquakeStore';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect } from 'react';

export const useNotificationSubscriber = () => {
  const earthquakeData = useEarthquakeStore(state => state.earthquakes);

  useEffect(() => {
    const earthquakesQuery = query(
      collection(db, 'notification'),
      orderBy('time', 'desc') // optional
    );

    const unsubscribe = onSnapshot(earthquakesQuery, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('Notification Data:', data);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return null;
};
