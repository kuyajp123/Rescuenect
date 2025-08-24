import { loadUserAuth } from '@/components/helper/topLevelHelpers';
import SplashScreen from '@/components/ui/loading/SplashScreen';
import { useEffect, useState } from 'react';

const Index = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await loadUserAuth();
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
