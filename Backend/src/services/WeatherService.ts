import axios from 'axios';
import {
  getHourlyTimestamp,
  updateHourlyTimestamp,
  getRealtimeTimestamp,
  updateRealtimeTimestamp,
  getDailyTimestamp,
  updateDailyTimestamp,
} from '@/shared/utils/localTimestamp';
import { WeatherModel } from '@/models/WeatherModel';
import { getWeatherAPIEndpoints } from '@/shared/functions/WeatherAPIEndpoints';
import { WeatherLocationKey } from '@/shared/types/types';

const weatherGroups: WeatherLocationKey[] = [
  'coastal_west',
  'coastal_east',
  'central_naic',
  'sabang',
  'farm_area',
  'naic_boundary',
];

export class WeatherService {
  public fetchWeatherIfNeeded = async () => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const hourlyLastFetch = getHourlyTimestamp();
    const realtimeLastFetch = getRealtimeTimestamp();
    const dailyLastFetch = getDailyTimestamp();
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    const thirtyMinutes = 30 * 60 * 1000;
    const twelveHours = 12 * 60 * 60 * 1000; // 12 hours

    // !hourlyLastFetch || now.getTime() - hourlyLastFetch.getTime() > oneHour
    if (!hourlyLastFetch || now.getTime() - hourlyLastFetch.getTime() > oneHour) {
      console.log('⏰ Fetching forecast data for all locations...');

      try {
        for (const locationKey of weatherGroups) {
          const forecastUrl = getWeatherAPIEndpoints(locationKey, 'forecast');
          const forecastResponse = await axios.get(forecastUrl);

          if (forecastResponse.status === 200) {
            await WeatherModel.insertHourlyData(locationKey, forecastResponse.data);
            console.log(`✅ Hourly Data saved for ${locationKey}`);
          } else {
            console.warn(`⚠️ Failed to fetch for ${locationKey}`);
          }

          await delay(1500); // Add delay to avoid 429 error
        }

        updateHourlyTimestamp();
        console.log('✅ All hourly data fetched successfully.');
      } catch (error) {
        console.error(`Hourly error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('🌤️ Using cached hourly data');
    }

    // !realtimeLastFetch || now.getTime() - realtimeLastFetch.getTime() > thirtyMinutes
    if (!realtimeLastFetch || now.getTime() - realtimeLastFetch.getTime() > thirtyMinutes) {
      console.log('⏰ Fetching realtime weather data for all locations...');

      try {
        for (const locationKey of weatherGroups) {
          const realtimeUrl = getWeatherAPIEndpoints(locationKey, 'realtime');
          const realtimeResponse = await axios.get(realtimeUrl);

          if (realtimeResponse.status === 200) {
            await WeatherModel.insertRealtimeData(locationKey, realtimeResponse.data);
            console.log(`✅ Realtime data saved for ${locationKey}`);
          } else {
            console.warn(`⚠️ Failed to fetch realtime data for ${locationKey}`);
          }

          await delay(1500); // Add delay to avoid 429 error
        }

        updateRealtimeTimestamp();
        console.log('✅ All realtime weather data fetched successfully.');
      } catch (error) {
        console.error(`realtime error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('🌤️ Using cached realtime data');
    }

    if (!dailyLastFetch || now.getTime() - dailyLastFetch.getTime() > twelveHours) {
      console.log('⏰ Fetching daily weather data for all locations...');

      try {
        for (const locationKey of weatherGroups) {
          const dailyUrl = getWeatherAPIEndpoints(locationKey, 'forecast');
          const dailyResponse = await axios.get(dailyUrl);

          if (dailyResponse.status === 200) {
            await WeatherModel.insertDailyData(locationKey, dailyResponse.data);
            console.log(`✅ Daily data saved for ${locationKey}`);
          } else {
            console.warn(`⚠️ Failed to fetch daily data for ${locationKey}`);
          }

          await delay(1500); // Add delay to avoid 429 error
        }

        updateDailyTimestamp();
        console.log('✅ All daily weather data fetched successfully.');
      } catch (error) {
        console.error(`daily error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('🌤️ Using cached daily data');
    }
  };
}
