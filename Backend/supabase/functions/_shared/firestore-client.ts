// @ts-ignore - Deno module resolution
import { cert, initializeApp } from 'https://esm.sh/firebase-admin@11.8.0/app';
// @ts-ignore - Deno module resolution
import { getFirestore } from 'https://esm.sh/firebase-admin@11.8.0/firestore';
import type { FirebaseServiceAccount } from './types.ts';

// Deno type declaration for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Initialize Firebase Admin SDK in Edge Function
const initializeFirebase = () => {
  const serviceAccountKeyString = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY');

  if (!serviceAccountKeyString) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  let serviceAccountKey: FirebaseServiceAccount;
  try {
    serviceAccountKey = JSON.parse(serviceAccountKeyString) as FirebaseServiceAccount;
  } catch (error) {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format');
  }

  const app = initializeApp({
    credential: cert(serviceAccountKey),
  });

  return getFirestore(app);
};

export const insertWeatherData = async (
  collection: string,
  document: string,
  subcollection: string,
  docId: string,
  data: any
) => {
  try {
    const db = initializeFirebase();

    // Store in Firestore using the existing structure
    const docRef = db.collection(collection).doc(document);

    await docRef.collection(subcollection).doc(docId).set(data);

    console.log(`✅ Data inserted to Firestore: ${collection}/${document}/${subcollection}/${docId}`);
  } catch (error) {
    console.error('Firestore insert error:', error);
    throw error;
  }
};

// Environment validation helper
export const validateEnvironment = () => {
  const requiredEnvVars = ['WEATHER_API_KEY', 'FIREBASE_SERVICE_ACCOUNT_KEY'];
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!Deno.env.get(envVar)) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate Firebase service account JSON
  try {
    const serviceAccountKeyString = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')!;
    const serviceAccountKey = JSON.parse(serviceAccountKeyString);

    if (serviceAccountKey.type !== 'service_account') {
      throw new Error('Invalid Firebase service account type');
    }
  } catch (error) {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
  }

  return true;
};
