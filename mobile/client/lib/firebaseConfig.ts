// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // apiKey: "AIzaSyDXR-C63KYDKQrBmGBixtpMXLtxr-BM_H8",
  // authDomain: "lively-metrics-453114-q3.firebaseapp.com",
  // projectId: "lively-metrics-453114-q3",
  // storageBucket: "lively-metrics-453114-q3.firebasestorage.app",
  // messagingSenderId: "554379793893",
  // appId: "1:554379793893:web:c6e4961521afd529f4cb0c",
  // measurementId: "G-MMHZGGB9WQ"
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
