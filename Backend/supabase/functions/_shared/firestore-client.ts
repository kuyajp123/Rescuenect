import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// Singleton pattern for Firebase initialization
let firestoreInstance: Firestore | null = null;

const initializeFirebase = () => {
  // Return existing instance if already initialized
  if (firestoreInstance) {
    return firestoreInstance;
  }

  try {
    // Check if Firebase app already exists
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firestoreInstance = getFirestore(existingApps[0]);
      return firestoreInstance;
    }

    const serviceAccountKeyString = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');

    if (!serviceAccountKeyString) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set');
    }

    let serviceAccount;

    // Check if the JSON is Base64 encoded
    if (serviceAccountKeyString.startsWith('ew') || !serviceAccountKeyString.startsWith('{')) {
      try {
        const decodedJson = atob(serviceAccountKeyString);
        serviceAccount = JSON.parse(decodedJson);
      } catch (decodeError) {
        console.error('❌ Failed to decode Base64 service account JSON:', decodeError);
        throw new Error('Failed to decode Base64 service account JSON');
      }
    } else {
      // Clean up the JSON string - remove any potential escape characters
      const cleanedJson = serviceAccountKeyString
        .replace(/\\"/g, '"') // Replace escaped quotes
        .replace(/\\\\/g, '\\') // Replace double backslashes
        .trim(); // Remove whitespace

      serviceAccount = JSON.parse(cleanedJson);
    }

    const app = initializeApp({
      credential: cert(serviceAccount as ServiceAccount),
    });

    firestoreInstance = getFirestore(app);
    return firestoreInstance;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
};

export const insertWeatherData = async (
  collection: string,
  document: string,
  subcollection: string,
  docId: string,
  data: Record<string, unknown>
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
  const requiredEnvVars = ['WEATHER_API_KEY', 'FIREBASE_SERVICE_ACCOUNT_JSON'];
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
    const serviceAccountKeyString = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')!;
    let serviceAccountKey;

    // Handle Base64 encoded or plain JSON
    if (serviceAccountKeyString.startsWith('ew') || !serviceAccountKeyString.startsWith('{')) {
      const decodedJson = atob(serviceAccountKeyString);
      serviceAccountKey = JSON.parse(decodedJson);
    } else {
      serviceAccountKey = JSON.parse(serviceAccountKeyString);
    }

    if (serviceAccountKey.type !== 'service_account') {
      throw new Error('Invalid Firebase service account type');
    }
  } catch (error) {
    console.error('Error validating FIREBASE_SERVICE_ACCOUNT_JSON:', error);
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format');
  }

  return true;
};
