import { SecondaryButton } from '@/components/ui/button';
import { API_ENDPOINTS } from '@/config/endPoints';

import { auth } from '@/lib/firebaseConfig';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { BaseNotification, EarthquakeNotificationData, WeatherNotificationData } from '@/types/types';
import { Card, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Spinner } from '@heroui/react';
import axios from 'axios';
import {
  Activity,
  AlertTriangle,
  Bell,
  CloudRain,
  EllipsisVertical,
  Megaphone,
  Shield,
  Thermometer,
  Wind,
} from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export const Notification = () => {
  const uid = auth.currentUser?.uid;
  const navigate = useNavigate();

  const getIdToken = async () => {
    return await auth.currentUser?.getIdToken();
  };

  if (!uid) {
    return (
      <Card className="w-full border border-default-100" shadow="none">
        <div className="p-4">
          <p className="text-3xl font-bold">Notifications</p>
        </div>
        <div className="p-8 text-center text-danger">
          <AlertTriangle size={48} className="mx-auto mb-4" />
          <p className="text-lg font-semibold">User not authenticated</p>
          <p className="text-sm text-default-500 mt-2">Please log in to view your notifications.</p>
        </div>
      </Card>
    );
  }

  const { notifications, isLoading, error, markAsRead, markAsHidden, getUnreadCount } = useNotificationStore();

  // Get unread count
  const unreadCount = useMemo(() => getUnreadCount(uid), [notifications, getUnreadCount]);

  // Get notification icon based on type
  const getNotificationIcon = (notification: BaseNotification) => {
    switch (notification.type) {
      case 'earthquake':
        return <Activity size={20} className="text-orange-500 flex-shrink-0" />;
      case 'weather':
        const weatherData = notification.data as WeatherNotificationData;
        if (weatherData?.severity === 'CRITICAL') {
          return <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />;
        }
        return <CloudRain size={20} className="text-blue-500 flex-shrink-0" />;
      case 'announcement':
        return <Megaphone size={20} className="text-purple-500 flex-shrink-0" />;
      case 'emergency':
        return <Shield size={20} className="text-red-600 flex-shrink-0" />;
      case 'typhoon':
        return <Wind size={20} className="text-blue-600 flex-shrink-0" />;
      case 'flood':
        return <CloudRain size={20} className="text-cyan-600 flex-shrink-0" />;
      default:
        return <Bell size={20} className="text-gray-500 flex-shrink-0" />;
    }
  };

  // Get notification chip color based on type and severity
  const getChipColor = (notification: BaseNotification): 'danger' | 'warning' | 'primary' | 'default' => {
    if (notification.type === 'earthquake') {
      const earthquakeData = notification.data as EarthquakeNotificationData;
      if (earthquakeData?.priority === 'critical') return 'danger';
      if (earthquakeData?.priority === 'high') return 'warning';
      return 'primary';
    }

    if (notification.type === 'weather') {
      const weatherData = notification.data as WeatherNotificationData;
      if (weatherData?.severity === 'CRITICAL') return 'danger';
      if (weatherData?.severity === 'WARNING') return 'warning';
      if (weatherData?.severity === 'ADVISORY') return 'primary';
      return 'default';
    }

    if (notification.type === 'emergency') return 'danger';
    return 'primary';
  };

  // Get notification badge text
  const getBadgeText = (notification: BaseNotification): string => {
    if (notification.type === 'earthquake') {
      const earthquakeData = notification.data as EarthquakeNotificationData;
      return `M${earthquakeData?.magnitude?.toFixed(1)}`;
    }

    if (notification.type === 'weather') {
      const weatherData = notification.data as WeatherNotificationData;
      return weatherData?.severity || 'Weather';
    }

    return notification.type.toUpperCase();
  };

  // Check if notification is read by current user
  const isRead = (notification: BaseNotification): boolean => {
    return notification.readBy?.includes(uid) || false;
  };

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    }

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    }

    if (diffInHours < 48) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle notification click (navigate to details)
  const handleNotificationClick = async (notification: BaseNotification) => {
    navigate('/notification/details', {
      state: {
        notification,
      },
    });
  };

  // Handle delete notification
  const handleDelete = async (notification: BaseNotification) => {
    try {
      const idToken = await getIdToken();
      await axios.post(
        API_ENDPOINTS.NOTIFICATION.MARK_AS_HIDDEN,
        {
          notificationId: notification.id,
          userId: uid,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      markAsHidden(notification.id, uid);
    } catch (error) {
      console.error('Error marking notification as hidden:', error);
    }
  };

  if (error) {
    return (
      <Card className="w-full border border-default-100" shadow="none">
        <div className="p-4">
          <p className="text-3xl font-bold">Notifications</p>
        </div>
        <div className="p-8 text-center text-danger">
          <AlertTriangle size={48} className="mx-auto mb-4" />
          <p className="text-lg font-semibold">Failed to load notifications</p>
          <p className="text-sm text-default-500 mt-2">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full border border-default-100" shadow="none">
      <div className="p-4 flex justify-between items-center">
        <div>
          <p className="text-3xl font-bold">Notifications</p>
          {unreadCount > 0 ? (
            <p className="text-sm text-default-500 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          ) : (
            <div>
              <p className="text-sm text-default-500 mt-1">All caught up!</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Spinner size="lg" label="Loading notifications..." />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-default-500">
            <Bell size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">No notifications</p>
            <p className="text-sm mt-2">You're all caught up!</p>
          </div>
        ) : (
          notifications.map(notification => {
            const read = isRead(notification);
            return (
              <div
                key={notification.id}
                className={`flex w-full flex-row gap-4 items-start border-y border-default-100 hover:border-default-300 hover:cursor-pointer p-4 transition-colors ${
                  read ? 'bg-bg dark:bg-bg-dark' : 'bg-content1'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="mt-1">{getNotificationIcon(notification)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm truncate">{notification.title}</p>
                  </div>
                  <p className="text-sm text-default-600 line-clamp-2 text-start">{notification.message}</p>

                  {/* Additional info for earthquake */}
                  {notification.type === 'earthquake' && (
                    <div className="mt-2 flex items-center gap-3 text-xs text-default-500">
                      <span>📍 {(notification.data as EarthquakeNotificationData)?.place}</span>
                      {(notification.data as EarthquakeNotificationData)?.distanceFromNaic && (
                        <span>
                          {(notification.data as EarthquakeNotificationData)?.distanceFromNaic?.toFixed(1)} km away
                        </span>
                      )}
                    </div>
                  )}

                  {/* Additional info for weather */}
                  {notification.type === 'weather' && (
                    <div className="mt-2 flex items-center gap-3 text-xs text-default-500">
                      {(notification.data as WeatherNotificationData)?.temperature && (
                        <span className="flex items-center gap-1">
                          <Thermometer size={12} />
                          {(notification.data as WeatherNotificationData)?.temperature?.toFixed(1)}°C
                        </span>
                      )}
                      {(notification.data as WeatherNotificationData)?.category && (
                        <span>{(notification.data as WeatherNotificationData)?.category}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {!read && (
                      <Chip size="sm" variant="flat" color="primary">
                        New
                      </Chip>
                    )}
                    <Chip size="sm" variant="flat" color={getChipColor(notification)}>
                      {getBadgeText(notification)}
                    </Chip>
                  </div>

                  <p className="text-xs text-default-400">{formatTime(notification.timestamp)}</p>

                  <Dropdown>
                    <DropdownTrigger>
                      <SecondaryButton className="rounded-full border-none" isIconOnly size="sm">
                        <EllipsisVertical size={16} />
                      </SecondaryButton>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Notification actions">
                      {!read ? (
                        <DropdownItem
                          key="read"
                          onPress={() => markAsRead(notification.id, uid)}
                          startContent={<Bell size={16} />}
                        >
                          Mark as Read
                        </DropdownItem>
                      ) : null}
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        onPress={() => handleDelete(notification)}
                        startContent={<AlertTriangle size={16} />}
                      >
                        Delete
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
