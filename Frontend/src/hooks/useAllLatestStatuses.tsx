import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { useAllStatusStore } from '@/stores/useAllStatusStore';
import axios from 'axios';
import { useEffect } from 'react';

export const useAllLatestStatuses = () => {
  const { allStatuses, loading, error, setAllStatuses, setLoading, setError } = useAllStatusStore();

  const fetchAllLatestStatuses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Wait for auth to be ready
      if (!auth.currentUser) {
        console.log('No authenticated user yet, skipping fetch');
        setLoading(false);
        return;
      }

      const idToken = await auth.currentUser.getIdToken();
      if (!idToken) {
        console.log('No authentication token available');
        setLoading(false);
        return;
      }

      console.log('Fetching all latest statuses...');
      const response = await axios.get<{ statuses: any[] }>(API_ENDPOINTS.RESIDENTS.GET_ALL_LATEST_STATUSES, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      setAllStatuses(response.data.statuses);
    } catch (err) {
      console.error('Error fetching all latest statuses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when auth user is available
    if (auth.currentUser) {
      fetchAllLatestStatuses();
    }
  }, []);

  return {
    statuses: allStatuses,
    loading,
    error,
    refetch: fetchAllLatestStatuses,
  };
};
