import { HoveredButton } from '@/components/components/button/Button';
import { useAuth } from '@/components/store/useAuth';
import { useUserData } from '@/components/store/useBackendResponse';
import { useNotificationStore } from '@/components/store/useNotificationStore';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import type { BaseNotification } from '@/types/notification';
import { Activity, AlertCircle, Bell, Cloud } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

const index = () => {
  const { isDark } = useTheme();
  const notifications = useNotificationStore(state => state.notifications);
  const userData = useUserData((state: any) => state.userData);
  const authUser = useAuth(state => state.authUser);

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

  return (
    <Body style={{ padding: 0 }}>
      <Text size="3xl" bold style={styles.header}>
        Notifications
      </Text>
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
                },
              ]}
              onPress={() => {
                // TODO: Navigate to notification detail or mark as read
                console.log('Notification pressed:', notification.id);
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
                      ? userData?.barangay.charAt(0).toUpperCase() + userData?.barangay.slice(1)
                      : notification.type === 'earthquake'
                      ? (notification.data as { place?: string })?.place
                      : notification.location.replace('_', ' ').toUpperCase()}
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
  header: {
    marginBottom: 16,
    marginLeft: 20,
    marginTop: 8,
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
