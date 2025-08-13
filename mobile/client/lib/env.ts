import Constants from "expo-constants";

// Helper function to safely get environment variables
export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = Constants.expoConfig?.extra?.[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue || '';
};

// Type-safe environment variables
export const env = {
  backendUrl: getEnvVar('backendUrl', 'https://default.api.com'),
  apiKey: getEnvVar('apiKey'),
  authDomain: getEnvVar('authDomain'),
  projectId: getEnvVar('projectId'),
  storageBucket: getEnvVar('storageBucket'),
  messagingSenderId: getEnvVar('messagingSenderId'),
  appId: getEnvVar('appId'),
  measurementId: getEnvVar('measurementId'),
} as const;

// Export individual environment variables for convenience
export const {
  backendUrl,
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId,
} = env;
