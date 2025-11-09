import { messaging } from '@/lib/firebaseConfig';
import { deleteToken, getToken } from 'firebase/messaging';

// request permission + get token
// This should be called from a user interaction (button click) to ensure the prompt appears
export async function askForPermissionAndGetToken(vapidKey: string): Promise<string | null> {
  console.log('🔑 Requesting notification permission...');

  try {
    // Request permission - this will show the browser popup
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);

    if (permission !== 'granted') {
      console.warn('Notifications permission not granted. Status:', permission);
      return null;
    }
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return null;
  }

  try {
    // Register service worker (if not already)
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    // Wait for the service worker to be active/ready
    await navigator.serviceWorker.ready;

    // Get the FCM token
    const currentToken = await getToken(messaging, {
      vapidKey, // Your VAPID key from Firebase console
      serviceWorkerRegistration: registration,
    });

    console.log('🛡️ FCM Token obtained:', currentToken);
    return currentToken; // Save this token to your DB for sending messages
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// to remove token on logout
export async function revokeToken() {
  try {
    await deleteToken(messaging);
  } catch (e) {
    console.error('deleteToken error', e);
  }
}
