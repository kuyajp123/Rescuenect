import { STORAGE_KEYS } from '@/config/asyncStorage';
import { storageHelpers } from '@/helper/storage';
import { getNotificationDisplayTimestamp } from '@/helper/notificationTime';
import type { BaseNotification } from '@/types/notification';
import { create } from 'zustand';

export const NOTIFICATION_INDICATOR_GUEST_ID = 'guest';

const getIndicatorViewerId = (userId?: string | null): string => userId || NOTIFICATION_INDICATOR_GUEST_ID;

const normalizeIndicatorSeenAtMap = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, rawValue]) => {
    const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    if (Number.isFinite(numericValue)) {
      acc[key] = numericValue;
    }
    return acc;
  }, {});
};

const readStoredIndicatorSeenAtMap = async (): Promise<Record<string, number>> => {
  const storedValue = await storageHelpers.getData<Record<string, unknown>>(
    STORAGE_KEYS.NOTIFICATION_INDICATOR_SEEN_AT
  );
  return normalizeIndicatorSeenAtMap(storedValue);
};

const writeStoredIndicatorSeenAtMap = async (seenAtByViewer: Record<string, number>): Promise<void> => {
  await storageHelpers.setData(STORAGE_KEYS.NOTIFICATION_INDICATOR_SEEN_AT, seenAtByViewer);
};

const getUnreadCountForViewer = (
  notifications: BaseNotification[],
  userId: string | null,
  guestReadIds: string[]
): number => {
  return userId
    ? notifications.filter(notif => !notif.readBy?.includes(userId)).length
    : notifications.filter(notif => !guestReadIds.includes(notif.id)).length;
};

const getIndicatorCountForViewer = (
  notifications: BaseNotification[],
  viewerId: string,
  indicatorSeenAtByViewer: Record<string, number>
): number => {
  const seenAt = indicatorSeenAtByViewer[viewerId] ?? 0;
  return notifications.filter(notif => getNotificationDisplayTimestamp(notif) > seenAt).length;
};

interface NotificationStore {
  notifications: BaseNotification[];
  unreadCount: number;
  indicatorCount: number;
  indicatorSeenAtByViewer: Record<string, number>;
  userId: string | null;
  guestReadIds: string[];
  guestHiddenIds: string[];

  // Actions
  setUserId: (userId: string | null) => void;
  setNotifications: (notifications: BaseNotification[]) => void;
  addNotification: (notification: BaseNotification) => void;
  updateNotification: (id: string, updates: Partial<BaseNotification>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string, userId: string) => void;
  markAsGuestRead: (id: string) => void;
  markAllAsRead: (userId: string) => void;
  markAllAsGuestRead: () => void;
  markAsHidden: (id: string, userId: string) => void;
  markAsGuestHidden: (id: string) => void;
  loadIndicatorSeenAt: (viewerId: string) => Promise<void>;
  markIndicatorAsSeen: (viewerId: string, seenAt?: number) => Promise<void>;
  setGuestPreferences: (readIds: string[], hiddenIds: string[]) => void;
  clearAll: () => void;

  // Getters
  getUnreadCount: (userId?: string) => number;
  getIndicatorCount: (viewerId?: string) => number;
  getIndicatorSeenAt: (viewerId?: string) => number;
  getNotificationsByType: (type: BaseNotification['type']) => BaseNotification[];
  getEarthquakeNotifications: () => BaseNotification[];
  getWeatherNotifications: () => BaseNotification[];
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  indicatorCount: 0,
  indicatorSeenAtByViewer: {},
  userId: null,
  guestReadIds: [],
  guestHiddenIds: [],

  setUserId: userId => {
    const state = get();
    const viewerId = getIndicatorViewerId(userId);

    set({
      userId,
      unreadCount: getUnreadCountForViewer(state.notifications, userId, state.guestReadIds),
      indicatorCount: getIndicatorCountForViewer(state.notifications, viewerId, state.indicatorSeenAtByViewer),
    });
  },

  setNotifications: notifications => {
    const { userId, guestReadIds, guestHiddenIds, indicatorSeenAtByViewer } = get();

    // Filter out hidden notifications for guests
    const visibleNotifications = !userId
      ? notifications.filter(notif => !guestHiddenIds.includes(notif.id))
      : notifications;

    set({
      notifications: visibleNotifications,
      unreadCount: getUnreadCountForViewer(visibleNotifications, userId, guestReadIds),
      indicatorCount: getIndicatorCountForViewer(
        visibleNotifications,
        getIndicatorViewerId(userId),
        indicatorSeenAtByViewer
      ),
    });
  },

  addNotification: notification => {
    set(state => {
      // Check if hidden for guest
      if (!state.userId && state.guestHiddenIds.includes(notification.id)) {
        return state;
      }

      const newNotifications = [notification, ...state.notifications];

      return {
        notifications: newNotifications,
        unreadCount: getUnreadCountForViewer(newNotifications, state.userId, state.guestReadIds),
        indicatorCount: getIndicatorCountForViewer(
          newNotifications,
          getIndicatorViewerId(state.userId),
          state.indicatorSeenAtByViewer
        ),
      };
    });
  },

  updateNotification: (id, updates) => {
    set(state => {
      const notifications = state.notifications.map(notif => (notif.id === id ? { ...notif, ...updates } : notif));

      return {
        notifications,
        unreadCount: getUnreadCountForViewer(notifications, state.userId, state.guestReadIds),
        indicatorCount: getIndicatorCountForViewer(
          notifications,
          getIndicatorViewerId(state.userId),
          state.indicatorSeenAtByViewer
        ),
      };
    });
  },

