import type { BaseNotification } from '@/types/types';
import { getNotificationDisplayTimestamp } from '@/utils/notificationTime';
import { create } from 'zustand';

const INDICATOR_SEEN_STORAGE_PREFIX = 'rescuenect_notification_indicator_seen_at';

const getIndicatorSeenStorageKey = (userId: string) => `${INDICATOR_SEEN_STORAGE_PREFIX}:${userId}`;

const readStoredIndicatorSeenAt = (userId: string | undefined): number => {
  if (!userId || typeof window === 'undefined') return 0;

  const storedValue = window.localStorage.getItem(getIndicatorSeenStorageKey(userId));
  const parsedValue = storedValue ? Number(storedValue) : 0;
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const writeStoredIndicatorSeenAt = (userId: string, seenAt: number) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getIndicatorSeenStorageKey(userId), String(seenAt));
};

interface NotificationStore {
  notifications: BaseNotification[];
  unreadCount: number;
  indicatorSeenAtByUser: Record<string, number>;
  error?: string | null;
  isLoading?: boolean;

  // Actions
  setNotifications: (notifications: BaseNotification[]) => void;
  addNotification: (notification: BaseNotification) => void;
  updateNotification: (id: string, updates: Partial<BaseNotification>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string, userId: string) => void;
  markAsHidden: (id: string, userId: string) => void;
  markAllAsRead: (userId: string) => void;
  markAllAsHidden: (userId: string) => void;
  markIndicatorAsSeen: (userId: string, seenAt?: number) => void;
  clearAll: () => void;

  // state
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;

  // Getters
  getUnreadCount: (userId?: string) => number;
  getIndicatorCount: (userId?: string) => number;
  getIndicatorSeenAt: (userId?: string) => number;
  getNotificationsByType: (type: BaseNotification['type']) => BaseNotification[];
  getEarthquakeNotifications: () => BaseNotification[];
  getWeatherNotifications: () => BaseNotification[];
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  indicatorSeenAtByUser: {},

  setError: error => {
    set({ error });
  },
  setIsLoading: isLoading => {
    set({ isLoading });
  },

  setNotifications: notifications => {
    set({ notifications });
  },

  addNotification: notification => {
    set(state => ({
      notifications: [notification, ...state.notifications],
    }));
  },

  updateNotification: (id, updates) => {
    set(state => ({
      notifications: state.notifications.map(notif => (notif.id === id ? { ...notif, ...updates } : notif)),
    }));
  },

  removeNotification: id => {
    set(state => ({
      notifications: state.notifications.filter(notif => notif.id !== id),
    }));
  },

  markAsRead: (id, userId) => {
    set(state => ({
      notifications: state.notifications.map(notif => {
        if (notif.id === id) {
          const readBy = notif.readBy || [];
          if (!readBy.includes(userId)) {
            return { ...notif, readBy: [...readBy, userId] };
          }
        }
        return notif;
      }),
    }));
  },

  markAsHidden: (id, userId) => {
    set(state => ({
      notifications: state.notifications.map(notif => {
        if (notif.id === id) {
          const hiddenBy = notif.hiddenBy || [];
          if (!hiddenBy.includes(userId)) {
            return { ...notif, hiddenBy: [...hiddenBy, userId] };
          }
        }
        return notif;
      }),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  markAllAsRead: userId => {
    set(state => ({
      notifications: state.notifications.map(notif => {
        const readBy = notif.readBy || [];
        if (!readBy.includes(userId)) {
          return { ...notif, readBy: [...readBy, userId] };
        }
        return notif;
      }),
    }));
  },

  markAllAsHidden: userId => {
    set(state => ({
      notifications: state.notifications.map(notif => {
        const hiddenBy = notif.hiddenBy || [];
        if (!hiddenBy.includes(userId)) {
          return { ...notif, hiddenBy: [...hiddenBy, userId] };
        }
        return notif;
      }),
    }));
  },

  markIndicatorAsSeen: (userId, seenAt = Date.now()) => {
    const currentSeenAt = get().getIndicatorSeenAt(userId);
    const nextSeenAt = Math.max(currentSeenAt, seenAt);

    writeStoredIndicatorSeenAt(userId, nextSeenAt);
    set(state => ({
      indicatorSeenAtByUser: {
        ...state.indicatorSeenAtByUser,
        [userId]: nextSeenAt,
      },
    }));
  },

  getUnreadCount: userId => {
    if (!userId) return get().notifications.length;
    return get().notifications.filter(notif => !notif.readBy?.includes(userId)).length;
  },

  getIndicatorSeenAt: userId => {
    if (!userId) return 0;
    return get().indicatorSeenAtByUser[userId] ?? readStoredIndicatorSeenAt(userId);
  },

  getIndicatorCount: userId => {
    if (!userId) return 0;

    const seenAt = get().getIndicatorSeenAt(userId);
    return get().notifications.filter(notif => getNotificationDisplayTimestamp(notif) > seenAt).length;
  },

  getNotificationsByType: type => {
    return get().notifications.filter(notif => notif.type === type);
  },

  getEarthquakeNotifications: () => {
    return get().notifications.filter(notif => notif.type === 'earthquake');
  },

  getWeatherNotifications: () => {
    return get().notifications.filter(notif => notif.type === 'weather');
  },
}));
