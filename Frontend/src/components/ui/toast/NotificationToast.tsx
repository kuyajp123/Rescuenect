import { askForPermissionAndGetToken } from '@/config/notificationPermission';
import { saveFCMtoken } from '@/helper/commonHelpers';
import { useAuth } from '@/stores/useAuth';
import { addToast, Button, closeToast, cn, Spinner } from '@heroui/react';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const NotificationToast = () => {
  const auth = useAuth(state => state.auth);
  const [isVisible, setIsVisible] = useState(
    // Show prompt only if notifications are not granted
    typeof Notification !== 'undefined' &&
      (Notification.permission === 'default' || Notification.permission === 'denied')
  );
  const toastRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

  const handleEnableNotifications = async () => {
    if (toastRef.current) {
      closeToast(toastRef.current);
      toastRef.current = null;
    }

    if (!VAPID_KEY) {
      console.error('VAPID key is not defined');
      return;
    }

    setIsLoading(true);
    try {
      const fcmToken = await askForPermissionAndGetToken(VAPID_KEY);

      // Close the toast immediately
      if (toastRef.current) {
        closeToast(toastRef.current);
        toastRef.current = null;
      }

      setIsVisible(false);

      if (fcmToken && auth) {
        // Update token in backend
        await saveFCMtoken(fcmToken, auth);
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    // Close the toast immediately
    if (toastRef.current) {
      closeToast(toastRef.current);
      toastRef.current = null;
    }
    setIsVisible(false);
    // Optionally store dismissal in localStorage to not show again for a while
    localStorage.setItem('notificationPromptDismissed', Date.now().toString());
  };

  useEffect(() => {
    if (isVisible) {
      toastRef.current = addToast({
        title: 'Enable Notifications',
        description: 'Please turn on notifications to receive real-time weather alerts and important updates.',
        timeout: Infinity,
        variant: 'flat',
        icon: <Bell />,
        hideCloseButton: true,
        loadingComponent: isLoading ? <Spinner size="sm" className="text-primary" /> : null,
        classNames: {
          base: cn([
            'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700',
            'flex flex-col items-start',
          ]),
          title: cn(['text-gray-800 dark:text-gray-200 font-semibold mb-1']),
          description: cn(['text-xs text-gray-600 dark:text-gray-400 mb-2']),
        },
        endContent: (
          <div className="ms-11 my-2 flex gap-x-2">
            <Button
              disabled={isLoading}
              onPress={handleEnableNotifications}
              isDisabled={isLoading}
              size="sm"
              variant="solid"
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enabling...' : 'Enable'}
            </Button>
            <Button
              disabled={isLoading}
              onPress={handleDismiss}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
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
  }, [isVisible]);

  return null;
};
