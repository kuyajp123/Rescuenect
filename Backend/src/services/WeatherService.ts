import { getLocalTimestamp, updateLocalTimestamp } from '@/utils/localTimestamp';
import { WeatherModel } from '@/models/WeatherModel';
import axios from 'axios';

export class WeatherService {
  private API_KEY = process.env.WEATHER_API_KEY!;
  private API_URL = `https://api.tomorrow.io/v4/weather/forecast?location=14.307235%2C%20120.772340&apikey=${this.API_KEY}`;

  public fetchWeatherIfNeeded = async () => {
    const lastFetch = getLocalTimestamp();
    const now = new Date();
    const oneHour = 60 * 60 * 1000;

    if(!lastFetch ||now.getTime() - lastFetch.getTime() > oneHour){
      console.log('⏰ Fetching new weather data...');

      try {
        const response = await axios.get(this.API_URL);
        if (response.status === 200) {
          console.log('✅ Weather data fetched successfully');
          const data = response.data;
          updateLocalTimestamp();
          await WeatherModel.insertWeatherData(JSON.stringify(data));
          return data;
        }
      } catch (error) {
        throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }else {
      console.log('🌤️ Using cached weather data');
    }
  }

}