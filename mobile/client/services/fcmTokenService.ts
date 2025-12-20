import { storageHelpers } from '@/helper/storage';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import { getApp } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  hasPermission,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';
import axios from 'axios';

/**
 * FCM Token Management Service
 * Handles token registration, refresh, and removal for push notifications
 * Updated to use React Native Firebase v22 modular API
 */
export class FCMTokenService {
  private static currentToken: string | null = null;

  /**
   * Get the current FCM token from the device
   */
  private static async getDeviceToken(): Promise<string | null> {
    try {
      const messagingInstance = getMessaging(getApp());
      const token = await getToken(messagingInstance);
      return token;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Request notification permissions and get token
   */
  private static async requestPermission(): Promise<boolean> {
    try {
      const messagingInstance = getMessaging(getApp());
      const authStatus = await requestPermission(messagingInstance);
      const enabled = authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        return true;
      } else {
        console.log('⚠️ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Save FCM token to Firestore (adds to array, avoids duplicates)
   * Called when user logs in or token is first obtained
   */
  public static async updateUserFcmToken(authUser: any): Promise<void> {
    try {
      if (!authUser) {
        console.warn('⚠️ No authenticated user, skipping FCM token update');
        return;
      }

      // Request permission first
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('⚠️ No notification permission, skipping token registration');
        return;
      }

      // Get device token
      const fcmToken = await this.getDeviceToken();
      if (!fcmToken) {
        console.warn('⚠️ No FCM token available');
        return;
      }

      // Store token locally
      this.currentToken = fcmToken;
      await storageHelpers.setField(STORAGE_KEYS.USER, 'fcmToken', fcmToken);

      // Send token to backend
      const idToken = await authUser.getIdToken();
      const response = await axios.post(
        API_ROUTES.DATA.UPDATE_FCM_TOKEN,
        {
          uid: authUser.uid,
          fcmToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

    } catch (error) {
      console.error('❌ Error updating FCM token:', error);
      throw error;
    }
  }

  /**
   * Remove FCM token from Firestore
   * Called when user logs out
   */
  public static async removeFcmToken(authUser: any): Promise<void> {
    try {
      if (!authUser) {
        console.warn('⚠️ No authenticated user, skipping FCM token removal');
        return;
      }

      const fcmToken = this.currentToken || (await this.getDeviceToken());
      if (!fcmToken) {
        console.warn('⚠️ No FCM token to remove');
        return;
      }

      // Remove token from backend
      const idToken = await authUser.getIdToken();
      const response = await axios.post(
        API_ROUTES.DATA.REMOVE_FCM_TOKEN,
        {
          uid: authUser.uid,
          fcmToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      // Clear local storage
      this.currentToken = null;
      await storageHelpers.setField(STORAGE_KEYS.USER, 'fcmToken', null);

    } catch (error) {
      console.error('❌ Error removing FCM token:', error);
      throw error;
    }
  }

  /**
   * Setup token refresh listener
   * Should be called once when app starts
   */
  public static setupTokenRefreshListener(authUser: any, onTokenUpdate?: (token: string) => void): () => void {
    const messagingInstance = getMessaging(getApp());
    const unsubscribe = onTokenRefresh(messagingInstance, async (newToken: string) => {
      console.log('🔄 FCM Token refreshed:', newToken);

      if (!authUser) {
        console.warn('⚠️ No authenticated user during token refresh');
        return;
      }

      try {
        // Update current token
        this.currentToken = newToken;

        // Save to local storage
        await storageHelpers.setField(STORAGE_KEYS.USER, 'fcmToken', newToken);

        // Update in backend
        const idToken = await authUser.getIdToken();
        await axios.post(
          API_ROUTES.DATA.UPDATE_FCM_TOKEN,
          {
            uid: authUser.uid,
            fcmToken: newToken,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        // Call optional callback
        if (onTokenUpdate) {
          onTokenUpdate(newToken);
        }
      } catch (error) {
        console.error('❌ Error saving refreshed FCM token:', error);
      }
    });

    return unsubscribe;
  }

  /**
   * Get the current cached token
   */
  public static getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Check if notifications are enabled
   */
  public static async checkNotificationPermission(): Promise<boolean> {
    try {
      const messagingInstance = getMessaging(getApp());
      const authStatus = await hasPermission(messagingInstance);
      return authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('❌ Error checking notification permission:', error);
      return false;
    }
  }
}
