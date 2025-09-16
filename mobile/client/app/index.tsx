import { storage } from '@/components/helper/storage';
import { handleLogout } from '@/components/auth/auth';
import { initializeAuth } from '@/components/auth/firebaseAuth';
import SplashScreen from '@/components/ui/loading/SplashScreen';
import { useEffect, useState } from 'react';

const Index = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // storage.clear(); // Clear AsyncStorage for testing purposes`
    // handleLogout();

    (() => {
      initializeAuth().finally(() => setLoading(false));
    })();
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  // This should rarely be reached since navigation should occur in loadUserAuth
  return null;
};

export default Index;
