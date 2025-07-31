import { getLocalTimestamp, updateLocalTimestamp } from '@/shared/utils/localTimestamp';
import { WeatherModel } from '@/models/WeatherModel';
import { getWeatherAPIEndpoints } from '@/shared/functions/WeatherAPIEndpoints';
import axios from 'axios';

export class WeatherService {
  private coastalWestForecast = getWeatherAPIEndpoints('coastalWest', 'forecast');
  private coastalWestRealtime = getWeatherAPIEndpoints('coastalWest', 'realtime');
  private coastalEastForecast = getWeatherAPIEndpoints('coastalEast', 'forecast');
  private coastalEastRealtime = getWeatherAPIEndpoints('coastalEast', 'realtime');
  private centralNaicForecast = getWeatherAPIEndpoints('centralNaic', 'forecast');
  private centralNaicRealtime = getWeatherAPIEndpoints('centralNaic', 'realtime');
  private sabangForecast = getWeatherAPIEndpoints('sabang', 'forecast');
  private sabangRealtime = getWeatherAPIEndpoints('sabang', 'realtime');
  private farmAreaForecast = getWeatherAPIEndpoints('farmArea', 'forecast');
  private farmAreaRealtime = getWeatherAPIEndpoints('farmArea', 'realtime');
  private naicBoundaryForecast = getWeatherAPIEndpoints('naicBoundary', 'forecast');
  private naicBoundaryRealtime = getWeatherAPIEndpoints('naicBoundary', 'realtime');

  private API_KEY = process.env.WEATHER_API_KEY!;

  private realtimeData = `https://api.tomorrow.io/v4/weather/realtime?location=14.307235%2C%20120.772340&apikey=${this.API_KEY}`;

private forecastData = `https://api.tomorrow.io/v4/weather/forecast?location=14.307235%2C%20120.772340&timesteps=1h&timesteps=1d&apikey=${this.API_KEY}`;

  public fetchWeatherIfNeeded = async () => {
    const lastFetch = getLocalTimestamp();
    const now = new Date();
    const oneHour = 60 * 60 * 1000;

    // !lastFetch ||now.getTime() - lastFetch.getTime() > oneHour
    if(!lastFetch ||now.getTime() - lastFetch.getTime() > oneHour) {
      console.log('⏰ Fetching new weather data...');

      try {
        const forecastResponse = await axios.get(this.forecastData);
        const realtimeResponse = await axios.get(this.realtimeData);
        if (forecastResponse.status === 200 && realtimeResponse.status === 200) {
          console.log('✅ Weather data fetched successfully');
          const forecastData = forecastResponse.data;
          const realtimeData = realtimeResponse.data;
          await WeatherModel.insertForecastData('central-naic', forecastData);
          await WeatherModel.insertRealtimeData('central-naic', realtimeData);
          updateLocalTimestamp();
          return { forecastData, realtimeData };        }
      } catch (error) {
        throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }else {
      console.log('🌤️ Using cached weather data');
    }
  }

}