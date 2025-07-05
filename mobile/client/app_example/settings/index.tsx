import Body from '@/components/ui/Body';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { 
  Bell, 
  Shield, 
  Info, 
  Palette, 
  Type, 
  ChevronRight 
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { isDark } = useTheme();
  const router = useRouter();

  const settingsItems = [
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: Bell,
      onPress: () => router.push('/settings/notifications' as any),
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Control your privacy settings',
      icon: Shield,
      onPress: () => router.push('/settings/privacy' as any),
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Theme and display settings',
      icon: Palette,
      onPress: () => console.log('Navigate to appearance'),
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      description: 'Font size and accessibility options',
      icon: Type,
      onPress: () => console.log('Navigate to accessibility'),
    },
    {
      id: 'about',
      title: 'About',
      description: 'App version and information',
      icon: Info,
      onPress: () => router.push('/settings/about' as any),
    },
  ];

  return (
    <Body gap={16}>
      <Card>
        <Text size="xl" emphasis="bold" style={{ marginBottom: 16 }}>
          Settings
        </Text>
        <Text size="md" style={{ color: '#666', marginBottom: 20 }}>
          Customize your app experience
        </Text>

        {settingsItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.settingItem,
                index < settingsItems.length - 1 && styles.settingItemBorder
              ]}
              onPress={item.onPress}
            >
              <View style={styles.settingContent}>
                <View style={[
                  styles.iconContainer, 
                  { backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light }
                ]}>
                  <IconComponent size={20} color="white" />
                </View>
                <View style={styles.settingText}>
                  <Text size="md" emphasis="medium">{item.title}</Text>
                  <Text size="sm" style={{ color: '#666', marginTop: 2 }}>
                    {item.description}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#999" />
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* App Info */}
      <Card>
        <View style={styles.appInfo}>
          <Text size="lg" emphasis="semibold">RescueNect</Text>
          <Text size="sm" style={{ color: '#666' }}>Version 1.0.0</Text>
          <Text size="sm" style={{ color: '#666' }}>© 2024 RescueNect Team</Text>
        </View>
      </Card>
    </Body>
  );
}

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});
