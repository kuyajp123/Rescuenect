import { useStatusStore } from '@/store/useCurrentStatusStore';
import { db } from '@/lib/firebaseConfig';
import { StatusData } from '@/types/components';
import {
  collectionGroup,
  DocumentData,
  FirestoreError,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  QuerySnapshot,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

export const useCurrentStatuses = () => {
  const statuses = useStatusStore(state => state.statusData);
  const setStatuses = useStatusStore(state => state.setData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    const statusQuery = query(
      collectionGroup(db, 'statuses'),
      where('statusType', '==', 'current'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      statusQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const currentStatuses = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown as StatusData[];

        setStatuses(currentStatuses);
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('Error fetching statuses:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Derived state for easy filtering
  const statusesByCondition = useMemo(() => {
    return {
      safe: statuses.filter(s => s.condition === 'safe'),
      evacuated: statuses.filter(s => s.condition === 'evacuated'),
      affected: statuses.filter(s => s.condition === 'affected'),
      missing: statuses.filter(s => s.condition === 'missing'),
    };
  }, [statuses]);

  return {
    statusesByCondition,
    loading,
    error,
    totalCount: statuses.length,
  };
};
