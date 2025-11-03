import * as admin from 'firebase-admin';

const rawCreds = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS as string);
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