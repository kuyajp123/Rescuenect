import { create } from 'zustand';
import type { BaseNotification } from '../../types/notification';

interface NotificationStore {
  notifications: BaseNotification[];
  unreadCount: number;
  userId: string | null;

  // Actions
  setUserId: (userId: string | null) => void;
  setNotifications: (notifications: BaseNotification[]) => void;
  addNotification: (notification: BaseNotification) => void;
  updateNotification: (id: string, updates: Partial<BaseNotification>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string, userId: string) => void;
  markAllAsRead: (userId: string) => void;
  markAsHidden: (id: string, userId: string) => void;
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

  setUserId: userId => {
    set({ userId });
    // Recalculate unread count when userId changes
    const state = get();
    const count = userId
      ? state.notifications.filter(notif => !notif.readBy?.includes(userId)).length
      : state.notifications.length;
    set({ unreadCount: count });
  },

  setNotifications: notifications => {
    const userId = get().userId;
    const count = userId ? notifications.filter(notif => !notif.readBy?.includes(userId)).length : notifications.length;
    set({ notifications, unreadCount: count });
  },

  addNotification: notification => {
    set(state => {
      const newNotifications = [notification, ...state.notifications];
      const count = state.userId
        ? newNotifications.filter(notif => !notif.readBy?.includes(state.userId!)).length
        : newNotifications.length;
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
      const count = state.userId
        ? updatedNotifications.filter(notif => !notif.readBy?.includes(state.userId!)).length
        : updatedNotifications.length;
      return {
        notifications: updatedNotifications,
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

  getUnreadCount: userId => {
    if (!userId) return get().notifications.length;
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
