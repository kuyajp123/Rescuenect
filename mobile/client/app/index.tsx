import SplashScreen from '@/components/ui/loading/SplashScreen';
import { useAuthGate } from '@/hooks/useAuthGate';
import { Redirect } from 'expo-router';

const Index = () => {
  const { initialHref } = useAuthGate();

  if (!initialHref) {
    return <SplashScreen />;
  }

  return <Redirect href={initialHref as any} />;
};

export default Index;
