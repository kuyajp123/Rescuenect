import { BrowserRouter } from 'react-router-dom';
import Router from './router';
import { useEffect } from 'react';
import { useWeatherStore } from './stores/useWeatherStores';
import { subscribeToWeatherData } from './helper/getWeatherData';
import 'leaflet/dist/leaflet.css';

function App() {
  const location = 'bancaan';
  const setWeather = useWeatherStore(state => state.setWeather);

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
