import { create } from 'zustand';
import type { BaseNotification } from '@/types/notification';

interface NotificationStore {
  notifications: BaseNotification[];
  unreadCount: number;
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
  setGuestPreferences: (readIds: string[], hiddenIds: string[]) => void;
  clearAll: () => void;

  // Getters
  getUnreadCount: (userId?: string) => number;
  getNotificationsByType: (type: BaseNotification['type']) => BaseNotification[];
  getEarthquakeNotifications: () => BaseNotification[];
  getWeatherNotifications: () => BaseNotification[];
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  userId: null,
  guestReadIds: [],
  guestHiddenIds: [],

  setUserId: userId => {
    set({ userId });
    // Recalculate unread count when userId changes
    const state = get();
    const count = userId
      ? state.notifications.filter(notif => !notif.readBy?.includes(userId)).length
      : state.notifications.filter(notif => !state.guestReadIds.includes(notif.id)).length;
    set({ unreadCount: count });
  },

  setNotifications: notifications => {
    const { userId, guestReadIds, guestHiddenIds } = get();

    // Filter out hidden notifications for guests
    const visibleNotifications = !userId
      ? notifications.filter(notif => !guestHiddenIds.includes(notif.id))
      : notifications;

    const count = userId
      ? visibleNotifications.filter(notif => !notif.readBy?.includes(userId)).length
      : visibleNotifications.filter(notif => !guestReadIds.includes(notif.id)).length;

    set({ notifications: visibleNotifications, unreadCount: count });
  },

  addNotification: notification => {
    set(state => {
      // Check if hidden for guest
      if (!state.userId && state.guestHiddenIds.includes(notification.id)) {
        return state;
      }

      const newNotifications = [notification, ...state.notifications];
      const count = state.userId
        ? newNotifications.filter(notif => !notif.readBy?.includes(state.userId!)).length
        : newNotifications.filter(notif => !state.guestReadIds.includes(notif.id)).length;
      return {
        notifications: newNotifications,
        unreadCount: count,
      };
    });
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
      };
    });
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
      };
    });
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  getUnreadCount: userId => {
    if (!userId) {
      // Guest mode
      const { notifications, guestReadIds } = get();
      return notifications.filter(notif => !guestReadIds.includes(notif.id)).length;
    }
    return get().notifications.filter(notif => !notif.readBy?.includes(userId)).length;
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
