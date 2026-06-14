// supabase/functions/_shared/weather-utils.ts
import { initializeFirebase } from './firestore-client.ts';
import { NAIC_CLIENT_ID, NAIC_WEATHER_LOCATION_KEY, canonicalizeClientId } from './location-config.ts';
import type { WeatherLocation } from './types.ts';

// Deno type declaration for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const toCoordinates = (latitude: number, longitude: number): string => `${latitude}, ${longitude}`;

const RETRYABLE_WEATHER_API_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

type WeatherApiErrorParams = {
  status?: number;
  statusText?: string;
  responseBody?: string;
  retryable?: boolean;
};

export class WeatherApiError extends Error {
  status?: number;
  statusText?: string;
  responseBody?: string;
  retryable: boolean;

  constructor(message: string, params: WeatherApiErrorParams = {}) {
    super(message);
    this.name = 'WeatherApiError';
    this.status = params.status;
    this.statusText = params.statusText;
    this.responseBody = params.responseBody;
    this.retryable = params.retryable ?? false;
  }
}

export const getWeatherErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const getResponseBodySnippet = (body?: string): string => {
  if (!body) return '';
  return body.replace(/\s+/g, ' ').trim().slice(0, 300);
};

const getWeatherLocationKey = (clientId: string, data: Record<string, unknown>): string =>
  canonicalizeClientId(clientId, data.municipalityCode) === NAIC_CLIENT_ID
    ? NAIC_WEATHER_LOCATION_KEY
    : typeof data.weatherLocationKey === 'string' && data.weatherLocationKey.trim()
      ? data.weatherLocationKey.trim()
      : clientId;

const getWeatherClientId = (clientId: string, data: Record<string, unknown>): string =>
  canonicalizeClientId(clientId, data.municipalityCode) ?? clientId;

export const getWeatherLocations = async (): Promise<WeatherLocation[]> => {
  const locations = new Map<string, WeatherLocation>();

  try {
    const db = initializeFirebase();
    const snapshot = await db.collection('clients').where('status', '==', 'active').get();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const key = getWeatherLocationKey(doc.id, data);
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

      if (locations.has(key) && doc.id !== key) {
        console.warn(`Skipping duplicate weather location for legacy client ${doc.id}; using ${key}`);
        return;
      }

      locations.set(key, {
        key,
        clientId: getWeatherClientId(doc.id, data),
        coordinates: toCoordinates(latitude, longitude),
        name,
      });
    });
  } catch (error) {
    console.warn('Unable to load dynamic client weather locations; no weather locations will be processed:', error);
  }

  return Array.from(locations.values());
};

export const getWeatherAPIUrl = (coordinates: string, type: 'forecast' | 'realtime'): string => {
  // Access Deno environment variable (works in Supabase Edge Functions)
  const API_KEY = Deno.env.get('WEATHER_API_KEY') ?? Deno.env.get('TOMORROW_IO_API_KEY');

  if (!API_KEY) {
    throw new Error('WEATHER_API_KEY or TOMORROW_IO_API_KEY environment variable is not set');
  }
  if (type === 'forecast') {
    return `https://api.tomorrow.io/v4/weather/forecast?location=${encodeURIComponent(coordinates)}&timesteps=1h&timesteps=1d&apikey=${API_KEY}`;
  }

  return `https://api.tomorrow.io/v4/weather/realtime?location=${encodeURIComponent(coordinates)}&apikey=${API_KEY}`;
};

export const fetchWeatherAPI = async (
  url: string,
  options: {
    attempts?: number;
    baseDelayMs?: number;
    context?: string;
  } = {}
): Promise<Response> => {
  const attempts = options.attempts ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 1500;
  const context = options.context ? ` (${options.context})` : '';

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url);

      if (response.ok) return response;

      const responseBody = await response.text().catch(() => '');
      const retryable = RETRYABLE_WEATHER_API_STATUSES.has(response.status);
      const bodySnippet = getResponseBodySnippet(responseBody);
      const error = new WeatherApiError(`Weather API HTTP ${response.status}: ${response.statusText}`, {
        status: response.status,
        statusText: response.statusText,
        responseBody: bodySnippet,
        retryable,
      });

      console.warn(
        `Weather API request failed${context}, attempt ${attempt}/${attempts}: ${error.message}${
          bodySnippet ? ` - ${bodySnippet}` : ''
        }`
      );

      if (!retryable || attempt === attempts) {
        throw error;
      }
    } catch (error) {
      const retryable = error instanceof WeatherApiError ? error.retryable : true;

      if (!retryable || attempt === attempts) {
        throw error;
      }

      console.warn(
        `Retrying Weather API request${context}, attempt ${attempt + 1}/${attempts} after: ${getWeatherErrorMessage(
          error
        )}`
      );
    }

    await delay(baseDelayMs * attempt);
  }

  throw new Error('Unexpected Weather API retry loop exit');
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
