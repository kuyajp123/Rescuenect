// Deno type declaration for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import _ from 'lodash';
import type { EarthquakeNotificationData, NotificationType, WeatherNotificationData } from './notification-schema.ts';
import { EarthquakeData } from './types';

// barangayMap['barangay name']
export const barangayMap: Record<string, string> = {
  labac: 'coastal_west',
  mabolo: 'coastal_west',
  bancaan: 'coastal_west',
  balsahan: 'coastal_west',
  'bagong karsada': 'coastal_west',
  sapa: 'coastal_west',
  'bucana sasahan': 'coastal_west',
  'capt c. nazareno': 'coastal_west',
  'gomez-zamora': 'coastal_west',
  kanluran: 'coastal_west',
  humbac: 'coastal_west',
  'bucana malaki': 'coastal_east',
  'ibayo estacion': 'coastal_east',
  'ibayo silangan': 'coastal_east',
  latoria: 'coastal_east',
  'munting mapino': 'coastal_east',
  'timalan balsahan': 'coastal_east',
  'timalan concepcion': 'coastal_east',
  muzon: 'central_naic',
  'malainem bago': 'central_naic',
  santulan: 'central_naic',
  calubcob: 'central_naic',
  makina: 'central_naic',
  'san roque': 'central_naic',
  sabang: 'sabang',
  molino: 'farm_area',
  halang: 'farm_area',
  'palangue 1': 'farm_area',
  'malainem luma': 'naic_boundary',
  'palangue 2 & 3': 'naic_boundary',
};

// Singleton pattern for Firebase initialization
let firestoreInstance: Firestore | null = null;

