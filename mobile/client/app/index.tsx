import { loadUserAuth } from '@/components/helper/topLevelHelpers';
import SplashScreen from '@/components/ui/loading/SplashScreen';
import { useEffect, useState } from 'react';
import { storage } from '@/components/helper/storage';
import { handleLogout } from '@/components/helper/auth';

const Index = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // storage.clear(); // Clear AsyncStorage for testing purposes
    // handleLogout();
    const asyncLog = async () => {
      console.log("📱 @barangay:", await storage.get('@barangay'));
      console.log("📱 @user:", await storage.get('@user'));
    }
    const initializeAuth = async () => {
      try {
        // console.log("📱 App Index: Starting auth initialization");
        await loadUserAuth();
        // console.log("📱 App Index: Auth initialization complete");
      } catch (error) {
        // console.error("📱 App Index: Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
    asyncLog();
  }, []);

  // console.log("📱 App Index: Rendering", { loading });

  if (loading) {
    return <SplashScreen />;
  }

  // This should rarely be reached since navigation should occur in loadUserAuth
  return null;
};

export default Index;
