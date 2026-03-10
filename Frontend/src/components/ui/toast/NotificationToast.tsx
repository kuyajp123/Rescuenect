import { askForPermissionAndGetToken } from '@/config/notificationPermission';
import { saveFCMtoken } from '@/helper/commonHelpers';
import { useAuth } from '@/stores/useAuth';
import { Button, Spinner } from '@heroui/react';
import { Bell } from 'lucide-react';
import { useState } from 'react';

export const NotificationToast = () => {
  const auth = useAuth(state => state.auth);
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
    setIsVisible(false);
    // Optionally store dismissal in localStorage to not show again for a while
    localStorage.setItem('notificationPromptDismissed', Date.now().toString());
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[320px] max-w-[calc(100vw-2rem)]">
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-primary">
            <Bell size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Enable Notifications</div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Please turn on notifications to receive real-time weather alerts and important updates.
            </div>
          </div>
          {isLoading ? <Spinner size="sm" className="text-primary" /> : null}
        </div>
        <div className="flex gap-2">
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
            color="primary"
            size="sm"
            variant="light"
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
};
