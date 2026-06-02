// Deno type declaration for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import {
  NAIC_CLIENT_ID,
  canonicalizeClientId,
  getBarangaysForWeatherLocationKey,
  NAIC_WEATHER_LOCATION_KEY,
  normalizeBarangayValue,
} from './location-config.ts';
import type { EarthquakeNotificationData, NotificationType, WeatherNotificationData } from './notification-schema.ts';
import type { EarthquakeClientScope, EarthquakeData } from './types.ts';

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

    // Prefer Supabase Edge Functions env var name, but allow local backend env name as fallback.
    const serviceAccountKeyString =
      Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON') ?? Deno.env.get('FIREBASE_ADMIN_CREDENTIALS');

    if (!serviceAccountKeyString) {
      throw new Error(
        'Firebase service account JSON not found. Set FIREBASE_SERVICE_ACCOUNT_JSON (preferred) or FIREBASE_ADMIN_CREDENTIALS.'
      );
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
 * Get user FCM tokens and barangays based on audience and weather location key
 */
type ClientCoverage = {
  clientId: string;
  clientName: string;
  weatherLocationKey: string;
  barangays: string[];
};

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const isNaicClientRecord = (clientId: string, municipalityCode: unknown): boolean =>
  canonicalizeClientId(clientId, municipalityCode) === NAIC_CLIENT_ID;

const getCanonicalClientId = (clientId: string, data: Record<string, unknown> | undefined | null): string =>
  canonicalizeClientId(clientId, data?.municipalityCode) ?? clientId;

const getCanonicalWeatherLocationKey = (
  clientId: string,
  data: Record<string, unknown> | undefined | null
): string =>
  isNaicClientRecord(clientId, data?.municipalityCode)
    ? NAIC_WEATHER_LOCATION_KEY
    : typeof data?.weatherLocationKey === 'string' && data.weatherLocationKey.trim()
    ? data.weatherLocationKey.trim()
    : clientId;

function getTokensFromData(userData: Record<string, unknown>): string[] {
  const tokens: string[] = [];

  if (Array.isArray(userData.fcmTokens)) {
    userData.fcmTokens.forEach(token => {
      if (typeof token === 'string' && isValidToken(token)) tokens.push(token);
    });
  }

  if (typeof userData.fcmToken === 'string' && isValidToken(userData.fcmToken)) {
    tokens.push(userData.fcmToken);
  }

  return tokens;
}

function getActiveBarangaysFromClientData(data: Record<string, unknown> | undefined | null): string[] {
  const barangays = Array.isArray(data?.barangays) ? data.barangays : [];
  return barangays
    .filter((barangay: Record<string, unknown>) => barangay.isActive !== false)
    .map((barangay: Record<string, unknown>) => barangay.value || barangay.barangayLabel || barangay.name)
    .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
    .map(normalizeBarangayValue);
}

async function getClientCoverageByWeatherLocationKey(
  db: Firestore,
  weatherLocationKey: string
): Promise<ClientCoverage | null> {
  const canonicalWeatherLocationKey = canonicalizeClientId(weatherLocationKey) ?? weatherLocationKey;
  const staticBarangays = getBarangaysForWeatherLocationKey(canonicalWeatherLocationKey);

  const snapshot = await db
    .collection('clients')
    .where('status', '==', 'active')
    .where('weatherLocationKey', '==', canonicalWeatherLocationKey)
    .limit(1)
    .get();

  const clientDoc = snapshot.empty
    ? await db.collection('clients').doc(canonicalWeatherLocationKey).get()
    : snapshot.docs[0];
  const clientData = clientDoc.exists ? clientDoc.data() : null;

  if (!clientDoc.exists && staticBarangays.length === 0) return null;

  const clientId = clientDoc.exists ? getCanonicalClientId(clientDoc.id, clientData) : canonicalWeatherLocationKey;
  const resolvedWeatherLocationKey = clientDoc.exists
    ? getCanonicalWeatherLocationKey(clientDoc.id, clientData)
    : canonicalWeatherLocationKey;
  const resolvedStaticBarangays = getBarangaysForWeatherLocationKey(resolvedWeatherLocationKey);

  return {
    clientId,
    clientName:
      clientId === NAIC_CLIENT_ID
        ? 'Naic'
        : typeof clientData?.name === 'string' && clientData.name.trim()
        ? clientData.name.trim()
        : canonicalWeatherLocationKey,
    weatherLocationKey: resolvedWeatherLocationKey,
    barangays: getActiveBarangaysFromClientData(clientData).length
      ? getActiveBarangaysFromClientData(clientData)
      : resolvedStaticBarangays,
  };
}

async function getClientCoverageById(db: Firestore, clientId: string): Promise<ClientCoverage | null> {
  const canonicalClientId = canonicalizeClientId(clientId) ?? clientId;
  const doc = await db.collection('clients').doc(canonicalClientId).get();
  const data = doc.exists ? doc.data() : null;

  if (!doc.exists && canonicalClientId !== NAIC_CLIENT_ID) return null;

  const resolvedClientId = getCanonicalClientId(canonicalClientId, data);
  const weatherLocationKey = doc.exists
    ? getCanonicalWeatherLocationKey(canonicalClientId, data)
    : resolvedClientId;

  const staticBarangays = getBarangaysForWeatherLocationKey(weatherLocationKey);

  return {
    clientId: resolvedClientId,
    clientName:
      resolvedClientId === NAIC_CLIENT_ID
        ? 'Naic'
        : typeof data?.name === 'string' && data.name.trim()
        ? data.name.trim()
        : resolvedClientId,
    weatherLocationKey,
    barangays: getActiveBarangaysFromClientData(data).length
      ? getActiveBarangaysFromClientData(data)
      : staticBarangays,
  };
}

export async function getUserTokens(
  audience: 'admin' | 'users' | 'both',
  weatherLocationKey?: string
): Promise<{ tokens: string[]; barangays: string[] }> {
  const db = initializeFirebase();
  const tokens: string[] = [];
  const matchedBarangays: string[] = [];
  const targetClient = weatherLocationKey
    ? await getClientCoverageByWeatherLocationKey(db, weatherLocationKey)
    : null;
  const weatherLocationBarangays = targetClient?.barangays ?? [];
  const coveredBarangays = weatherLocationKey ? new Set(weatherLocationBarangays) : null;

  try {
    if (weatherLocationKey && weatherLocationBarangays.length === 0) {
      console.warn(`No covered barangays configured for weather location key: ${weatherLocationKey}`);
      return { tokens: [], barangays: [] };
    }

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

        if (collectionName === 'admin') {
          const userClientId =
            typeof userData.clientId === 'string' ? getCanonicalClientId(userData.clientId, userData) : null;
          if (userData.role === 'super_admin') return;
          if (userData.status === 'inactive') return;
          if (targetClient && userClientId !== targetClient.clientId) return;

          tokens.push(...getTokensFromData(userData));
          return;
        }

        if (coveredBarangays) {
          const userBarangays = Array.isArray(userData.barangay) ? userData.barangay : [userData.barangay];
          const matchingBarangays = userBarangays
            .filter((userBarangay: unknown): userBarangay is string => typeof userBarangay === 'string')
            .map(normalizeBarangayValue)
            .filter((userBarangay: string) => coveredBarangays.has(userBarangay));

          if (matchingBarangays.length === 0) {
            return;
          }

          matchedBarangays.push(...matchingBarangays);
        }

        tokens.push(...getTokensFromData(userData));
      });
    }

    const uniqueTokens = [...new Set(tokens)];
    const uniqueBarangays = weatherLocationKey ? weatherLocationBarangays : [...new Set(matchedBarangays)];

    return {
      tokens: uniqueTokens,
      barangays: uniqueBarangays,
    };
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return { tokens: [], barangays: [] };
  }
}

