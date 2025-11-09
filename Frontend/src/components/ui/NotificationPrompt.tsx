import { API_ENDPOINTS } from '@/config/endPoints';
import { askForPermissionAndGetToken } from '@/config/notificationPermission';
import { auth } from '@/lib/firebaseConfig';
import axios from 'axios';
import { useState, useEffect } from 'react';

export const NotificationPrompt = () => {
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

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Enable Notifications</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Get real-time weather alerts and important updates
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enabling...' : 'Enable'}
            </button>
            <button
              onClick={handleDismiss}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Maybe Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
