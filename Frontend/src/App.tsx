import { useStatusHistory } from '@/hooks/useStatusHistory';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { subscribeToWeatherData } from './helper/getWeatherData';
import { useCurrentStatuses } from './hooks/useCurrentStatuses.tsx';
import Router from './router';
import { useStatusStore } from './stores/useStatusStore';
import { useWeatherStore } from './stores/useWeatherStores';

function App() {
  const location = 'bancaan';
  const setWeather = useWeatherStore(state => state.setWeather);
  const setStatus = useStatusStore(state => state.setData);
  const fetchStatuses = useStatusHistory(state => state.fetchStatusHistory);
  const { statuses } = useCurrentStatuses();

  useEffect(() => {
    setStatus(statuses);
  }, [statuses, setStatus]);

  useEffect(() => {
    fetchStatuses(); // fetch once when app loads
  }, [fetchStatuses]);

  useEffect(() => {
    const unsubscribe = subscribeToWeatherData(location, weatherData => {
      setWeather(weatherData);
    });

    return () => {
      unsubscribe();
    };
  }, [location, setWeather]);

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}

export default App;
