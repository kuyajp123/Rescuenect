import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { StatusData } from '@/types/types';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

export const useCurrentStatuses = (enabled = true) => {
  const [statuses, setStatuses] = useState<Array<StatusData>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStatuses = async () => {
      if (!enabled) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          if (isMounted) setLoading(false);
          return;
        }

        const response = await axios.get<{ statuses: StatusData[] }>(API_ENDPOINTS.RESIDENTS.GET_ALL_LATEST_STATUSES, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currentStatuses = (response.data.statuses || []).filter(status => status.statusType === 'current');

        if (!isMounted) return;
        setStatuses(currentStatuses);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching statuses:', err);
        if (isMounted) setError(err.message || 'Failed to fetch current statuses');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatuses();
    const interval = window.setInterval(fetchStatuses, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [enabled]);

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
