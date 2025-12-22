// Import the functions you need from the SDKs you need
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
let firebaseConfig;

try {
  if (firebaseConfigStr) {
    firebaseConfig = JSON.parse(firebaseConfigStr);
  } else {
    // Fallback: Check for individual variables if the single object isn't found
    console.warn('⚠️ EXPO_PUBLIC_FIREBASE_CONFIG not found, setting dummy config to prevent crash...');
    Alert.alert('Configuration Error', 'EXPO_PUBLIC_FIREBASE_CONFIG is missing. Falling back to dummy config.');
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
} catch (error) {
  console.error('❌ Failed to parse EXPO_PUBLIC_FIREBASE_CONFIG:', error);
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
