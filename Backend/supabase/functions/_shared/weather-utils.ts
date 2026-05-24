// supabase/functions/_shared/weather-utils.ts
import {
  ACTIVE_WEATHER_LOCATION_KEYS,
  WEATHER_LOCATION_COORDINATES,
  WEATHER_LOCATION_LABELS,
} from './location-config.ts';
import { initializeFirebase } from './firestore-client.ts';
import type { WeatherLocation } from './types.ts';

// Deno type declaration for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

export const WEATHER_LOCATIONS: WeatherLocation[] = ACTIVE_WEATHER_LOCATION_KEYS.map(key => ({
  key,
  clientId: key,
  coordinates: WEATHER_LOCATION_COORDINATES[key],
  name: WEATHER_LOCATION_LABELS[key],
}));

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const toCoordinates = (latitude: number, longitude: number): string => `${latitude}, ${longitude}`;

export const getWeatherLocations = async (): Promise<WeatherLocation[]> => {
  const locations = new Map<string, WeatherLocation>();
  WEATHER_LOCATIONS.forEach(location => locations.set(location.key, location));

  try {
    const db = initializeFirebase();
    const snapshot = await db.collection('clients').where('status', '==', 'active').get();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const key =
        typeof data.weatherLocationKey === 'string' && data.weatherLocationKey.trim()
          ? data.weatherLocationKey.trim()
          : doc.id;
      const latitude = data.weatherLatitude;
      const longitude = data.weatherLongitude;

      if (!key || !isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
        console.warn(`Skipping weather location for client ${doc.id}: missing key or coordinates`);
        return;
      }

      const name =
        typeof data.name === 'string' && data.name.trim()
          ? data.name.trim()
          : typeof data.municipalityName === 'string' && data.municipalityName.trim()
          ? data.municipalityName.trim()
          : key;

      locations.set(key, {
        key,
        clientId: doc.id,
        coordinates: toCoordinates(latitude, longitude),
        name,
      });
    });
  } catch (error) {
    console.warn('Unable to load dynamic client weather locations; using static fallback only:', error);
  }

  return Array.from(locations.values());
};

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
