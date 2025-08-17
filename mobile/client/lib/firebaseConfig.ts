// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDXR-C63KYDKQrBmGBixtpMXLtxr-BM_H8",
  authDomain: "lively-metrics-453114-q3.firebaseapp.com",
  projectId: "lively-metrics-453114-q3",
  storageBucket: "lively-metrics-453114-q3.firebasestorage.app",
  messagingSenderId: "554379793893",
  appId: "1:554379793893:web:c6e4961521afd529f4cb0c",
  measurementId: "G-MMHZGGB9WQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
