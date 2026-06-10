import { messaging } from '@/lib/firebaseConfig';
import { deleteToken, getToken } from 'firebase/messaging';

export const DESKTOP_NOTIFICATION_SETTING_KEY = 'rescuenect_desktop_notifications_enabled';

export const getDesktopNotificationPreference = (fallback = false): boolean => {
  if (typeof localStorage === 'undefined') return fallback;

  const savedPreference = localStorage.getItem(DESKTOP_NOTIFICATION_SETTING_KEY);
  if (savedPreference === 'true') return true;
  if (savedPreference === 'false') return false;

  return fallback;
};

export const setDesktopNotificationPreference = (enabled: boolean) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(DESKTOP_NOTIFICATION_SETTING_KEY, String(enabled));
};

export async function askForPermissionAndGetToken(vapidKey: string): Promise<string | null> {
  try {
    if (typeof Notification === 'undefined' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    const token = await permissionAllowed(vapidKey);
    if (token) return token;

    const permissionGranted = await askPermission();
    if (!permissionGranted) return null;

    return await getFCMtoken(vapidKey);
  } catch (error) {
    console.error('Error while getting notification permission or token:', error);
    return null;
  }
}

export const permissionAllowed = async (vapidKey: string) => {
  if (typeof Notification === 'undefined' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

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

    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

const askPermission = async (): Promise<boolean> => {
  try {
    const permission = await Notification.requestPermission();

    return permission === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

export async function revokeToken() {
  try {
    await deleteToken(messaging);
  } catch (e) {
    console.error('deleteToken error', e);
  }
}
