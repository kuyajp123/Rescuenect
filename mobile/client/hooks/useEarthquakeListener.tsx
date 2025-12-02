import { EarthquakeData, useEarthquakeStore } from '@/components/store/useEarthquakeStore';
import { db } from '@/lib/firebaseConfig';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect } from 'react';

export const useEarthquakeListener = () => {
  const setEarthquakes = useEarthquakeStore(state => state.setEarthquakes);

  useEffect(() => {
    const earthquakesQuery = query(
      collection(db, 'earthquakes'),
      orderBy('time', 'desc') // optional
    );

    const unsubscribe = onSnapshot(earthquakesQuery, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEarthquakes(data as EarthquakeData[]);
    });
      
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return null;
};
