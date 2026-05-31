import { db } from '@/lib/firebaseConfig';
import { useUserData } from '@/store/useBackendResponse';
import { EarthquakeData, useEarthquakeStore } from '@/store/useEarthquakeStore';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect } from 'react';

const HISTORY_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const useEarthquakeSubscriber = () => {
  const clientId = useUserData(state => state.userData.clientId);
  const setEarthquakes = useEarthquakeStore(state => state.setEarthquakes);
  const clearEarthquakes = useEarthquakeStore(state => state.clearEarthquakes);

  useEffect(() => {
    if (!clientId) {
      clearEarthquakes();
      return () => {};
    }

    const earthquakeQuery = query(collection(db, 'earthquakes'), where('affectedClientIds', 'array-contains', clientId));
    const retentionStart = Date.now() - HISTORY_DAYS * DAY_MS;

    const unsubscribe = onSnapshot(
      earthquakeQuery,
      snapshot => {
        const earthquakes = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as EarthquakeData)
          .filter(earthquake => typeof earthquake.time === 'number' && earthquake.time >= retentionStart)
          .sort((left, right) => right.time - left.time);

        setEarthquakes(earthquakes);
      },
      error => {
        console.error('Error fetching earthquake history:', error);
        clearEarthquakes();
      }
    );

    return () => unsubscribe();
  }, [clientId, setEarthquakes, clearEarthquakes]);
};
