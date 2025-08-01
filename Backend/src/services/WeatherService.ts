import axios from 'axios';
import { 
  getForecastTimestamp, 
  updateForecastlTimestamp,
  getRealtimeTimestamp,
  updateRealtimeTimestamp 
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
  'naic_boundary'
];

export class WeatherService {
  public fetchWeatherIfNeeded = async () => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const forecastlastFetch = getForecastTimestamp();
    const realtimelastFetch = getRealtimeTimestamp();
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    const thirtyMinutes = 30 * 60 * 1000;

    if (!forecastlastFetch || now.getTime() - forecastlastFetch.getTime() > oneHour) {
      console.log('⏰ Fetching forecast data for all locations...');

      try {
        updateForecastlTimestamp();
        for (const locationKey of weatherGroups) {
          const forecastUrl = getWeatherAPIEndpoints(locationKey, 'forecast');

          const forecastResponse = await axios.get(forecastUrl);

          if (forecastResponse.status === 200) {
            await WeatherModel.insertForecastData(locationKey, forecastResponse.data);
            console.log(`✅ Data saved for ${locationKey}`);
          } else {
            console.warn(`⚠️ Failed to fetch for ${locationKey}`);
          }

          await delay(1500); // Add delay to avoid 429 error
        }

        console.log('✅ All forecast data fetched successfully.');
      } catch (error) {
         console.error(`Forecast error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } else {
      console.log('🌤️ Using cached forecast data');
    }

    if(!realtimelastFetch || now.getTime() - realtimelastFetch.getTime() > thirtyMinutes) {
      console.log('⏰ Fetching realtime weather data for all locations...');

      try {
        updateRealtimeTimestamp();
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

        console.log('✅ All realtime weather data fetched successfully.');
      } catch (error) {
         console.error(`realtime error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }else{
      console.log('🌤️ Using cached realtime data');
    }

  };
}
