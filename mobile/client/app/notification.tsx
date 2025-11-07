import { getApp } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  isDeviceRegisteredForRemoteMessages,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { Alert } from 'react-native';

export const notification = () => {
  useEffect(() => {
    // Get Firebase app and messaging instances
    const app = getApp();
    const messaging = getMessaging(app);

    const setupFirebaseMessaging = async () => {
      try {
        // Check if device supports FCM
        if (!(await isDeviceRegisteredForRemoteMessages(messaging))) {
          await registerDeviceForRemoteMessages(messaging);
        }

        // Request permission for iOS
        const authStatus = await requestPermission(messaging, {
          alert: true,
          announcement: false,
          badge: true,
          carPlay: true,
          provisional: false,
          sound: true,
        });

        const enabled = authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('✅ Authorization status:', authStatus);

          // Get the FCM token
          const token = await getToken(messaging);
          console.log('📱 FCM Token:', token);

          // Save token to your backend/database here
          // await saveTokenToDatabase(token);
        } else {
          console.log('❌ Push notification permission denied');
          Alert.alert(
            'Notifications Disabled',
            'Please enable notifications in your device settings to receive important alerts.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('❌ FCM Setup Error:', error);
      }
    };

    // Handle foreground messages
    const unsubscribeForeground = onMessage(messaging, async (remoteMessage: any) => {
      console.log('📨 Foreground message received:', remoteMessage);

      // Show local notification or update UI
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Notification',
          remoteMessage.notification.body || 'You have a new message',
          [{ text: 'OK' }]
        );
      }
    });

    // Handle background messages (when app is in background but not killed)
    // This will be triggered when the user taps on a notification when the app is minimized
    const unsubscribeBackground = onNotificationOpenedApp(messaging, (remoteMessage: any) => {
      console.log('📨 Notification opened app from background:', remoteMessage);
      // Navigate to specific screen based on notification data
      // navigation.navigate('TargetScreen', remoteMessage.data);
    });

    // Handle messages when app is opened from a killed state
    // This will be triggered when the user taps on a notification when the app is completely closed
    getInitialNotification(messaging).then((remoteMessage: any) => {
      if (remoteMessage) {
        console.log('📨 Notification opened app from killed state:', remoteMessage);
        // Navigate to specific screen based on notification data
        // navigation.navigate('TargetScreen', remoteMessage.data);
      }
    });

    // Token refresh listener
    // This will be triggered when the FCM token is refreshed
    const unsubscribeTokenRefresh = onTokenRefresh(messaging, (token: string) => {
      console.log('🔄 FCM Token refreshed:', token);
      // Update token in your backend/database
      // updateTokenInDatabase(token);
    });

    setupFirebaseMessaging();

    // Cleanup subscriptions
    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
      unsubscribeTokenRefresh();
    };
  }, []);

  return null;
};

export default notification;
