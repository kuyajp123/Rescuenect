import { useNotificationStore } from '@/components/store/useNotificationStore';
import { db } from '@/lib/firebaseConfig';
import type { BaseNotification } from '@/types/notification';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface UseNotificationSubscriberProps {
  userLocation?: string; // User's barangay/location for filtering weather notifications
  userId?: string; // User ID for read/hidden tracking
  maxNotifications?: number; // Limit number of notifications to fetch
}

export const useNotificationSubscriber = ({
  userLocation,
  userId,
  maxNotifications = 50,
}: UseNotificationSubscriberProps = {}) => {
  const { setNotifications, setUserId } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalNotifications, setGlobalNotifications] = useState<BaseNotification[]>([]);
  const [userNotifications, setUserNotifications] = useState<BaseNotification[]>([]);

  useEffect(() => {
    // Set userId in store for unread count calculation
    if (userId) {
      setUserId(userId);
    }
  }, [userId, setUserId]);

  // Global Notifications Subscription
  useEffect(() => {
    const notificationQuery = query(
      collection(db, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(maxNotifications)
    );

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

            // Filter logic:
            if (notification.type === 'earthquake') {
              allNotifications.push(notification);
            } else if (notification.type === 'weather') {
              if (!userLocation) {
                allNotifications.push(notification);
              } else {
                const isRelevant =
                  notification.location === userLocation ||
                  notification.location === 'central_naic' ||
                  notification.barangays?.includes(userLocation) ||
                  false;

                if (isRelevant) {
                  allNotifications.push(notification);
                }
              }
            } else {
              allNotifications.push(notification);
            }
          });

          // Filter out notifications hidden by current user
          const visibleNotifications = userId
            ? allNotifications.filter(notif => !notif.hiddenBy?.includes(userId))
            : allNotifications;

          setGlobalNotifications(visibleNotifications);
          setIsLoading(false);
        } catch (err) {
          console.error('❌ Error processing global notifications:', err);
          setError(err instanceof Error ? err.message : 'Failed to load notifications');
          setIsLoading(false);
        }
      },
      err => {
        console.error('❌ Global notification listener error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userLocation, userId, maxNotifications]);

  // User-Specific Notifications Subscription
  useEffect(() => {
    if (!userId) {
      setUserNotifications([]);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      docSnapshot => {
        try {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const notifications = data?.notifications || [];

            const mappedNotifications: BaseNotification[] = notifications.map((n: any, index: number) => ({
              id: n.id || `user-notif-${index}-${n.timestamp}`,
              type: n.type || 'system',
              title: n.title,
              message: n.body,
              timestamp: n.timestamp,
              createdAt: new Date(n.timestamp).toISOString(),
              location: 'status update',
              audience: 'users',
              sentTo: 1,
              data: {
                statusId: n.statusId,
                type: n.type,
              },
              // If the stored notification says 'read: true', we verify it by checking if userId is in readBy for consistency,
              // or just artificially construct readBy. BaseNotification expects readBy string[].
              readBy: n.read ? [userId] : [],
              hiddenBy: [], // User specific ones are likely not hidden via this mechanism yet
            }));

            setUserNotifications(mappedNotifications);
          } else {
            setUserNotifications([]);
          }
        } catch (err) {
          console.error('❌ Error processing user notifications:', err);
        }
      },
      err => {
        console.error('❌ User notification listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Merge and update store
  useEffect(() => {
    const merged = [...globalNotifications, ...userNotifications].sort((a, b) => b.timestamp - a.timestamp);
    setNotifications(merged);
  }, [globalNotifications, userNotifications, setNotifications]);
  return { isLoading, error };
};