  removeNotification: id => {
    set(state => {
      const notifications = state.notifications.filter(notif => notif.id !== id);

      return {
        notifications,
        unreadCount: getUnreadCountForViewer(notifications, state.userId, state.guestReadIds),
        indicatorCount: getIndicatorCountForViewer(
          notifications,
          getIndicatorViewerId(state.userId),
          state.indicatorSeenAtByViewer
        ),
      };
    });
  },

  markAsRead: (id, userId) => {
    set(state => {
      const updatedNotifications = state.notifications.map(notif => {
        if (notif.id === id) {
          const readBy = notif.readBy || [];
          if (!readBy.includes(userId)) {
            return { ...notif, readBy: [...readBy, userId] };
          }
        }
        return notif;
      });
      const count = updatedNotifications.filter(notif => !notif.readBy?.includes(userId)).length;
      return {
        notifications: updatedNotifications,
        unreadCount: count,
      };
    });
  },

  markAsGuestRead: id => {
    set(state => {
      if (state.guestReadIds.includes(id)) return state;

      const newGuestReadIds = [...state.guestReadIds, id];
      // Recalc unread count
      const count = state.notifications.filter(notif => !newGuestReadIds.includes(notif.id)).length;

      return {
        guestReadIds: newGuestReadIds,
        unreadCount: count,
      };
    });
  },

  markAllAsRead: userId => {
    set(state => {
      const updatedNotifications = state.notifications.map(notif => {
        const readBy = notif.readBy || [];
        if (!readBy.includes(userId)) {
          return { ...notif, readBy: [...readBy, userId] };
        }
        return notif;
      });
      return {
        notifications: updatedNotifications,
        unreadCount: 0, // All notifications are now read
      };
    });
  },

  markAllAsGuestRead: () => {
    set(state => {
      const allIds = state.notifications.map(n => n.id);
      // Merge unique IDs
      const newReadIds = [...new Set([...state.guestReadIds, ...allIds])];
      return {
        guestReadIds: newReadIds,
        unreadCount: 0,
      };
    });
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

  markAsGuestHidden: id => {
    set(state => {
      if (state.guestHiddenIds.includes(id)) return state;
      const newHiddenIds = [...state.guestHiddenIds, id];

      // Also remove from visible list immediately
      const visibleNotifications = state.notifications.filter(n => n.id !== id);

      // Recalc unread
      const count = visibleNotifications.filter(notif => !state.guestReadIds.includes(notif.id)).length;

      return {
        guestHiddenIds: newHiddenIds,
        notifications: visibleNotifications,
        unreadCount: count,
        indicatorCount: getIndicatorCountForViewer(
          visibleNotifications,
          getIndicatorViewerId(state.userId),
          state.indicatorSeenAtByViewer
        ),
      };
    });
  },

  loadIndicatorSeenAt: async viewerId => {
    const storedSeenAtByViewer = await readStoredIndicatorSeenAtMap();

    set(state => {
      const indicatorSeenAtByViewer = {
        ...storedSeenAtByViewer,
        ...state.indicatorSeenAtByViewer,
      };

      return {
        indicatorSeenAtByViewer,
        indicatorCount: getIndicatorCountForViewer(state.notifications, viewerId, indicatorSeenAtByViewer),
      };
    });
  },

  markIndicatorAsSeen: async (viewerId, seenAt = Date.now()) => {
    const storedSeenAtByViewer = await readStoredIndicatorSeenAtMap();
    const currentState = get();
    const currentSeenAt = Math.max(
      storedSeenAtByViewer[viewerId] ?? 0,
      currentState.indicatorSeenAtByViewer[viewerId] ?? 0
    );
    const nextSeenAt = Math.max(currentSeenAt, seenAt);
    const indicatorSeenAtByViewer = {
      ...storedSeenAtByViewer,
      ...currentState.indicatorSeenAtByViewer,
      [viewerId]: nextSeenAt,
    };

    await writeStoredIndicatorSeenAtMap(indicatorSeenAtByViewer);
    set(state => ({
      indicatorSeenAtByViewer,
      indicatorCount: getIndicatorCountForViewer(state.notifications, viewerId, indicatorSeenAtByViewer),
    }));
  },

  setGuestPreferences: (readIds, hiddenIds) => {
    set(state => {
      // Filter current notifications based on new hiddenIds
      const visible = state.notifications.filter(n => !hiddenIds.includes(n.id));
      const count = state.userId
        ? state.unreadCount // If user logged in, ignore guest prefs for count
        : visible.filter(n => !readIds.includes(n.id)).length;

      return {
        guestReadIds: readIds,
        guestHiddenIds: hiddenIds,
        notifications: visible,
        unreadCount: count,
        indicatorCount: getIndicatorCountForViewer(
          visible,
          getIndicatorViewerId(state.userId),
          state.indicatorSeenAtByViewer
        ),
      };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0, indicatorCount: 0 });
  },

  getUnreadCount: userId => {
    if (!userId) {
      // Guest mode
      const { notifications, guestReadIds } = get();
      return notifications.filter(notif => !guestReadIds.includes(notif.id)).length;
    }
    return get().notifications.filter(notif => !notif.readBy?.includes(userId)).length;
  },

  getIndicatorSeenAt: viewerId => {
    return get().indicatorSeenAtByViewer[getIndicatorViewerId(viewerId)] ?? 0;
  },

  getIndicatorCount: viewerId => {
    const state = get();
    return getIndicatorCountForViewer(
      state.notifications,
      getIndicatorViewerId(viewerId ?? state.userId),
      state.indicatorSeenAtByViewer
    );
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
