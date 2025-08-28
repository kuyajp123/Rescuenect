import { loadUserAuth } from '@/components/helper/topLevelHelpers';
import SplashScreen from '@/components/ui/loading/SplashScreen';
import { useEffect, useState } from 'react';

const Index = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // storage.clear(); // Clear AsyncStorage for testing purposes
    // handleLogout();

    const initializeAuth = async () => {
      try {
        await loadUserAuth();
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  // This should rarely be reached since navigation should occur in loadUserAuth
  return null;
};

export default Index;