export async function getUserTokensByClientId(
  audience: 'admin' | 'users' | 'both',
  clientId: string
): Promise<{ tokens: string[]; barangays: string[]; clientName: string; weatherLocationKey: string }> {
  const db = initializeFirebase();
  const client = await getClientCoverageById(db, clientId);
  if (!client) return { tokens: [], barangays: [], clientName: clientId, weatherLocationKey: clientId };

  const tokens: string[] = [];
  const matchedBarangays: string[] = [];
  const coveredBarangays = new Set(client.barangays);
  const collections = [];

  if (audience === 'admin' || audience === 'both') collections.push('admin');
  if (audience === 'users' || audience === 'both') collections.push('users');

  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    snapshot.forEach(doc => {
      const userData = doc.data();

      if (collectionName === 'admin') {
        const userClientId =
          typeof userData.clientId === 'string' ? getCanonicalClientId(userData.clientId, userData) : null;
        if (userData.role === 'super_admin') return;
        if (userData.status === 'inactive') return;
        if (userClientId !== client.clientId) return;
        tokens.push(...getTokensFromData(userData));
        return;
      }

      const userClientId =
        typeof userData.clientId === 'string' ? getCanonicalClientId(userData.clientId, userData) : null;
      const directClientMatch = userClientId === client.clientId;
      const userBarangays = Array.isArray(userData.barangay) ? userData.barangay : [userData.barangay];
      const matchingBarangays = userBarangays
        .filter((userBarangay: unknown): userBarangay is string => typeof userBarangay === 'string')
        .map(normalizeBarangayValue)
        .filter((userBarangay: string) => coveredBarangays.has(userBarangay));

      if (!directClientMatch && matchingBarangays.length === 0) return;

      matchedBarangays.push(...matchingBarangays);
      tokens.push(...getTokensFromData(userData));
    });
  }

  return {
    tokens: [...new Set(tokens)],
    barangays: client.barangays.length ? client.barangays : [...new Set(matchedBarangays)],
    clientName: client.clientName,
    weatherLocationKey: client.weatherLocationKey,
  };
}

