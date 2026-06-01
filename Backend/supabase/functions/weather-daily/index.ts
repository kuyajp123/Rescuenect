import { serve } from 'serve';
import { insertWeatherData } from '../_shared/firestore-client.ts';
import type { ForecastWeatherData, WeatherLocation } from '../_shared/types.ts';
import { convertToManilaTime, delay, getWeatherAPIUrl, getWeatherLocations } from '../_shared/weather-utils.ts';

const processDailyWeather = async (location: WeatherLocation) => {
  try {

    const forecastUrl = getWeatherAPIUrl(location.coordinates, 'forecast');
    const response = await fetch(forecastUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ForecastWeatherData = await response.json();
    if (!data || !data.timelines || !data.timelines.daily || !Array.isArray(data.timelines.daily)) {
      throw new Error('Invalid API response structure: Missing or invalid timelines.daily array');
    }

    // Process daily forecasts
    const promises = data.timelines.daily.map((day, index) => {
      const localTime = convertToManilaTime(day.time);
      const paddedId = index.toString().padStart(3, '0');

      return insertWeatherData('weather', location.key, 'daily', paddedId, {
        time: localTime,
        ...day.values,
      });
    });

    await Promise.all(promises);
  } catch (error) {
    console.error(`❌ Error processing daily data for ${location.name}:`, error);
    throw error;
  }
};

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('📅 Starting daily weather data collection...');

    const weatherLocations = await getWeatherLocations();

    for (const location of weatherLocations) {
      await processDailyWeather(location);
      await delay(1500);
    }

    console.log('✅ All daily weather data processed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily weather data collected successfully',
        processedLocations: weatherLocations.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Daily weather collection failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
