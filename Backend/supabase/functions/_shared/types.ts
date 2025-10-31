// supabase/functions/_shared/types.ts
// Deno and Supabase Edge Function type declarations

// Deno runtime types
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

// Weather location interface
export interface WeatherLocation {
  key: string;
  coordinates: string;
  name: string;
}

// Weather API types
export interface WeatherAPIResponse {
  timelines: {
    hourly?: Array<{
      time: string;
      values: Record<string, any>;
    }>;
    daily?: Array<{
      time: string;
      values: Record<string, any>;
    }>;
  };
  data?: {
    time: string;
    values: Record<string, any>;
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
