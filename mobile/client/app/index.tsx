import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '@/components/ui/loadingScreen/SplashScreen';

const Index = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedBarangay = async () => {
      try {
        const savedBarangay = await AsyncStorage.getItem('@barangay');
        const savedUser = await AsyncStorage.getItem('@user');

        if (savedBarangay && savedUser) {
          setLoading(false);
          router.replace("(tabs)" as any);
        } else {
          setLoading(false);
          router.replace("/auth/barangayForm" as any);
        }
      } catch (error) {
        console.error('Error loading saved barangay:', error);
      }
    };

    loadSavedBarangay();
  }, []);

  return (
    <>
      {loading ? <SplashScreen /> : null}
    </>
  );
};

export default Index;
