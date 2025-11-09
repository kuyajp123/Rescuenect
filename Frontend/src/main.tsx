import { ToastProvider } from '@heroui/react';
import { HeroUIProvider } from '@heroui/system';
import ReactDOM from 'react-dom/client';
import App from './App';
import ScreenSizeProvider from './contexts/ScreenSizeContext';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  <HeroUIProvider>
    <ScreenSizeProvider>
      <main>
        <ToastProvider />
        <App />
      </main>
    </ScreenSizeProvider>
  </HeroUIProvider>
  // </React.StrictMode>,
);
