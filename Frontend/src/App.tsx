import { BrowserRouter } from 'react-router-dom';
import Router from './router';
import { useEffect } from 'react';
import { useWeatherStore } from './components/stores/useWeatherStores';
import { 
  collection, doc, 
  getDoc, getDocs, addDoc, setDoc, 
  updateDoc, deleteDoc, query, where, 
  orderBy, limit, onSnapshot 
} from "firebase/firestore";
import { db } from './lib/firebaseConfig';


function App() {
  const setWeather = useWeatherStore((s) => s.setWeather);

useEffect(() => {
  const fetchWeatherData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/weather`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 429) {
        const data = await response.json();
        console.log(`⏳ Rate limited. Try again in ${data.retryAfter} seconds.`);
        return;
      }

      if (response.ok) {
        const weatherData = await response.json();
        setWeather(weatherData);
        console.log("✅ Weather data fetched successfully!");
      } else {
        console.error("❌ Failed to fetch weather data");
      }
    } catch (error) {
      console.error("❌ Error fetching weather data:", error);
    }
  };

  const interval = setInterval(() => {
    fetchWeatherData();
  }, 30 * 60 * 1000); // Try to fetch every 30 minutes

  // Initial fetch
  fetchWeatherData();

  return () => clearInterval(interval);
}, [setWeather]);



  

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}
 
export default App;
