// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from "firebase/firestore";
import { getMessaging } from '@react-native-firebase/messaging';
import { getApp as fcmGetApp } from '@react-native-firebase/app';


const fcmApp = fcmGetApp();
const messaging = getMessaging(fcmApp);

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN_KEY,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_MEASUREMENT_ID
};

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
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
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

