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
  where,
} from 'firebase/firestore';
import { useEffect } from 'react';

export const useEarthquakeSnapshot = () => {
  const { auth } = useAuth();
  const userData = useAuth(state => state.userData);
  const setEarthquakes = useEarthquakeStore(state => state.setEarthquakes);
  const setLoading = useEarthquakeStore(state => state.setLoading);
  const setError = useEarthquakeStore(state => state.setError);

  useEffect(() => {
    if (!auth) return;

    setLoading(true);

    const isSuperAdmin = userData?.role === 'super_admin';
    const clientId = userData?.clientId;
    if (!isSuperAdmin && !clientId) {
      setEarthquakes([]);
      setLoading(false);
      return;
    }

    const earthquakeQuery =
      isSuperAdmin || !clientId
        ? query(collection(db, 'earthquakes'), orderBy('created_at', 'desc'))
        : query(collection(db, 'earthquakes'), where('affectedClientIds', 'array-contains', clientId));

    const unsubscribe = onSnapshot(
      earthquakeQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const earthquakeData = snapshot.docs
          .map((doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(earthquake => {
            if (isSuperAdmin || !clientId) return true;
            const affectedClientIds = (earthquake as any).affectedClientIds;
            return Array.isArray(affectedClientIds) ? affectedClientIds.includes(clientId) : false;
          }) as unknown as ProcessedEarthquake[];

        const sortedData = earthquakeData.sort((a, b) => {
          const aTime = (a as any).created_at || (a as any).time || 0;
          const bTime = (b as any).created_at || (b as any).time || 0;
          return bTime - aTime;
        });

        setEarthquakes(sortedData);
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('Error fetching earthquakes:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [setEarthquakes, setLoading, setError, auth, userData?.role, userData?.clientId]);
};
