import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/stores/useAuth';
import { useEarthquakeStore } from '@/stores/useEarthquakeStore';
import { ProcessedEarthquake } from '@/types/types';
import {
  collection,
  DocumentData,
  FirestoreError,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import { useEffect } from 'react';

export const useEarthquakeSnapshot = () => {
  const { auth } = useAuth();
  const setEarthquakes = useEarthquakeStore(state => state.setEarthquakes);
  const setLoading = useEarthquakeStore(state => state.setLoading);
  const setError = useEarthquakeStore(state => state.setError);

  useEffect(() => {
    if (!auth) return;

    setLoading(true);

    // Try with orderBy first, fall back to simple collection query if index doesn't exist
    let earthquakeQuery;

    try {
      earthquakeQuery = query(collection(db, 'earthquakes'), orderBy('created_at', 'desc'));
    } catch (error) {
      console.log('⚠️ No index for created_at, using simple query');
      earthquakeQuery = collection(db, 'earthquakes');
    }

    const unsubscribe = onSnapshot(
      earthquakeQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const earthquakeData = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown as ProcessedEarthquake[];

        // Sort manually if we couldn't use orderBy
        const sortedData = earthquakeData.sort((a, b) => {
          const aTime = (a as any).created_at || (a as any).time || 0;
          const bTime = (b as any).created_at || (b as any).time || 0;
          return bTime - aTime; // Descending order (newest first)
        });

        setEarthquakes(sortedData);
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('❌ Error fetching earthquakes:', err);
        console.error('Error details:', {
          code: err.code,
          message: err.message,
        });

        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [setEarthquakes, setLoading, setError, auth]);
};
