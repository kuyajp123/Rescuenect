import { useState, useEffect, useMemo } from 'react';
import {
  collectionGroup,
  query,
  where,
  orderBy,
  onSnapshot,
  QuerySnapshot,
  QueryDocumentSnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { StatusData } from '@/types/types';

export const useCurrentStatuses = () => {
  const [statuses, setStatuses] = useState<Array<StatusData>>([]);
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
    statuses,
    statusesByCondition,
    loading,
    error,
    totalCount: statuses.length,
  };
};
