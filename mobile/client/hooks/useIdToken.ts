import { useAuth } from '@/components/store/useAuth';
import { useEffect, useState } from 'react';

/**
 * Custom hook to get and manage Firebase ID token
 * @returns {Object} Object containing idToken, loading state, error, and refresh function
 */
export const useIdToken = () => {
  const authUser = useAuth((state) => state.authUser);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch ID token from Firebase Auth user
   */
  const fetchIdToken = async (forceRefresh = false) => {
    if (!authUser) {
      setIdToken(null);
      setError('No authenticated user');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await authUser.getIdToken(forceRefresh);
      console.log("✅ ID token retrieved:", token ? "Token received" : "No token");
      setIdToken(token);
      return token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get ID token';
      console.error("❌ Error getting ID token:", err);
      setError(errorMessage);
      setIdToken(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh the current ID token
   */
  const refreshToken = async () => {
    return await fetchIdToken(true);
  };

  /**
   * Get a fresh token (useful for API calls)
   */
  const getToken = async (): Promise<string | null> => {
    if (idToken && authUser) {
      // Check if token is still valid (you can add expiration check here)
      return idToken;
    }
    
    // Fetch fresh token if none exists or user changed
    return await fetchIdToken();
  };

  // Effect to fetch token when authUser changes
  useEffect(() => {
    fetchIdToken();
  }, [authUser]);

  return {
    idToken,
    loading,
    error,
    refreshToken,
    getToken,
    hasToken: !!idToken,
    isReady: !loading && !!authUser,
  };
};

export default useIdToken;