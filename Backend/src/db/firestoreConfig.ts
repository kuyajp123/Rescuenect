import dotenv from 'dotenv';
import * as admin from 'firebase-admin';

// Load environment variables
dotenv.config();

if (!process.env.FIREBASE_ADMIN_CREDENTIALS) {
  throw new Error('FIREBASE_ADMIN_CREDENTIALS environment variable is not set');
}

let rawCreds;
try {
  rawCreds = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
} catch (error) {
  console.error('Failed to parse FIREBASE_ADMIN_CREDENTIALS as JSON:', error);
  console.error('Raw value:', process.env.FIREBASE_ADMIN_CREDENTIALS);
  throw new Error('Invalid JSON in FIREBASE_ADMIN_CREDENTIALS');
}

rawCreds.private_key = rawCreds.private_key.replace(/\\n/g, '\n');

try {
  // Initialize Firebase Admin SDK
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(rawCreds),
    });
  }
  console.log('database connected successfuully');
} catch (error) {
  throw new Error(error as string);
}

// Get Firestore instance
export const db = admin.firestore();

// Export admin for other uses (auth, etc.)
export { admin };
export default db;