export async function getActiveEarthquakeClientScopes(): Promise<EarthquakeClientScope[]> {
  const db = initializeFirebase();
  const scopes: EarthquakeClientScope[] = [];

  const snapshot = await db.collection('clients').where('status', '==', 'active').get();
  const hasCanonicalNaicClient = snapshot.docs.some(doc => doc.id === NAIC_CLIENT_ID);
  const seenClientIds = new Set<string>();

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const clientId = getCanonicalClientId(doc.id, data);
    const weatherLocationKey = getCanonicalWeatherLocationKey(doc.id, data);

    if (clientId === NAIC_CLIENT_ID && doc.id !== NAIC_CLIENT_ID && hasCanonicalNaicClient) {
      console.warn(`Skipping legacy Naic earthquake scope ${doc.id}; using canonical ${NAIC_CLIENT_ID}`);
      return;
    }

    if (seenClientIds.has(clientId)) {
      console.warn(`Skipping duplicate earthquake scope for client ${clientId}`);
      return;
    }

    seenClientIds.add(clientId);

    const mapSettings =
      data.mapSettings && typeof data.mapSettings === 'object'
        ? (data.mapSettings as Record<string, unknown>)
        : {};
    const earthquakeSettings =
      data.earthquakeSettings && typeof data.earthquakeSettings === 'object'
        ? (data.earthquakeSettings as Record<string, unknown>)
        : {};
    const fallbackLatitude = isFiniteNumber(data.weatherLatitude) ? data.weatherLatitude : null;
    const fallbackLongitude = isFiniteNumber(data.weatherLongitude) ? data.weatherLongitude : null;
    const centerLatitude = isFiniteNumber(mapSettings.centerLatitude) ? mapSettings.centerLatitude : fallbackLatitude;
    const centerLongitude = isFiniteNumber(mapSettings.centerLongitude)
      ? mapSettings.centerLongitude
      : fallbackLongitude;

    if (!isFiniteNumber(centerLatitude) || !isFiniteNumber(centerLongitude)) {
      console.warn(`Skipping earthquake scope for client ${doc.id}: missing coordinates`);
      return;
    }

    scopes.push({
      clientId,
      clientName:
        clientId === NAIC_CLIENT_ID
          ? 'Naic'
          : typeof data.name === 'string' && data.name.trim()
          ? data.name.trim()
          : typeof data.municipalityName === 'string' && data.municipalityName.trim()
          ? data.municipalityName.trim()
          : clientId,
      weatherLocationKey,
      centerLatitude,
      centerLongitude,
      radiusKm: clamp(isFiniteNumber(earthquakeSettings.radiusKm) ? earthquakeSettings.radiusKm : 150, 25, 500),
      minMagnitude: clamp(
        isFiniteNumber(earthquakeSettings.minMagnitude) ? earthquakeSettings.minMagnitude : 1.5,
        0,
        9
      ),
    });
  });

  return scopes;
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

    // Prepare location. Weather history now uses the active municipality key.
    const location =
      notification.type === 'weather'
        ? metadata.location || NAIC_WEATHER_LOCATION_KEY
        : metadata.location || metadata.weatherZone || NAIC_WEATHER_LOCATION_KEY;
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

async function getCoveredBarangaysForWeatherLocationKey(
  db: Firestore,
  weatherLocationKey: string
): Promise<string[]> {
  const staticBarangays = getBarangaysForWeatherLocationKey(weatherLocationKey);

  try {
    const snapshot = await db
      .collection('clients')
      .where('status', '==', 'active')
      .where('weatherLocationKey', '==', weatherLocationKey)
      .limit(1)
      .get();

    const clientDoc = snapshot.empty ? await db.collection('clients').doc(weatherLocationKey).get() : snapshot.docs[0];
    const clientData = clientDoc.exists ? clientDoc.data() : null;
    const barangays = Array.isArray(clientData?.barangays) ? clientData.barangays : [];
    const dynamicBarangays = barangays
      .filter((barangay: Record<string, unknown>) => barangay.isActive !== false)
      .map((barangay: Record<string, unknown>) => barangay.value || barangay.barangayLabel || barangay.name)
      .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
      .map(normalizeBarangayValue);

    return dynamicBarangays.length > 0 ? dynamicBarangays : staticBarangays;
  } catch (error) {
    console.warn(`Unable to load dynamic barangay coverage for weather location ${weatherLocationKey}:`, error);
    return staticBarangays;
  }
}

