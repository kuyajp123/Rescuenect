import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/stores/useAuth';
import { StatusData } from '@/types/types';
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

export const useCurrentStatuses = (enabled = true) => {
  const [statuses, setStatuses] = useState<Array<StatusData>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authUser = useAuth(state => state.auth);
  const role = useAuth(state => state.userData?.role);
  const clientId = useAuth(state => state.userData?.clientId ?? null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (!enabled || !authUser) {
      setStatuses([]);
      setLoading(false);
      return () => {};
    }

    if (role !== 'super_admin' && !clientId) {
      setStatuses([]);
      setLoading(false);
      return () => {};
    }

    const statusQuery =
      role === 'super_admin'
        ? query(collectionGroup(db, 'statuses'), where('statusType', '==', 'current'), orderBy('createdAt', 'desc'))
        : query(
            collectionGroup(db, 'statuses'),
            where('clientId', '==', clientId),
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
        console.error('Error subscribing to current statuses:', err);
        setError(err.message || 'Failed to subscribe to current statuses');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser, clientId, enabled, role]);

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
