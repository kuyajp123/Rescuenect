import { serve } from 'serve';
import { insertWeatherData } from '../_shared/firestore-client.ts';
import type { ForecastWeatherData } from '../_shared/types.ts';
import { WEATHER_LOCATIONS, convertToManilaTime, delay, getWeatherAPIUrl } from '../_shared/weather-utils.ts';

const processHourlyWeather = async (location: (typeof WEATHER_LOCATIONS)[0]) => {
  try {
    console.log(`🔄 Fetching hourly data for ${location.name}`);

    const forecastUrl = getWeatherAPIUrl(location.coordinates, 'forecast');
    const response = await fetch(forecastUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ForecastWeatherData = await response.json();
    if (!data || !data.timelines || !data.timelines.hourly || !Array.isArray(data.timelines.hourly)) {
      throw new Error('Invalid API response structure: Missing or invalid timelines.hourly array');
    }

    // Process first 24 hours
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
    console.log(`✅ Hourly data processed for ${location.name}`);
  } catch (error) {
    console.error(`❌ Error processing hourly data for ${location.name}:`, error);
    throw error;
  }
};

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('🌤️ Starting hourly weather data collection...');

    // Process all locations with delay to avoid rate limits
    for (const location of WEATHER_LOCATIONS) {
      await processHourlyWeather(location);
      await delay(1500); // Rate limiting delay
    }

    console.log('✅ All hourly weather data processed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Hourly weather data collected successfully',
        processedLocations: WEATHER_LOCATIONS.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Hourly weather collection failed:', error);

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
