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

  } catch (error) {
    console.error('Firestore insert error:', error);
    throw error;
  }
};


/**
 * Get weather data for a specific location and type
 */
export async function getWeatherData(location: string, type: 'realtime' | 'hourly' | 'daily'): Promise<any> {
  const db = initializeFirebase();

  try {
    if (type === 'realtime') {
      // Get realtime data
      const doc = await db.collection('weather').doc(location).collection('realtime').doc('data').get();

      return doc.exists ? doc.data() : null;
    } else {
      // Get latest hourly or daily data
      const snapshot = await db
        .collection('weather')
        .doc(location)
        .collection(type)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      return snapshot.docs[0].data();
    }
  } catch (error) {
    console.error(`Error fetching ${type} data for ${location}:`, error);
    return null;
  }
}

/**
 * Get user FCM tokens based on audience and location preferences
 */
export async function getUserTokens(audience: 'admin' | 'public' | 'both', location?: string): Promise<string[]> {
  const db = initializeFirebase();
  const tokens: string[] = [];

  try {
    let query: any = db.collection('users');

    // Filter by user type if not 'both'
    if (audience !== 'both') {
      query = query.where('userType', '==', audience);
    }

    const snapshot = await query.get();

    snapshot.forEach((doc: any) => {
      const userData = doc.data();

      // Check if user wants notifications
      if (userData.notificationsEnabled === false) return;

      // Check location preferences if specified
      if (location && userData.locationPreferences) {
        if (!userData.locationPreferences.includes(location)) return;
      }

      // Add FCM token if valid
      if (userData.fcmToken && isValidToken(userData.fcmToken)) {
        tokens.push(userData.fcmToken);
      }
    });

    return tokens;
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return [];
  }
}

/**
 * Save notification history for tracking
 */
export async function saveNotificationHistory(
  notification: any,
  location: string,
  sentTo: number,
  errors: string[]
): Promise<void> {
  const db = initializeFirebase();

  try {
    await db.collection('notification_history').add({
      title: notification.title,
      body: notification.body,
      level: notification.level,
      category: notification.category,
      location: location,
      sentTo: sentTo,
      errors: errors,
      timestamp: new Date(),
      data: notification.data || {},
    });
  } catch (error) {
    console.error('Error saving notification history:', error);
  }
}

/**
 * Validate FCM token format
 */
function isValidToken(token: string): boolean {
  return !!(token && token.length > 100 && token.includes(':'));
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(timeframe: 'today' | 'week' | 'month'): Promise<{
  total: number;
  byLevel: Record<string, number>;
  byLocation: Record<string, number>;
}> {
  const db = initializeFirebase();

  // Calculate date range
  const now = new Date();
  const startDate = new Date();

  switch (timeframe) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
  }

  try {
    const snapshot = await db.collection('notification_history').where('timestamp', '>=', startDate).get();

    const stats = {
      total: 0,
      byLevel: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      stats.total++;

      // Count by level
      stats.byLevel[data.level] = (stats.byLevel[data.level] || 0) + 1;

      // Count by location
      stats.byLocation[data.location] = (stats.byLocation[data.location] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return { total: 0, byLevel: {}, byLocation: {} };
  }
}
