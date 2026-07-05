import { setupAxiosInterceptors } from '@/lib/axiosInterceptor';
import { Spinner, ToastProvider } from '@heroui/react';
import { HeroUIProvider } from '@heroui/system';
import { fetchAndActivate, getBoolean } from 'firebase/remote-config';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Maintenance from './components/Maintenance';
import ScreenSizeProvider from './contexts/ScreenSizeContext';
import { remoteConfig } from './lib/firebaseConfig';
import './styles/globals.css';

// Initialize global interceptors
setupAxiosInterceptors();

const Root = () => {
  const [isMaintenance, setIsMaintenance] = useState<boolean | null>(null);

  useEffect(() => {
    const initConfig = async () => {
      try {
        await fetchAndActivate(remoteConfig);
        setIsMaintenance(getBoolean(remoteConfig, 'is_maintenance_mode'));
      } catch (error) {
        console.error('Failed to fetch remote config:', error);
        setIsMaintenance(false);
      }
    };
    initConfig();
  }, []);

  if (isMaintenance === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isMaintenance) {
    return (
      <HeroUIProvider>
        <Maintenance />
      </HeroUIProvider>
    );
  }

  return (
    <HeroUIProvider>
      <ScreenSizeProvider>
        <main>
          <ToastProvider placement="top-right" />
          <App />
        </main>
      </ScreenSizeProvider>
    </HeroUIProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
