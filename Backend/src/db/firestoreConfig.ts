import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS as string)),
        projectId: 'rescuenect'
    });
}

// Get Firestore instance
export const db = admin.firestore();

// Export admin for other uses (auth, etc.)
export { admin };

export default db;