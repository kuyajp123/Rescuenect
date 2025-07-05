import Body from '@/components/ui/Body';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { StyleSheet, View, Switch, TouchableOpacity } from 'react-native';
import { useState } from 'react';

export default function NotificationsScreen() {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailNotifications: false,
    emergencyAlerts: true,
    communityUpdates: true,
    weeklyDigest: false,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const notificationItems = [
    {
      key: 'pushNotifications' as keyof typeof notifications,
      title: 'Push Notifications',
      description: 'Receive notifications on your device',
    },
    {
      key: 'emailNotifications' as keyof typeof notifications,
      title: 'Email Notifications',
      description: 'Get updates via email',
    },
    {
      key: 'emergencyAlerts' as keyof typeof notifications,
      title: 'Emergency Alerts',
      description: 'Critical emergency notifications',
    },
    {
      key: 'communityUpdates' as keyof typeof notifications,
      title: 'Community Updates',
      description: 'News from your community',
    },
    {
      key: 'weeklyDigest' as keyof typeof notifications,
      title: 'Weekly Digest',
      description: 'Summary of weekly activities',
    },
  ];

  return (
    <Body gap={16}>
      <Card>
        <Text size="lg" emphasis="semibold" style={{ marginBottom: 16 }}>
          Notification Preferences
        </Text>
        <Text size="sm" style={{ color: '#666', marginBottom: 20 }}>
          Choose what notifications you'd like to receive
        </Text>

        {notificationItems.map((item, index) => (
          <View
            key={item.key}
            style={[
              styles.notificationItem,
              index < notificationItems.length - 1 && styles.notificationItemBorder
            ]}
          >
            <View style={styles.notificationContent}>
              <Text size="md" emphasis="medium">{item.title}</Text>
              <Text size="sm" style={{ color: '#666', marginTop: 2 }}>
                {item.description}
              </Text>
            </View>
            <Switch
              value={notifications[item.key]}
              onValueChange={() => toggleNotification(item.key)}
              trackColor={{ 
                false: '#767577', 
                true: isDark ? Colors.brand.dark : Colors.brand.light 
              }}
              thumbColor={notifications[item.key] ? '#fff' : '#f4f3f4'}
            />
          </View>
        ))}
      </Card>

      <Card>
        <Text size="lg" emphasis="semibold" style={{ marginBottom: 12 }}>
          Quiet Hours
        </Text>
        <Text size="sm" style={{ color: '#666', marginBottom: 16 }}>
          Set times when you don't want to receive non-emergency notifications
        </Text>
        
        <TouchableOpacity style={styles.timeSelector}>
          <Text size="md">From: 10:00 PM</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.timeSelector, { marginTop: 8 }]}>
          <Text size="md">To: 7:00 AM</Text>
        </TouchableOpacity>
      </Card>
    </Body>
  );
}

const styles = StyleSheet.create({
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  notificationItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationContent: {
    flex: 1,
    marginRight: 16,
  },
  timeSelector: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
});
