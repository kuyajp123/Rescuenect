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
