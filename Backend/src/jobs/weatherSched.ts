import cron from 'node-cron';
import { WeatherService } from '../services/WeatherService';
export const weatherService = new WeatherService();

// Run every hour
cron.schedule('* * * * *', () => {
  console.log('⏰ Cron job running...');
  weatherService.fetchWeatherIfNeeded();
});
