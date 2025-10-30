import { storage, storageHelpers } from '@/components/helper/storage';
import { handleLogout } from '@/components/auth/auth';
import { initializeAuth } from '@/components/auth/firebaseAuth';
import SplashScreen from '@/components/ui/loading/SplashScreen';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { inititallizeAppStorage } from '@/config/asyncStorage';

const Index = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize storage with defaults FIRST
        await inititallizeAppStorage();

        // Initialize auth LAST (this triggers navigation)
        await initializeAuth();
      } catch (error) {
        console.error('❌ Error during app initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    // storage.clear(); // Clear AsyncStorage for testing purposes
    // handleLogout();
    initializeApp();
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
