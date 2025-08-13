// Import the functions you need from the SDKs you need
import { env } from '@/lib/env';
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: env.apiKey,
  authDomain: env.authDomain,
  projectId: env.projectId,
  storageBucket: env.storageBucket,
  messagingSenderId: env.messagingSenderId,
  appId: env.appId,
  measurementId: env.measurementId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);