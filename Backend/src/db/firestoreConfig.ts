import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import serviceAccount from '../../lively-metrics-453114-q3-firebase-adminsdk-fbsvc-dba3bff89c.json';

// Load environment variables
dotenv.config();

try {
  // Initialize Firebase Admin SDK with service account
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  }
  console.log('✅ Database connected successfully.');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  throw new Error(`Firebase initialization failed: ${error instanceof Error ? error.message : error}`);
}

// Get Firestore instance with settings
export const db = admin.firestore();

// Export admin for other uses (auth, etc.)
export { admin };
export default db;
