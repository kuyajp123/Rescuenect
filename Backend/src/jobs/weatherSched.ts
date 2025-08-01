import cron from 'node-cron';
import { WeatherService } from '@/services/WeatherService';
export const weatherService = new WeatherService();

let isFetching = false;

async function safeFetch() {
  if (isFetching) return;
  isFetching = true;
  try {
    await weatherService.fetchWeatherIfNeeded();
  } finally {
    isFetching = false;
  }
}

// Run every minute
safeFetch(); // first call
cron.schedule('* * * * *', () => {
  console.log('⏰ Cron job running...');
  safeFetch(); // safe call every minute
});

