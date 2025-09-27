import { useState, useEffect } from 'react';
import { fetchAndSaveStatusData } from "@/API/fetchAndSaveStatusData";
import { CreateStatusData } from '@/types/components';
import { useStatusFormStore } from '@/components/store/useStatusForm';

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
  const formData = useStatusFormStore((state) => state.formData);
  const setLoading = useStatusFormStore((state) => state.setLoading);
  const setError = useStatusFormStore((state) => state.setError);

  useEffect(() => {
    if (statusId && idToken) {
      setShouldFetch(true);
    } else {
      setShouldFetch(false);
    }
  }, [statusId, idToken, formData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
          setLoading(true);
        if (shouldFetch && statusId && idToken) {
          const response = await fetchAndSaveStatusData(statusId, idToken);
          if (response.success) {
            setData(response.data);
          } else {
            console.error("❌ Failed to fetch background data:", response.error);
            setError(true);
          }
        } else {
          console.log("ℹ️ Missing statusId or idToken, skipping fetch");
          setData(null);
        }
      } catch (error) {
        console.error("❌ Error fetching background data:", error);
      } finally {
          setLoading(false);
      }
    };

    // setLoading(true);
    // const timeout = setTimeout(() => {
    //   fetchData();
    // }, 10000);

    // return () => clearTimeout(timeout);

    fetchData();
  }, [shouldFetch]);

  return data;
};
