import { messaging } from '@/lib/firebaseConfig';
import { deleteToken, getToken } from 'firebase/messaging';

// request permission + get token
// This should be called from a user interaction (button click) to ensure the prompt appears
export async function askForPermissionAndGetToken(vapidKey: string): Promise<string | null> {
  try {
    // If already granted → get token immediately
    const token = await permissionAllowed(vapidKey);
    if (token) return token;

    // If not granted → ask permission
    const permissionGranted = await askPermission();
    if (!permissionGranted) return null;

    // After user grants permission → get token
    return await getFCMtoken(vapidKey);
  } catch (error) {
    console.error('Error while getting notification permission or token:', error);
    return null;
  }
}

export const permissionAllowed = async (vapidKey: string) => {
  if (Notification.permission === 'granted') {
    return await getFCMtoken(vapidKey);
  }

  return null;
};

const getFCMtoken = async (vapidKey: string) => {
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    console.log('🛡️ FCM Token obtained:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Returns true if granted, false if denied/default
const askPermission = async (): Promise<boolean> => {
  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);

    return permission === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

// to remove token on logout
export async function revokeToken() {
  try {
    await deleteToken(messaging);
  } catch (e) {
    console.error('deleteToken error', e);
  }
}
