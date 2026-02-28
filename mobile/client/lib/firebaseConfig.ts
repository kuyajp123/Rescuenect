import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp as fcmGetApp } from '@react-native-firebase/app';
import { getMessaging } from '@react-native-firebase/messaging';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Alert } from 'react-native';

const fcmApp = fcmGetApp();
const messaging = getMessaging(fcmApp);

// Parse the single config object from environment variables
const firebaseConfigStr = process.env.EXPO_PUBLIC_FIREBASE_CONFIG;

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

let firebaseConfig: FirebaseConfig;

const buildConfigFromEnvVars = (): { config: FirebaseConfig | null; missing: string[] } => {
  const apiKey = process.env.EXPO_PUBLIC_API_KEY;
  const authDomain =
    process.env.EXPO_PUBLIC_AUTH_DOMAIN || process.env.EXPO_PUBLIC_AUTH_DOMAIN_KEY;
  const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
  const storageBucket = process.env.EXPO_PUBLIC_STORAGE_BUCKET;
  const messagingSenderId = process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID;
  const appId = process.env.EXPO_PUBLIC_APP_ID;
  const measurementId = process.env.EXPO_PUBLIC_MEASUREMENT_ID;

  const missing = [
    !apiKey && 'EXPO_PUBLIC_API_KEY',
    !authDomain && 'EXPO_PUBLIC_AUTH_DOMAIN (or EXPO_PUBLIC_AUTH_DOMAIN_KEY)',
    !projectId && 'EXPO_PUBLIC_PROJECT_ID',
    !storageBucket && 'EXPO_PUBLIC_STORAGE_BUCKET',
    !messagingSenderId && 'EXPO_PUBLIC_MESSAGING_SENDER_ID',
    !appId && 'EXPO_PUBLIC_APP_ID',
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return { config: null, missing };
  }

  return {
    config: {
      apiKey: apiKey as string,
      authDomain: authDomain as string,
      projectId: projectId as string,
      storageBucket: storageBucket as string,
      messagingSenderId: messagingSenderId as string,
      appId: appId as string,
      measurementId,
    },
    missing: [],
  };
};

try {
  if (firebaseConfigStr) {
    firebaseConfig = JSON.parse(firebaseConfigStr) as FirebaseConfig;
  } else {
    // Fallback: Check for individual variables if the single object isn't found
    const { config, missing } = buildConfigFromEnvVars();
    if (config) {
      firebaseConfig = config;
    } else {
      console.warn(
        `WARN: EXPO_PUBLIC_FIREBASE_CONFIG not found and missing individual vars: ${missing.join(', ')}. ` +
          'Setting dummy config to prevent crash...',
      );
      Alert.alert(
        'Configuration Error',
        `Missing Firebase env vars: ${missing.join(', ')}. Falling back to dummy config.`,
      );
      firebaseConfig = {
        apiKey: 'MISSING_API_KEY',
        authDomain: 'MISSING_AUTH_DOMAIN',
        projectId: 'MISSING_PROJECT_ID',
        storageBucket: 'MISSING_STORAGE_BUCKET',
        messagingSenderId: '000000000000',
        appId: 'MISSING_APP_ID',
        measurementId: 'MISSING_MEASUREMENT_ID',
      };
    }
  }
} catch (error) {
  console.error('ERROR: Failed to parse EXPO_PUBLIC_FIREBASE_CONFIG:', error);
  Alert.alert('Configuration Error', 'Failed to parse EXPO_PUBLIC_FIREBASE_CONFIG. Check JSON format.');
  // Do NOT throw here, as it crashes the app immediately on launch.
  // Instead, set a potentially broken config so at least the app UI can load and we can debug.
  firebaseConfig = {
    apiKey: 'MISSING_API_KEY',
    authDomain: 'MISSING_AUTH_DOMAIN',
    projectId: 'MISSING_PROJECT_ID',
    storageBucket: 'MISSING_STORAGE_BUCKET',
    messagingSenderId: '000000000000',
    appId: 'MISSING_APP_ID',
    measurementId: 'MISSING_MEASUREMENT_ID',
  };
}

// Initialize Firebase App with duplicate check
let app: FirebaseApp;
if (getApps().length === 0) {
  // No Firebase apps initialized yet
  app = initializeApp(firebaseConfig);
} else {
  // Firebase app already exists, get the existing one
  app = getApp();
}

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Initialize Auth with proper error handling and duplicate check
let auth: Auth;
try {
  // Try to initialize auth with persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (error: any) {
  // If already initialized, get the existing instance
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

export { auth, messaging };
