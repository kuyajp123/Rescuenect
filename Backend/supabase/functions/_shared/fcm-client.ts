import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, MulticastMessage, type Messaging, type SendResponse } from 'firebase-admin/messaging';

let messagingInstance: Messaging | null = null;

/**
 * Initialize Firebase Admin SDK for messaging
 */
const initializeFirebaseMessaging = () => {
  if (messagingInstance) return messagingInstance;

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      messagingInstance = getMessaging(existingApps[0]);
      return messagingInstance;
    }

    const serviceAccountKeyString = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON'); // this is what i set in my supabase env vars

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
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error('Failed to initialize Firebase Messaging:', error);
    throw error;
  }
};

/**
 * Send notification to multiple devices
 */
export async function sendFCMNotification(
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  },
  tokens: string[]
): Promise<{ success: number; failure: number; errors: string[] }> {
  const messaging = initializeFirebaseMessaging();
  const results = { success: 0, failure: 0, errors: [] as string[] };

  if (tokens.length === 0) {
    return results;
  }

  try {
    // Prepare multicast message
    const message: MulticastMessage = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: tokens,
      android: {
        priority: 'high',
        notification: {
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body,
            },
            badge: 1,
            sound: 'default',
          },
        },
      },
      webpush: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
      },
    };

    // Send multicast message
    const response = await messaging.sendEachForMulticast(message);

    results.success = response.successCount;
    results.failure = response.failureCount;

    // Collect error details
    if (response.failureCount > 0) {
      response.responses.forEach((resp: SendResponse, idx: number) => {
        if (!resp.success) {
          results.errors.push(`Token ${idx}: ${resp.error?.message || 'Unknown error'}`);
        }
      });
    }

    console.log(`FCM Results: ${results.success} successful, ${results.failure} failed`);
    return results;
  } catch (error) {
    console.error('FCM send error:', error);
    results.failure = tokens.length;
    results.errors.push(error instanceof Error ? error.message : 'An unknown error occurred');
    return results;
  }
}

/**
 * Send notification to a single device - NOT USED
 */
export async function sendFCMNotificationSingle(
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  },
  token: string
): Promise<boolean> {
  const result = await sendFCMNotification(notification, [token]);
  return result.success > 0;
}

/**
 * Validate FCM token format
 */
export function isValidFCMToken(token: string): boolean {
  // FCM tokens are typically 163 characters long and contain specific patterns
  // const tokenPattern = /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/;
  return !!(token && token.length > 100 && token.includes(':'));
}

/**
 * Clean invalid tokens from a list - NOT USED
 */
export function cleanTokenList(tokens: string[]): string[] {
  return tokens.filter(token => isValidFCMToken(token));
}

export async function sendEarthquakeNotification(
  earthquake: {
    id: string;
    magnitude: number;
    place: string;
    time: number;
    severity: string;
    priority: string;
    tsunami_warning: boolean;
    usgs_url: string;
    coordinates: {
      longitude: number;
      latitude: number;
      depth: number;
    };
  },
  tokens: string[]
): Promise<{ success: number; failure: number; errors: string[] }> {
  // Skip notifications for micro earthquakes (below 2.0)
  if (earthquake.magnitude < 2.0) {
    return { success: 0, failure: 0, errors: ['Below notification threshold'] };
  }

  // Determine notification style based on magnitude and tsunami warning
  let title = '';
  let _emoji = '';
  let _priority: 'normal' | 'high' = 'normal';

  if (earthquake.tsunami_warning) {
    title = `🌊 TSUNAMI WARNING - Magnitude ${earthquake.magnitude} Earthquake`;
    _emoji = '🌊';
    _priority = 'high';
  } else if (earthquake.magnitude >= 6.0) {
    title = `🚨 CRITICAL EARTHQUAKE - Magnitude ${earthquake.magnitude}`;
    _emoji = '🚨';
    _priority = 'high';
  } else if (earthquake.magnitude >= 5.0) {
    title = `🔴 Strong Earthquake - Magnitude ${earthquake.magnitude}`;
    _emoji = '🔴';
    _priority = 'high';
  } else if (earthquake.magnitude >= 4.0) {
    title = `🟠 Earthquake Alert - Magnitude ${earthquake.magnitude}`;
    _emoji = '🟠';
  } else {
    title = `🟡 Minor Earthquake - Magnitude ${earthquake.magnitude}`;
    _emoji = '🟡';
  }

  // Create enhanced body message
  let body = '';
  const timeString = new Date(earthquake.time).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (earthquake.tsunami_warning) {
    body = `🌊 TSUNAMI THREAT: Magnitude ${earthquake.magnitude} earthquake ${earthquake.place} at ${timeString}. MOVE TO HIGHER GROUND IMMEDIATELY!`;
  } else if (earthquake.magnitude >= 6.0) {
    body = `🆘 CRITICAL: Magnitude ${earthquake.magnitude} earthquake ${earthquake.place} at ${timeString}. TAKE IMMEDIATE SHELTER!`;
  } else if (earthquake.magnitude >= 5.0) {
    body = `⚠️ Strong earthquake detected: Magnitude ${earthquake.magnitude} ${earthquake.place} at ${timeString}. Take safety precautions!`;
  } else if (earthquake.magnitude >= 4.0) {
    body = `Magnitude ${earthquake.magnitude} earthquake occurred ${earthquake.place} at ${timeString}. Stay alert and follow safety protocols.`;
  } else {
    body = `Minor earthquake detected: Magnitude ${earthquake.magnitude} ${earthquake.place} at ${timeString}.`;
  }

  const notification = {
    title,
    body,
    data: {
      type: 'earthquake_alert',
      earthquake_id: earthquake.id,
      magnitude: earthquake.magnitude.toString(),
      location: earthquake.place,
      time: earthquake.time.toString(),
      severity: earthquake.severity,
      priority: earthquake.priority,
      tsunami_warning: earthquake.tsunami_warning.toString(),
      usgs_url: earthquake.usgs_url,
      coordinates: JSON.stringify(earthquake.coordinates),
      depth: earthquake.coordinates.depth.toString(),
    },
  };

  // Use your existing sendFCMNotification function!
  return await sendFCMNotification(notification, tokens);
}