import { getToken } from '@/pages/contents/SuperAdmin/utils';
import { addToast } from '@heroui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

export const useSuperFetch = <T,>(url: string, key: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get<T>(url, { headers: { Authorization: `Bearer ${token}` } });
      setData(response.data);
    } catch (error) {
      console.error(`[${key}]`, error);
      addToast({ title: 'Load failed', description: `Unable to load ${key}.`, color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, loading, refetch: fetchData };
};
