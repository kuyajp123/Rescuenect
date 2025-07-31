import { getLocalTimestamp, updateLocalTimestamp } from '@/shared/utils/localTimestamp';
import { WeatherModel } from '@/models/WeatherModel';
import { getWeatherAPIEndpoints } from '@/shared/functions/WeatherAPIEndpoints';
import axios from 'axios';

type WeatherLocationKey = 'coastal_west' | 'coastal_east' | 'central_naic' | 'sabang' | 'farm_area' | 'naic_boundary';

const weatherGroups: WeatherLocationKey[] = [
  'coastal_west',
  'coastal_east',
  'central_naic',
  'sabang',
  'farm_area',
  'naic_boundary'
];

export class WeatherService {
  public fetchWeatherIfNeeded = async () => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const lastFetch = getLocalTimestamp();
    const now = new Date();
    const oneHour = 60 * 60 * 1000;

    if (!lastFetch || now.getTime() - lastFetch.getTime() > oneHour) {
      console.log('⏰ Fetching weather data for all locations...');

      try {
        for (const locationKey of weatherGroups) {
          const forecastUrl = getWeatherAPIEndpoints(locationKey, 'forecast');
          const realtimeUrl = getWeatherAPIEndpoints(locationKey, 'realtime');

          const forecastResponse = await axios.get(forecastUrl);
          const realtimeResponse = await axios.get(realtimeUrl);

          if (forecastResponse.status === 200 && realtimeResponse.status === 200) {
            await WeatherModel.insertForecastData(locationKey, forecastResponse.data);
            await WeatherModel.insertRealtimeData(locationKey, realtimeResponse.data);
            console.log(`✅ Data saved for ${locationKey}`);
          } else {
            console.warn(`⚠️ Failed to fetch for ${locationKey}`);
          }

          await delay(1500); // Add delay to avoid 429 error
        }

        updateLocalTimestamp();
        console.log('✅ All weather data fetched successfully.');
      } catch (error) {
        throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } else {
      console.log('🌤️ Using cached weather data');
    }
  };
}
