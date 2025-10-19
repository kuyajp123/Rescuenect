import { BrowserRouter } from 'react-router-dom';
import Router from './router';
import { useEffect } from 'react';
import { useWeatherStore } from './stores/useWeatherStores';
import { subscribeToWeatherData } from './helper/getWeatherData';
import 'leaflet/dist/leaflet.css';
import { useStatusStore } from './stores/useStatusStore';
import { useCurrentStatuses } from './hooks/useCurrentStatuses.tsx';

function App() {
  const location = 'bancaan';
  const setWeather = useWeatherStore(state => state.setWeather);
  const setStatus = useStatusStore(state => state.setData);
  const { statuses } = useCurrentStatuses();

  useEffect(() => {
    setStatus(statuses);
  }, [statuses, setStatus]);

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
