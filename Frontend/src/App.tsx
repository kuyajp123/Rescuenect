import { BrowserRouter } from 'react-router-dom';
import Router from './router';
import { useEffect } from 'react';
import { useWeatherStore } from './components/stores/useWeatherStores';
import { subscribeToWeatherData } from './components/helper/getWeatherData';

function App() {
  const location = "bancaan";
  const setWeather = useWeatherStore((state) => state.setWeather);

  useEffect(() => {
    const unsubscribe = subscribeToWeatherData(location, (weatherData) => {
      // console.log("Weather data updated:", weatherData);
      setWeather(weatherData);
    });

    // Cleanup subscription on unmount
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
