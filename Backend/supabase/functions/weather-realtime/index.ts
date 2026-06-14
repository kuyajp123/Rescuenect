import { serve } from 'serve';
import { insertWeatherData } from '../_shared/firestore-client.ts';
import type { RealtimeWeatherData, WeatherLocation } from '../_shared/types.ts';
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

const processRealtimeWeather = async (location: WeatherLocation) => {
  try {
    const realtimeUrl = getWeatherAPIUrl(location.coordinates, 'realtime');
    const response = await fetchWeatherAPI(realtimeUrl, {
      context: `realtime ${location.key}`,
    });

    const data: RealtimeWeatherData = await response.json();
    if (!data || !data.data || !data.data.values) {
      throw new Error('Invalid API response structure: Missing data.values');
    }

    const localTime = convertToManilaTime(data.data.time);

    await insertWeatherData('weather', location.key, 'realtime', 'data', {
      time: localTime,
      ...data.data.values,
      location: data.location,
    });
  } catch (error) {
    console.error(`Error processing realtime data for ${location.name}:`, error);
    throw error;
  }
};

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('Starting realtime weather data collection...');

    const weatherLocations = await getWeatherLocations();
    const results: LocationResult[] = [];

    for (const location of weatherLocations) {
      try {
        await processRealtimeWeather(location);
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
      console.warn(`Realtime weather completed with ${failedLocations.length} failed location(s)`);
    } else {
      console.log('All realtime weather data processed successfully');
    }

    return new Response(
      JSON.stringify({
        success: failedLocations.length === 0,
        message:
          failedLocations.length === 0
            ? 'Realtime weather data collected successfully'
            : allLocationsFailed
              ? 'Realtime weather data failed for all locations'
              : 'Realtime weather data collected with some location failures',
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
    console.error('Realtime weather collection failed:', error);

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
