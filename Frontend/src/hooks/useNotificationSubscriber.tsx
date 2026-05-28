import { db } from '@/lib/firebaseConfig';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { BaseNotification } from '@/types/types';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect } from 'react';

interface UseNotificationSubscriberProps {
  enabled?: boolean;
  userLocation?: string; // User's barangay/location for filtering weather notifications
  clientId?: string | null; // LGU client scope for admin notifications
  role?: 'super_admin' | 'lgu_admin' | null;
  userId?: string; // User ID for read/hidden tracking
  maxNotifications?: number; // Limit number of notifications to fetch
}

export const useNotificationSubscriber = ({
  enabled = true,
  userLocation,
  clientId,
  role,
  userId,
  maxNotifications = 50,
}: UseNotificationSubscriberProps = {}) => {
  const setNotifications = useNotificationStore(state => state.setNotifications);
  const setIsLoading = useNotificationStore(state => state.setIsLoading);
  const setError = useNotificationStore(state => state.setError);

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      setIsLoading(false);
      setError(null);
      return () => {};
    }

    // Build query for notifications
    let notificationQuery = query(
      collection(db, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(maxNotifications)
    );

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      notificationQuery,
      snapshot => {
        try {
          const allNotifications: BaseNotification[] = [];

          snapshot.forEach(doc => {
            const data = doc.data() as BaseNotification;
            const notification: BaseNotification = {
              ...data,
              id: doc.id,
            };

            const notificationClientId = notification.clientId || 'naic';
            if (role === 'super_admin') {
              if (notification.type === 'weather') return;
              const actionableTypes = new Set(['client_request', 'client_change_request', 'earthquake', 'system_health']);
              if (!actionableTypes.has(notification.type)) return;
              if (notification.audience === 'users' && notification.type !== 'earthquake') return;
              const status =
                notification.data && typeof (notification.data as Record<string, unknown>).status === 'string'
                  ? (notification.data as Record<string, string>).status
                  : null;
              if (
                (notification.type === 'client_request' || notification.type === 'client_change_request') &&
                status &&
                status !== 'pending'
              ) {
                return;
              }
              if (
                notification.targetRole &&
                notification.targetRole !== 'super_admin' &&
                notification.targetRole !== 'all_admins'
              ) {
                return;
              }
              allNotifications.push(notification);
              return;
            }

            if (notification.targetRole === 'super_admin') {
              return;
            }

            if (notification.audience === 'users' && notification.type !== 'weather') {
              return;
            }

            if (clientId && notification.type !== 'earthquake' && notificationClientId !== clientId) {
              return;
            }

            // Filter logic:
            // 1. Always include earthquake notifications
            // 2. For weather notifications, filter by user location
            // 3. Include all other notification types

            if (notification.type === 'earthquake') {
              if (!clientId || !notification.clientId || notification.clientId === clientId) {
                allNotifications.push(notification);
              }
            } else if (notification.type === 'weather') {
              if (clientId && notificationClientId !== clientId) return;
              // Filter weather by location
              if (!userLocation) {
                // No location set, include all weather notifications
                allNotifications.push(notification);
              } else {
                // Check if notification is relevant to user's location
                const isRelevant =
                  notification.location === userLocation ||
                  notification.location === 'central_naic' || // Central location affects everyone
                  notification.barangays?.includes(userLocation) ||
                  false;

                if (isRelevant) {
                  allNotifications.push(notification);
                }
              }
            } else {
              // Include all other notification types (announcement, emergency, etc.)
              allNotifications.push(notification);
            }
          });

          // Filter out notifications hidden by current user
          const visibleNotifications = userId
            ? allNotifications.filter(notif => !notif.hiddenBy?.includes(userId))
            : allNotifications;

          setNotifications(visibleNotifications);
          setIsLoading(false);
          setError(null);
        } catch (err) {
          console.error('❌ Error processing notifications:', err);
          setError(err instanceof Error ? err.message : 'Failed to load notifications');
          setIsLoading(false);
        }
      },
      err => {
        console.error('❌ Notification listener error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [enabled, userLocation, clientId, role, userId, maxNotifications, setNotifications]);
};
