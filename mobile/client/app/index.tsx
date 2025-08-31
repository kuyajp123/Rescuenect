import { loadUserAuth } from '@/components/helper/topLevelHelpers';
import SplashScreen from '@/components/ui/loading/SplashScreen';
import { useEffect, useState } from 'react';
import { storage } from '@/components/helper/storage';

const Index = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // storage.clear(); // Clear AsyncStorage for testing purposes
    // handleLogout();

    const getStorage = async () => {
      const user = await storage.get('@user');
      const barangay = await storage.get('@barangay');
      console.log('Stored user:', user);
      console.log('Stored barangay:', barangay);
    }

    const initializeAuth = async () => {
      try {
        await loadUserAuth();
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
    getStorage();
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  // This should rarely be reached since navigation should occur in loadUserAuth
  return null;
};

export default Index;
