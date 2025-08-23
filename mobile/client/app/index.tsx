import SplashScreen from '@/components/components/loadingScreen/SplashScreen';
import { loadSavedBarangay } from '@/components/helper/topLevelHelpers';
import { useEffect, useState } from 'react';

const Index = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await loadSavedBarangay();
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <>
      {loading ? <SplashScreen /> : null}
    </>
  );
};

export default Index;
