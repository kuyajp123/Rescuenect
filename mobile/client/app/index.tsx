import { storage } from '@/components/helper/storage';
import { handleLogout } from '@/components/auth/auth';
import { initializeAuth } from '@/components/auth/firebaseAuth';
import SplashScreen from '@/components/ui/loading/SplashScreen';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

const Index = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // storage.clear(); // Clear AsyncStorage for testing purposes`
    // handleLogout();
    (() => {
      initializeAuth().finally(() => setLoading(false));
    })();
  }, []);

  // useEffect(() => {
  //   router.replace('/status/(settings)/statusSettings');
  // }, [router]);

  if (loading) {
    return <SplashScreen />;
  }

  // This should rarely be reached since navigation should occur in loadUserAuth
  return null;
};

export default Index;
