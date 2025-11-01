import { serve } from 'serve';
import { insertWeatherData } from '../_shared/firestore-client.ts';
import type { RealtimeWeatherData } from '../_shared/types.ts';
import { WEATHER_LOCATIONS, convertToManilaTime, delay, getWeatherAPIUrl } from '../_shared/weather-utils.ts';

const processRealtimeWeather = async (location: (typeof WEATHER_LOCATIONS)[0]) => {
  try {

    const realtimeUrl = getWeatherAPIUrl(location.coordinates, 'realtime');
    const response = await fetch(realtimeUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

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
    console.error(`❌ Error processing realtime data for ${location.name}:`, error);
    throw error;
  }
};

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('⚡ Starting realtime weather data collection...');

    for (const location of WEATHER_LOCATIONS) {
      await processRealtimeWeather(location);
      await delay(1500);
    }

    console.log('✅ All realtime weather data processed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Realtime weather data collected successfully',
        processedLocations: WEATHER_LOCATIONS.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Realtime weather collection failed:', error);

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
