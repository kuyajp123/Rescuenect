// supabase/functions/_shared/types.ts
// Deno and Supabase Edge Function type declarations

// Deno runtime types (already available globally in Deno runtime)

// Weather location interface
export interface WeatherLocation {
  key: string;
  coordinates: string;
  name: string;
}

export interface WeatherValues {
  temperature?: number;
  temperatureApparent?: number;
  humidity?: number;
  windSpeed?: number;
  [key: string]: string | number | undefined;
}

// Weather API response structures
export interface WeatherTimelineEntry {
  time: string;
  values: WeatherValues;
}

export interface ForecastWeatherData {
  timelines: {
    hourly: WeatherTimelineEntry[];
    daily: WeatherTimelineEntry[];
  };
  location: {
    lat: number;
    lon: number;
  };
}

export interface RealtimeWeatherData {
  data: {
    time: string;
    values: WeatherValues;
  };
  location: {
    lat: number;
    lon: number;
  };
}

// Firebase types for Edge Functions
export interface FirebaseServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Function response types
export interface FunctionResponse {
  success: boolean;
  message?: string;
  error?: string;
  processedLocations?: number;
  timestamp: string;
}

// Environment variable validation
export interface EnvironmentConfig {
  WEATHER_API_KEY: string;
  FIREBASE_SERVICE_ACCOUNT_KEY: string;
}

export {};