function normalizeForComparison(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForComparison);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, normalizeForComparison(nestedValue)])
    );
  }

  return value;
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(normalizeForComparison(left)) === JSON.stringify(normalizeForComparison(right));
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

const EARTHQUAKE_NOTIFICATION_DEDUP_COLLECTION = 'earthquakeNotificationDedup';
const EARTHQUAKE_NOTIFICATION_RETRY_AFTER_MS = 5 * 60 * 1000;

function safeFirestoreDocSegment(value: string): string {
  return value.replace(/[^\w.-]/g, '_').slice(0, 700);
}

export function buildEarthquakeNotificationId(clientId: string, earthquakeId: string): string {
  return `earthquake_${safeFirestoreDocSegment(clientId)}_${safeFirestoreDocSegment(earthquakeId)}`;
}

function isAlreadyExistsError(error: unknown): boolean {
  const maybeError = error as { code?: unknown; message?: unknown };
  return maybeError.code === 6 || String(maybeError.message || '').toLowerCase().includes('already exists');
}

export async function reserveEarthquakeNotification(params: {
  clientId: string;
  clientName?: string;
  earthquakeId: string;
  eventTime: number;
  magnitude: number;
  place: string;
}): Promise<{ reserved: boolean; notificationId: string }> {
  const db = initializeFirebase();
  const notificationId = buildEarthquakeNotificationId(params.clientId, params.earthquakeId);
  const dedupRef = db.collection(EARTHQUAKE_NOTIFICATION_DEDUP_COLLECTION).doc(notificationId);

  try {
    await dedupRef.create({
      notificationId,
      clientId: params.clientId,
      clientName: params.clientName ?? params.clientId,
      earthquakeId: params.earthquakeId,
      eventTime: params.eventTime,
      eventTimeIso: new Date(params.eventTime).toISOString(),
      magnitude: params.magnitude,
      place: params.place,
      status: 'reserved',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { reserved: true, notificationId };
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      const existing = await dedupRef.get();
      const data = existing.exists ? existing.data() : null;
      const status = typeof data?.status === 'string' ? data.status : null;
      const updatedAt = typeof data?.updatedAt === 'number' ? data.updatedAt : 0;
      const retryCount = typeof data?.retryCount === 'number' ? data.retryCount : 0;
      const canRetry = ['failed', 'reserved'].includes(status || '') && Date.now() - updatedAt >= EARTHQUAKE_NOTIFICATION_RETRY_AFTER_MS;

      if (canRetry) {
        const notificationSnapshot = await db.collection('notifications').doc(notificationId).get();
        if (notificationSnapshot.exists) {
          await dedupRef.set(
            {
              notificationId,
              clientId: params.clientId,
              clientName: params.clientName ?? params.clientId,
              earthquakeId: params.earthquakeId,
              eventTime: params.eventTime,
              eventTimeIso: new Date(params.eventTime).toISOString(),
              magnitude: params.magnitude,
              place: params.place,
              status: 'sent',
              recoveredFromNotificationDoc: true,
              recoveredAt: Date.now(),
              updatedAt: Date.now(),
            },
            { merge: true }
          );

          console.log(`Skipping earthquake push because notification already exists: ${notificationId}`);
          return { reserved: false, notificationId };
        }

        await dedupRef.set(
          {
            notificationId,
            clientId: params.clientId,
            clientName: params.clientName ?? params.clientId,
            earthquakeId: params.earthquakeId,
            eventTime: params.eventTime,
            eventTimeIso: new Date(params.eventTime).toISOString(),
            magnitude: params.magnitude,
            place: params.place,
            status: 'reserved',
            retryCount: retryCount + 1,
            updatedAt: Date.now(),
          },
          { merge: true }
        );

        return { reserved: true, notificationId };
      }

      console.log(`Skipping duplicate earthquake notification: ${notificationId}`);
      return { reserved: false, notificationId };
    }

    throw error;
  }
}

export async function updateEarthquakeNotificationReservation(
  notificationId: string,
  update: Record<string, unknown>
): Promise<void> {
  const db = initializeFirebase();
  await db
    .collection(EARTHQUAKE_NOTIFICATION_DEDUP_COLLECTION)
    .doc(notificationId)
    .set(
      {
        ...update,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
}

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

    if (deepEqual(earthquakes, normalizedExisting)) {
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
