// supabase/functions/_shared/weather-utils.ts
import type { WeatherLocation } from './types.ts';

// Deno type declaration for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

export const WEATHER_LOCATIONS: WeatherLocation[] = [
  { key: 'coastal_west', coordinates: '14.311667, 120.751944', name: 'Coastal West' },
  { key: 'coastal_east', coordinates: '14.333333, 120.771389', name: 'Coastal East' },
  { key: 'central_naic', coordinates: '14.302222, 120.771944', name: 'Central Naic' },
  { key: 'sabang', coordinates: '14.320000, 120.805833', name: 'Sabang' },
  { key: 'farm_area', coordinates: '14.289444, 120.793889', name: 'Farm Area' },
  { key: 'naic_boundary', coordinates: '14.260278, 120.820278', name: 'Naic Boundary' },
];

export const getWeatherAPIUrl = (coordinates: string, type: 'forecast' | 'realtime'): string => {
  // Access Deno environment variable (works in Supabase Edge Functions)
  const API_KEY = Deno.env.get('WEATHER_API_KEY');

  if (!API_KEY) {
    throw new Error('WEATHER_API_KEY environment variable is not set');
  }
  if (type === 'forecast') {
    return `https://api.tomorrow.io/v4/weather/forecast?location=${coordinates}&timesteps=1h&timesteps=1d&apikey=${API_KEY}`;
  }

  return `https://api.tomorrow.io/v4/weather/realtime?location=${coordinates}&apikey=${API_KEY}`;
};

export const convertToManilaTime = (utcTime: string): string => {
  const date = new Date(utcTime);
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