export const initializeFirebase = () => {
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
export async function getWeatherData(
  location: string,
  type: 'realtime' | 'hourly' | 'daily'
): Promise<Record<string, unknown> | null> {
  const db = initializeFirebase();

  try {
    if (type === 'realtime') {
      // Get realtime data
      const doc = await db.collection('weather').doc(location).collection('realtime').doc('data').get();

      return doc.exists ? doc.data() || null : null;
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
 * Get multiple weather documents for forecast processing
 * Returns an array of weather documents for hourly/daily data
 */
export async function getWeatherForecastData(
  location: string,
  type: 'hourly' | 'daily',
  limit: number = 50
): Promise<Array<Record<string, unknown>> | null> {
  const db = initializeFirebase();

  try {
    // First, try to get documents without ordering to see if they exist
    let snapshot = await db.collection('weather').doc(location).collection(type).limit(limit).get();

    if (snapshot.empty) {
      return null;
    }

    // Optional: Try to order by document ID to get them in sequence
    try {
      const orderedSnapshot = await db
        .collection('weather')
        .doc(location)
        .collection(type)
        .orderBy('__name__')
        .limit(limit)
        .get();

      if (orderedSnapshot.docs.length > 0) {
        console.log(`✅ Successfully ordered by document ID, got ${orderedSnapshot.docs.length} documents`);
        snapshot = orderedSnapshot;
      }
    } catch (orderError) {
      console.log(`⚠️ Could not order by document ID, using default order:`, orderError);
    }

    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return documents;
  } catch (error) {
    console.error(`❌ Error fetching ${type} forecast data for ${location}:`, error);
    return null;
  }
}

/**
 * Get user FCM tokens and barangays based on audience and weather zone
 */
export async function getUserTokens(
  audience: 'admin' | 'users' | 'both',
  weatherZone?: string
): Promise<{ tokens: string[]; barangays: string[] }> {
  const db = initializeFirebase();
  const tokens: string[] = [];
  const barangays: string[] = [];

  try {
    const collections = [];

    // Determine which collections to query
    if (audience === 'admin' || audience === 'both') {
      collections.push('admin');
    }
    if (audience === 'users' || audience === 'both') {
      collections.push('users');
    }

    // Query each collection
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();

      snapshot.forEach(doc => {
        const userData = doc.data();

        // Check if user wants notifications
        // if (userData.notificationsEnabled === false) return; // we send notifications to all users regardless of this setting

        // Check barangay preferences if weather zone is specified
        if (weatherZone && userData.barangay) {
          // Ensure barangay is an array
          const userBarangays = Array.isArray(userData.barangay) ? userData.barangay : [userData.barangay];

          if (userBarangays.length > 0) {
            // Get user's barangays that match the weather zone
            const matchingBarangays = userBarangays.filter((userBarangay: string) => {
              const userBarangayZone = barangayMap[userBarangay.toLowerCase()];
              return userBarangayZone === weatherZone;
            });

            if (matchingBarangays.length === 0) {
              // User has no barangays in affected weather zone - skip this user
              return;
            }

            // Add matching barangays to our collection
            barangays.push(...matchingBarangays);
          }
        }

        // Add FCM token if valid
        if (userData.fcmToken && isValidToken(userData.fcmToken)) {
          tokens.push(userData.fcmToken);
        }
      });
    }

    const uniqueTokens = [...new Set(tokens)];
    const uniqueBarangays = [...new Set(barangays)];

    return {
      tokens: uniqueTokens,
      barangays: uniqueBarangays,
    };
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return { tokens: [], barangays: [] };
  }
}

/**
 * Save notification history for tracking - supports all notification types
 * UPDATED: Uses new unified notification schema
 */
export async function saveNotificationHistory(
  notification: {
    title: string;
    body: string;
    type: 'weather' | 'earthquake' | 'general' | 'emergency' | 'system';
    level?: 'info' | 'warning' | 'critical' | 'emergency';
    category?: string;
    data?: Record<string, unknown>;
  },
  metadata: {
    location?: string;
    audience?: 'admin' | 'users' | 'both';
    weatherZone?: string;
    magnitude?: number;
    depth?: number;
    coordinates?: { lat: number; lng: number };
    source?: string;
    [key: string]: unknown;
  },
  sentTo: number,
  errors: string[] = []
): Promise<void> {
  const db = initializeFirebase();

  try {
    // Import notification service types
    const { NotificationService } = await import('./notification-service');
    const notificationService = new NotificationService(db);

    // Prepare location
    const location = metadata.weatherZone || metadata.location || 'central_naic';
    const audience = metadata.audience || 'both';

    // Prepare delivery status
    const deliveryStatus = {
      success: sentTo,
      failure: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    // Create notification based on type
    if (notification.type === 'weather') {
      // Extract weather-specific data
      const weatherData = {
        weatherType:
          (notification.data?.condition_type as 'current' | 'forecast_3h' | 'forecast_tomorrow') || 'current',
        severity: (notification.level?.toUpperCase() as 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO') || 'INFO',
        category: (notification.category as unknown) || 'Clear',
        priority:
          notification.level === 'critical'
            ? 1
            : notification.level === 'warning'
            ? 2
            : notification.level === 'emergency'
            ? 1
            : 3,
        source: (metadata.source as 'weather_api' | 'manual') || 'weather_api',
        ...(notification.data || {}),
      };

      await notificationService.createWeatherNotification({
        title: notification.title,
        message: notification.body,
        location,
        audience,
        sentTo,
        weatherData: weatherData as WeatherNotificationData,
        deliveryStatus,
      });
    } else if (notification.type === 'earthquake') {
      // Extract earthquake-specific data
      const earthquakeData = {
        earthquakeId: (notification.data?.earthquake_id as string) || `eq_${Date.now()}`,
        magnitude: metadata.magnitude || 0,
        place: (notification.data?.location as string) || 'Unknown',
        coordinates: {
          latitude: metadata.coordinates?.lat || 0,
          longitude: metadata.coordinates?.lng || 0,
          depth: metadata.depth || 0,
        },
        severity: (notification.data?.severity as unknown) || 'minor',
        tsunamiWarning: (notification.data?.tsunami_warning as boolean) || false,
        priority: (notification.data?.priority as unknown) || 'medium',
        source: (metadata.source as 'usgs' | 'phivolcs' | 'manual') || 'usgs',
        usgsUrl: notification.data?.usgs_url as string,
      };

      await notificationService.createEarthquakeNotification({
        title: notification.title,
        message: notification.body,
        location,
        audience,
        sentTo,
        earthquakeData: earthquakeData as EarthquakeNotificationData,
        deliveryStatus,
      });
    } else {
      // Generic notification
      await notificationService.createNotification({
        type: notification.type as NotificationType,
        title: notification.title,
        message: notification.body,
        location,
        audience,
        sentTo,
        data: notification.data,
        deliveryStatus,
      });
    }

    console.log(`✅ Notification saved using new schema: ${notification.type} - ${location}`);
  } catch (error) {
    console.error('Error saving notification history:', error);
    throw error;
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

// ========================
// EARTHQUAKE FUNCTIONS
// ========================

/**
 * Get existing earthquakes from Firestore to prevent duplicates
 */
export async function getExistingEarthquakes(): Promise<EarthquakeData[]> {
  try {
    const db = initializeFirebase();
    const earthquakesRef = db.collection('earthquakes');
    const snapshot = await earthquakesRef.get(); // Get ALL documents

    return snapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        } as EarthquakeData)
    );
  } catch (error) {
    console.error('❌ Error getting existing earthquakes:', error);
    throw error;
  }
}

/**
 * Save multiple earthquakes to Firestore efficiently
 */
export async function saveEarthquakesToFirestore(
  earthquakes: Array<{ id: string; [key: string]: unknown }>
): Promise<void> {
  const db = initializeFirebase();
  const batch = db.batch();

  try {
    for (const earthquake of earthquakes) {
      const docRef = db.collection('earthquakes').doc(earthquake.id);

      // Get the document first
      const docSnap = await docRef.get();

      const createdAt = docSnap.exists ? docSnap.data()?.created_at : Date.now();

      batch.set(docRef, {
        ...earthquake,
        created_at: createdAt,
        updated_at: Date.now(),
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error saving earthquakes batch:', error);
    throw error;
  }
}

/**
 * Replace all earthquakes in Firestore with current USGS data
 * This clears old data and saves only the current earthquake data
 */
export async function replaceEarthquakesInFirestore(
  earthquakes: Array<{ id: string; [key: string]: unknown }>,
  existingEarthquakes: EarthquakeData[]
): Promise<void> {
  const db = initializeFirebase();

  try {
    // Normalize existing earthquakes by removing Firestore metadata for comparison
    const normalizedExisting = existingEarthquakes.map(eq => {
      const {
        created_at: _created_at,
        updated_at: _updated_at,
        ...normalized
      } = eq as EarthquakeData & { created_at?: number; updated_at?: number };
      return normalized;
    });

    if (_.isEqual(earthquakes, normalizedExisting)) {
      console.log(`ℹ️ No changes detected in earthquake data - skipping replacement`);
      return;
    }

    console.log(`🔄 Starting earthquake database replacement...`);

    // Step 2: Delete all existing earthquakes in batches
    const deletePromises = [];
    for (let i = 0; i < existingEarthquakes.length; i += 500) {
      const batch = db.batch();
      const batchDocs = existingEarthquakes.slice(i, i + 500);

      batchDocs.forEach(doc => {
        batch.delete(db.collection('earthquakes').doc(doc.id));
      });

      deletePromises.push(batch.commit());
    }

    await Promise.all(deletePromises);
    console.log(`✅ Deleted all existing earthquakes`);

    // Step 3: Add new earthquakes if any
    if (earthquakes.length > 0) {
      console.log(`💾 Adding ${earthquakes.length} new earthquakes from USGS...`);

      const addPromises = [];
      for (let i = 0; i < earthquakes.length; i += 500) {
        const batch = db.batch();
        const batchEarthquakes = earthquakes.slice(i, i + 500);

        batchEarthquakes.forEach(earthquake => {
          const docRef = db.collection('earthquakes').doc(earthquake.id);
          batch.set(docRef, {
            ...earthquake,
            created_at: Date.now(),
            updated_at: Date.now(),
          });
        });

        addPromises.push(batch.commit());
      }

      await Promise.all(addPromises);
      console.log(`✅ Successfully added ${earthquakes.length} new earthquakes`);
    } else {
      console.log(`ℹ️ No earthquakes to add (USGS returned empty results)`);
    }

    console.log(`✅ Earthquake database replacement completed successfully`);
  } catch (error) {
    console.error('❌ Error replacing earthquakes in Firestore:', error);
    throw error;
  }
}

/**
 * Get earthquake statistics for monitoring
 */
export async function getEarthquakeStats(timeframe: 'today' | 'week' | 'month'): Promise<{
  total: number;
  byMagnitude: Record<string, number>;
  bySeverity: Record<string, number>;
  withTsunami: number;
}> {
  const db = initializeFirebase();

  // Calculate date range
  const now = new Date();
  const startTime = new Date();

  switch (timeframe) {
    case 'today':
      startTime.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startTime.setDate(now.getDate() - 7);
      break;
    case 'month':
      startTime.setMonth(now.getMonth() - 1);
      break;
  }

  try {
    const snapshot = await db.collection('earthquakes').where('time', '>=', startTime.getTime()).get();

    const stats = {
      total: 0,
      byMagnitude: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      withTsunami: 0,
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      stats.total++;

      // Count by magnitude range
      const magRange = Math.floor(data.magnitude);
      stats.byMagnitude[`${magRange}-${magRange + 1}`] = (stats.byMagnitude[`${magRange}-${magRange + 1}`] || 0) + 1;

      // Count by severity
      stats.bySeverity[data.severity] = (stats.bySeverity[data.severity] || 0) + 1;

      // Count tsunami warnings
      if (data.tsunami_warning) {
        stats.withTsunami++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching earthquake stats:', error);
    return { total: 0, byMagnitude: {}, bySeverity: {}, withTsunami: 0 };
  }
}
