import { serve } from 'serve';
import { insertWeatherData } from '../_shared/firestore-client.ts';
import type { ForecastWeatherData, WeatherLocation } from '../_shared/types.ts';
import {
  WeatherApiError,
  convertToManilaTime,
  delay,
  fetchWeatherAPI,
  getWeatherAPIUrl,
  getWeatherErrorMessage,
  getWeatherLocations,
} from '../_shared/weather-utils.ts';

type LocationResult = {
  key: string;
  name: string;
  success: boolean;
  error?: string;
  upstream?: boolean;
};

const processHourlyWeather = async (location: WeatherLocation) => {
  try {
    const forecastUrl = getWeatherAPIUrl(location.coordinates, 'forecast');
    const response = await fetchWeatherAPI(forecastUrl, {
      context: `hourly ${location.key}`,
    });

    const data: ForecastWeatherData = await response.json();
    if (!data || !data.timelines || !data.timelines.hourly || !Array.isArray(data.timelines.hourly)) {
      throw new Error('Invalid API response structure: Missing or invalid timelines.hourly array');
    }

    const promises = [];
    const hourlyData = data.timelines.hourly;
    for (let i = 0; i < 24 && i < hourlyData.length; i++) {
      const hour = hourlyData[i];
      const localTime = convertToManilaTime(hour.time);
      const paddedId = i.toString().padStart(3, '0');

      promises.push(
        insertWeatherData('weather', location.key, 'hourly', paddedId, {
          time: localTime,
          ...hour.values,
        })
      );
    }

    await Promise.all(promises);
  } catch (error) {
    console.error(`Error processing hourly data for ${location.name}:`, error);
    throw error;
  }
};

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('Starting hourly weather data collection...');

    const weatherLocations = await getWeatherLocations();
    const results: LocationResult[] = [];

    for (const location of weatherLocations) {
      try {
        await processHourlyWeather(location);
        results.push({ key: location.key, name: location.name, success: true });
      } catch (error) {
        results.push({
          key: location.key,
          name: location.name,
          success: false,
          error: getWeatherErrorMessage(error),
          upstream: error instanceof WeatherApiError && error.retryable,
        });
      }

      await delay(1500);
    }

    const failedLocations = results.filter(result => !result.success);
    const successfulLocations = results.filter(result => result.success);
    const allLocationsFailed = weatherLocations.length > 0 && failedLocations.length === weatherLocations.length;
    const upstreamOnly = failedLocations.length > 0 && failedLocations.every(result => result.upstream);
    const status = failedLocations.length === 0 || successfulLocations.length > 0 ? 200 : upstreamOnly ? 502 : 500;

    if (failedLocations.length > 0) {
      console.warn(`Hourly weather completed with ${failedLocations.length} failed location(s)`);
    } else {
      console.log('All hourly weather data processed successfully');
    }

    return new Response(
      JSON.stringify({
        success: failedLocations.length === 0,
        message:
          failedLocations.length === 0
            ? 'Hourly weather data collected successfully'
            : allLocationsFailed
              ? 'Hourly weather data failed for all locations'
              : 'Hourly weather data collected with some location failures',
        processedLocations: weatherLocations.length,
        succeededLocations: successfulLocations.length,
        failedLocations,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status,
      }
    );
  } catch (error) {
    console.error('Hourly weather collection failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: getWeatherErrorMessage(error),
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
