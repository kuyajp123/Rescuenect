import { API_ENDPOINTS } from '@/config/endPoints';
import { askForPermissionAndGetToken } from '@/config/notificationPermission';
import { auth } from '@/lib/firebaseConfig';
import { addToast, Button, cn } from '@heroui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

export const NotificationToast = () => {
  const [isVisible, setIsVisible] = useState(
    // Show prompt only if notifications are not granted
    typeof Notification !== 'undefined' &&
      (Notification.permission === 'default' || Notification.permission === 'denied')
  );
  const [isLoading, setIsLoading] = useState(false);
  const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

  const handleEnableNotifications = async () => {
    if (!VAPID_KEY) {
      console.error('VAPID key is not defined');
      return;
    }

    setIsLoading(true);
    try {
      const fcmToken = await askForPermissionAndGetToken(VAPID_KEY);

      if (fcmToken) {
        // Update token in backend
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken();
          await axios.patch(
            API_ENDPOINTS.AUTH.UPDATE_FCM_TOKEN, // You'll need to create this endpoint
            { fcmToken },
            { headers: { Authorization: `Bearer ${idToken}` }, withCredentials: true }
          );
          console.log('✅ Notifications enabled successfully!');
        }
      }

      setIsVisible(false);
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Optionally store dismissal in localStorage to not show again for a while
    localStorage.setItem('notificationPromptDismissed', Date.now().toString());
  };

  useEffect(() => {
    if (isVisible) {
      addToast({
        title: 'Enable Notifications',
        description: 'Please turn on notifications to receive real-time weather alerts and important updates.',
        timeout: Infinity,
        variant: 'flat',
        classNames: {
          base: cn([
            'bg-default-50 dark:bg-background shadow-sm',
            'border border-l-8 rounded-md rounded-l-none',
            'flex flex-col items-start',
            'border-primary-200 dark:border-primary-100 border-l-primary',
          ]),
          icon: 'w-6 h-6 fill-current',
        },
        endContent: (
          <div className="ms-11 my-2 flex gap-x-2">
            <Button
              disabled={isLoading}
              onPress={handleEnableNotifications}
              color={'primary'}
              size="sm"
              variant="bordered"
            >
              {isLoading ? 'Enabling...' : 'Enable'}
            </Button>
            <Button
              disabled={isLoading}
              onPress={handleDismiss}
              className="underline-offset-2"
              color={'primary'}
              size="sm"
              variant="light"
            >
              Maybe Later
            </Button>
          </div>
        ),
        color: 'primary',
      });
    }
  }, []);

  if (!isVisible) return null;
};
