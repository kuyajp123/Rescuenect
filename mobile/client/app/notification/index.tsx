import { HoveredButton, IconButton } from '@/components/components/button/Button';
import { formatToCapitalized } from '@/components/helper/commonHelpers';
import { useAuth } from '@/components/store/useAuth';
import { useUserData } from '@/components/store/useBackendResponse';
import { useNotificationStore } from '@/components/store/useNotificationStore';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { API_ROUTES } from '@/config/endpoints';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import type { BaseNotification } from '@/types/notification';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Activity, AlertCircle, Bell, Cloud, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

const index = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const notifications = useNotificationStore(state => state.notifications);
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const markAsHidden = useNotificationStore(state => state.markAsHidden);
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);
  const userData = useUserData((state: any) => state.userData);
  const authUser = useAuth(state => state.authUser);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Get icon based on notification type
  const getNotificationIcon = (type: BaseNotification['type']) => {
    const iconColor = isDark ? 'white' : 'black';

    switch (type) {
      case 'earthquake':
        return <Activity color={iconColor} size={24} />;
      case 'weather':
        return <Cloud color={iconColor} size={24} />;
      case 'emergency':
        return <AlertCircle color={iconColor} size={24} />;
      case 'status_resolved':
        return <MapPin color={iconColor} size={24} />;
      default:
        return <Bell color={iconColor} size={24} />;
    }
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get background color based on notification type
  const getNotificationBg = (type: BaseNotification['type'], isRead: boolean) => {
    if (isRead) {
      return isDark ? Colors.background.dark : Colors.background.light;
    }

    switch (type) {
      case 'earthquake':
        return isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)';
      case 'weather':
        return isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)';
      case 'emergency':
        return isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)';
      default:
        return isDark ? Colors.background.dark : Colors.background.light;
    }
  };

  // Handle notification deletion
  const handleNotificationAction = async (notification: BaseNotification) => {
    const idToken = await authUser?.getIdToken();

    if (!authUser?.uid) {
      Alert.alert('Error', 'You must be logged in to delete notifications');
      return;
    }

    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          console.log(notification);
          if (notification.type === 'status_resolved') {
            notificationMarkAsDeleted(notification.id, authUser.uid, idToken);
          } else {
            notificationMarkAsHidden(notification.id, authUser.uid, idToken);
          }
        },
      },
    ]);
  };

  const notificationMarkAsHidden = async (id: BaseNotification['id'], uid: string, idToken: any) => {
    console.log('Notification marked as hidden');
    try {
      // Call API to mark as hidden
      const response = await axios.post(
        API_ROUTES.NOTIFICATION.MARK_AS_HIDDEN,
        {
          notificationId: id,
          uid: uid,
        },
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      if (response.status === 500 || response.status === 400) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      markAsHidden(id, uid);
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification. Please try again.');
    }
  };

  const notificationMarkAsDeleted = async (id: BaseNotification['id'], uid: string, idToken: any) => {
    console.log('Notification marked as deleted');
    try {
      // Call API to mark as deleted
      const response = await axios.post(
        API_ROUTES.NOTIFICATION.MARK_AS_DELETED,
        {
          notificationId: id,
          uid: uid,
        },
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      if (response.status === 500 || response.status === 400) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      markAsHidden(id, uid);
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification. Please try again.');
    }
  };

  if (notifications.length === 0) {
    return (
      <Body style={{ padding: 0 }}>
        <Text size="3xl" bold style={styles.header}>
          Notifications
        </Text>
        <View style={styles.emptyContainer}>
          <Bell size={64} color={isDark ? Colors.icons.dark : Colors.icons.light} />
          <Text size="lg" style={{ marginTop: 16, opacity: 0.6 }}>
            No notifications yet
          </Text>
          <Text size="sm" style={{ marginTop: 8, opacity: 0.5, textAlign: 'center' }}>
            You'll be notified about earthquakes and weather alerts
          </Text>
        </View>
      </Body>
    );
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (!authUser?.uid) {
      Alert.alert('Error', 'You must be logged in to mark notifications as read');
      return;
    }

    const unreadNotifications = notifications.filter(notif => !notif.readBy?.includes(authUser.uid));

    if (unreadNotifications.length === 0) {
      Alert.alert('Info', 'All notifications are already marked as read');
      return;
    }

    let notificationToBeUpdated: any[] = [];

    unreadNotifications.forEach(notif => {
      notificationToBeUpdated.push({ notificationId: notif.id });
    });

    Alert.alert(
      'Mark All as Read',
      `Are you sure you want to mark ${unreadNotifications.length} notification${
        unreadNotifications.length > 1 ? 's' : ''
      } as read?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark All',
          onPress: async () => {
            try {
              // Get ID token from Firebase Auth
              const idToken = await authUser.getIdToken();

              // Call API to mark all as read
              const response = await axios.post(
                API_ROUTES.NOTIFICATION.MARK_ALL_AS_READ,
                {
                  userId: authUser.uid,
                  notificationId: notificationToBeUpdated,
                },
                {
                  headers: { Authorization: `Bearer ${idToken}` },
                }
              );

              if (response.status === 500 || response.status === 400) {
                throw new Error('Failed to mark all notifications as read');
              }

              // Update local state
              markAllAsRead(authUser.uid);
              Alert.alert('Success', 'All notifications marked as read');
            } catch (error) {
              console.error('Error marking all as read:', error);
              Alert.alert('Error', 'Failed to mark notifications as read. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <Body style={{ padding: 0 }}>
      <View style={styles.headerContainer}>
        <Text size="3xl" bold style={styles.header}>
          Notifications
        </Text>
        {unreadCount > 0 && (
          <IconButton style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <Text size="sm" style={{ color: Colors.brand.dark }}>
              Mark All Read
            </Text>
          </IconButton>
        )}
      </View>
      <ScrollView style={styles.scrollView}>
        {notifications.map(notification => {
          const isRead = authUser?.uid ? notification.readBy?.includes(authUser.uid) : false;

          return (
            <HoveredButton
              key={notification.id}
              style={[
                styles.notificationCard,
                {
                  backgroundColor: getNotificationBg(notification.type, isRead || false),
                  borderLeftColor:
                    notification.type === 'earthquake'
                      ? Colors.semantic.error
                      : notification.type === 'weather'
                      ? Colors.semantic.info
                      : Colors.brand.dark,
                  opacity: deletingId === notification.id ? 0.5 : 1,
                },
              ]}
              onPress={() => {
                // Navigate to notification details screen
                router.push({
                  pathname: '/notification/notificationDetails',
                  params: { notificationId: notification.id },
                });
              }}
              onLongPress={() => {
                if (deletingId === notification.id) return;
                handleNotificationAction(notification);
              }}
            >
              <View style={styles.notificationContent}>
                {/* Icon and Title Row */}
                <View style={styles.notificationHeader}>
                  <View style={styles.iconContainer}>{getNotificationIcon(notification.type)}</View>
                  <View style={styles.titleContainer}>
                    <Text size="md" bold style={{ flexShrink: 1 }}>
                      {notification.title}
                    </Text>
                    {!isRead && <View style={styles.unreadDot} />}
                  </View>
                </View>

                {/* Message */}
                <Text size="sm" style={[styles.message, { opacity: isRead ? 0.7 : 0.9 }]} numberOfLines={3}>
                  {notification.message}
                </Text>

                {/* Location & Time */}
                <View style={styles.metaRow}>
                  <Text size="xs" emphasis="light">
                    {notification.type === 'weather'
                      ? formatToCapitalized(userData?.barangay)
                      : notification.type === 'earthquake'
                      ? (notification.data as { place?: string })?.place
                      : notification.location?.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text size="xs" emphasis="light">
                    {formatTime(notification.timestamp)}
                  </Text>
                </View>
              </View>
            </HoveredButton>
          );
        })}
      </ScrollView>
    </Body>
  );
};

export default index;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 20,
    marginTop: 8,
  },
  header: {
    margin: 0,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  notificationCard: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  notificationContent: {
    gap: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.semantic.info,
  },
  message: {
    marginLeft: 36, // Align with title (icon + gap)
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 36,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
});
