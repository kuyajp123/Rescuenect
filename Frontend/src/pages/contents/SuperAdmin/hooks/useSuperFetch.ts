import { getToken } from '@/pages/contents/SuperAdmin/utils';
import { addToast } from '@heroui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

type UseSuperFetchOptions = {
  cache?: boolean;
  cacheKey?: string;
};

const superFetchCache = new Map<string, unknown>();

export const clearSuperFetchCache = (cacheKey?: string) => {
  if (cacheKey) {
    superFetchCache.delete(cacheKey);
    return;
  }

  superFetchCache.clear();
};

export const useSuperFetch = <T,>(url: string, key: string, options: UseSuperFetchOptions = {}) => {
  const cacheEnabled = Boolean(options.cache);
  const cacheKey = options.cacheKey ?? url;
  const [data, setData] = useState<T | null>(() =>
    cacheEnabled && superFetchCache.has(cacheKey) ? (superFetchCache.get(cacheKey) as T) : null
  );
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get<T>(url, { headers: { Authorization: `Bearer ${token}` } });
      if (cacheEnabled) superFetchCache.set(cacheKey, response.data);
      setData(response.data);
    } catch (error) {
      console.error(`[${key}]`, error);
      addToast({ title: 'Load failed', description: `Unable to load ${key}.`, color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cacheEnabled && superFetchCache.has(cacheKey)) {
      setData(superFetchCache.get(cacheKey) as T);
      return;
    }

    fetchData();
  }, [url, cacheEnabled, cacheKey]);

  return { data, loading, refetch: fetchData };
};
