import dotenv from 'dotenv';
import * as admin from 'firebase-admin';

// Load environment variables
dotenv.config();

let serviceAccount: any;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));
  } else {
    // Fallback to local file for development
    // Using require to avoid TypeScript build errors if file is missing in prod
    serviceAccount = require('../../lively-metrics-453114-q3-firebase-adminsdk-fbsvc-dba3bff89c.json');
  }
} catch (error) {
  console.warn(
    '⚠️ Could not load Firebase Service Account. Ensure FIREBASE_SERVICE_ACCOUNT_BASE64 is set in production or the JSON file exists locally.'
  );
}

let initializationAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Initialize Firebase Admin SDK with enhanced error handling and token refresh support
 */
function initializeFirebase(): admin.app.App {
  try {
    if (admin.apps.length > 0) {
      console.log('♻️ Firebase Admin SDK already initialized, reusing instance');
      return admin.app();
    }

    if (!serviceAccount) {
      throw new Error('Firebase Service Account credentials are missing.');
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Explicitly set project ID to prevent authentication issues
      projectId: serviceAccount.project_id,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`📋 Project ID: ${serviceAccount.project_id}`);

    initializationAttempts = 0;
    return app;
  } catch (error) {
    initializationAttempts++;
    console.error(
      `❌ Failed to initialize Firebase Admin SDK (Attempt ${initializationAttempts}/${MAX_RETRY_ATTEMPTS}):`,
      error
    );

    if (initializationAttempts < MAX_RETRY_ATTEMPTS) {
      console.log(`🔄 Retrying initialization in 2 seconds...`);
      return new Promise(resolve => {
        setTimeout(() => resolve(initializeFirebase()), 2000);
      }) as any;
    }

    throw new Error(
      `Firebase initialization failed after ${MAX_RETRY_ATTEMPTS} attempts: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

// Initialize Firebase
const app = initializeFirebase();

// Get Firestore instance with settings
export const db = admin.firestore();

// Configure Firestore settings for better performance and reliability
db.settings({
  ignoreUndefinedProperties: true,
  // Increase timeout for better reliability on slow networks
  timestampsInSnapshots: true,
});

/**
 * Health check function to verify Firebase Admin SDK credentials are valid
 * Call this periodically or before critical operations
 */
export async function verifyFirebaseConnection(): Promise<boolean> {
  try {
    // Simple operation to verify credentials work
    const testRef = db.collection('_healthcheck').doc('test');
    await testRef.set({ timestamp: admin.firestore.FieldValue.serverTimestamp(), status: 'ok' }, { merge: true });
    await testRef.delete(); // Clean up

    console.log('✅ Firebase connection verified');
    return true;
  } catch (error: any) {
    console.error('❌ Firebase connection verification failed:', {
      error: error.message,
      code: error.code,
      details: error.details,
    });

    // Check if it's an auth error
    if (
      error.code === 16 ||
      error.message?.includes('UNAUTHENTICATED') ||
      error.message?.includes('ACCESS_TOKEN_EXPIRED')
    ) {
      console.error('🔐 Authentication error detected. This usually means:');
      console.error('   1. Access token expired (SDK should auto-refresh)');
      console.error('   2. Service account key is invalid or revoked');
      console.error('   3. Service account lacks necessary permissions');
      console.error('   4. System clock is incorrect');

      // Attempt to get fresh credentials
      try {
        const credential = app.options.credential as admin.credential.Credential;
        if (credential && 'getAccessToken' in credential) {
          console.log('🔄 Attempting to refresh access token...');
          await (credential as any).getAccessToken();
          console.log('✅ Access token refreshed successfully');
          return true;
        }
      } catch (refreshError) {
        console.error('❌ Failed to refresh access token:', refreshError);
      }
    }

    return false;
  }
}

/**
 * Wrapper for Firestore operations with automatic retry on auth failures
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Firestore operation',
  maxRetries: number = 2
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if it's an auth error
      const isAuthError =
        error.code === 16 ||
        error.message?.includes('UNAUTHENTICATED') ||
        error.message?.includes('ACCESS_TOKEN_EXPIRED');

      if (isAuthError && attempt <= maxRetries) {
        console.warn(`⚠️ ${operationName} failed with auth error (Attempt ${attempt}/${maxRetries + 1}). Retrying...`);

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));

        // Try to verify connection before retry
        await verifyFirebaseConnection();

        continue;
      }

      // If not an auth error or out of retries, throw
      throw error;
    }
  }

  throw lastError;
}

// Set up periodic health checks (every 30 minutes)
setInterval(async () => {
  console.log('🔍 Running periodic Firebase health check...');
  await verifyFirebaseConnection();
}, 30 * 60 * 1000);

// Initial health check
setTimeout(async () => {
  console.log('🔍 Running initial Firebase health check...');
  await verifyFirebaseConnection();
}, 5000);

console.log('✅ Database connected successfully.');

// Export admin for other uses (auth, etc.)
export { admin };
export default db;
