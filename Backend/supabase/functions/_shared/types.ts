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

// ========================
// EARTHQUAKE SYSTEM TYPES
// ========================

export interface EarthquakeData {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  coordinates: {
    longitude: number;
    latitude: number;
    depth: number;
  };
  severity: 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';
  tsunami_warning: boolean;
}

export interface EarthquakeNotification {
  type: 'earthquake_alert';
  earthquake_id: string;
  magnitude: number;
  location: string;
  severity: string;
  timestamp: number;
}

export interface USGSEarthquake {
  id: string;
  type: 'Feature';
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    tsunami: number;
    status: string;
    title: string;
    detail: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [lng, lat, depth]
  };
}

export interface USGSResponse {
  type: 'FeatureCollection';
  features: USGSEarthquake[];
  metadata: {
    count: number;
    status: number;
    generated: number;
    title: string;
  };
}

export interface ProcessedEarthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  updated: number;
  coordinates: {
    longitude: number;
    latitude: number;
    depth: number;
  };
  severity: 'micro' | 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';
  priority: 'low' | 'normal' | 'high' | 'critical';
  tsunami_warning: boolean;
  usgs_url: string;
  distance_km?: number;
  impact_radii: {
    felt_radius_km: number;
    moderate_shaking_radius_km: number;
    strong_shaking_radius_km: number;
    estimation_params: {
      feltA: number;
      moderateA: number;
      strongA: number;
      B: number;
      D: number;
    };
  };
  notification_sent: boolean;
}

export interface EarthquakeNotificationData {
  type: 'earthquake_alert';
  earthquake_id: string;
  magnitude: string;
  location: string;
  time: string;
  severity: string;
  priority: string;
  usgs_url: string;
  coordinates: string; // JSON string of coordinates
  tsunami_warning: string;
}

export interface EarthquakeMonitorResult {
  success: boolean;
  message: string;
  new_earthquakes: number;
  notifications_sent: number;
  total_processed: number;
  timestamp: string;
  earthquakes?: Array<{
    id: string;
    magnitude: number;
    place: string;
    time: string;
    severity: string;
  }>;
  error?: string;
}

export {};
