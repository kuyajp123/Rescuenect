import admin from 'firebase-admin';
import * as serviceAccount from '../../rescuenect-adminsdk.json';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: 'rescuenect'
    });
}

// Get Firestore instance
export const db = admin.firestore();

// Export admin for other uses (auth, etc.)
export { admin };

export default db;