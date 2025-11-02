import { useStatusFormStore } from '@/components/store/useStatusForm';
import { db } from '@/lib/firebaseConfig';
import { CreateStatusData } from '@/types/components';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

/**
 * Custom hook to fetch status data in the background
 * @param {string | null} statusId - The ID of the status to fetch
 * @param {string | null} idToken - The Firebase ID token for authentication
 * @returns {CreateStatusData | null} - The fetched status data or null
 */

export const useStatusFetchBackgroundData = (
  statusId: string | null,
  idToken: string | null
): CreateStatusData | null => {
  const [data, setData] = useState<CreateStatusData | null>(null);
  const [shouldFetch, setShouldFetch] = useState<boolean>(false);
  const setLoading = useStatusFormStore(state => state.setLoading);
  const setError = useStatusFormStore(state => state.setError);

  // Clear data immediately when user changes or logs out (before any async operations)
  useEffect(() => {
    if (!statusId || !idToken) {
      setData(null);
      setShouldFetch(false);
    } else {
      setShouldFetch(true);
    }
  }, [statusId, idToken]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const listenToCurrentStatus = (userId: string) => {
      try {
        setLoading(true);
        setError(false);

        // Create Firestore query for current status
        const statusCollection = collection(db, 'status', userId.trim(), 'statuses');
        const q = query(statusCollection, where('statusType', '==', 'current'), limit(1));

        // Listen for real-time updates
        unsubscribe = onSnapshot(
          q,
          snapshot => {
            setLoading(false);

            if (!snapshot.empty) {
              const statusDoc = snapshot.docs[0];
              const statusData = {
                id: statusDoc.id,
                ...statusDoc.data(),
              } as unknown as CreateStatusData;

              setData(statusData);
              // console.log('✅ Current status updated:', statusData);
            } else {
              setData(null);
            }
          },
          error => {
            console.error('❌ Error listening to status updates:', error);
            setError(true);
            setLoading(false);
            setData(null);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error setting up status listener:', error);
        setError(true);
        setLoading(false);
        return null;
      }
    };

    // Clear data immediately when user changes or logs out
    if (!shouldFetch || !statusId || !idToken) {
      setData(null);
      setLoading(false);
      return;
    }

    // Start listening if we have the required data
    if (shouldFetch && statusId && idToken) {
      listenToCurrentStatus(statusId);
    }

    // Cleanup function to unsubscribe when component unmounts or dependencies change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [shouldFetch, statusId, idToken]);

  // Return null if user is not available, otherwise return data
  return !statusId || !idToken ? null : data;
};
