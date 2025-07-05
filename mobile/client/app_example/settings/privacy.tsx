import Body from '@/components/ui/Body';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { StyleSheet, View, Switch, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Shield, Eye, Lock, Fingerprint } from 'lucide-react-native';

export default function PrivacyScreen() {
  const { isDark } = useTheme();
  const [privacy, setPrivacy] = useState({
    profileVisibility: true,
    locationSharing: false,
    dataAnalytics: true,
    biometricAuth: false,
  });

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const privacyItems = [
    {
      key: 'profileVisibility' as keyof typeof privacy,
      title: 'Public Profile',
      description: 'Allow others to see your profile',
      icon: Eye,
    },
    {
      key: 'locationSharing' as keyof typeof privacy,
      title: 'Location Sharing',
      description: 'Share your location with the community',
      icon: Shield,
    },
    {
      key: 'dataAnalytics' as keyof typeof privacy,
      title: 'Data Analytics',
      description: 'Help improve the app with usage data',
      icon: Shield,
    },
    {
      key: 'biometricAuth' as keyof typeof privacy,
      title: 'Biometric Authentication',
      description: 'Use fingerprint or face ID to unlock',
      icon: Fingerprint,
    },
  ];

  return (
    <Body gap={16}>
      <Card>
        <Text size="lg" emphasis="semibold" style={{ marginBottom: 16 }}>
          Privacy & Security Settings
        </Text>
        <Text size="sm" style={{ color: '#666', marginBottom: 20 }}>
          Control how your data is used and shared
        </Text>

        {privacyItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <View
              key={item.key}
              style={[
                styles.privacyItem,
                index < privacyItems.length - 1 && styles.privacyItemBorder
              ]}
            >
              <View style={styles.privacyContent}>
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light }
                ]}>
                  <IconComponent size={20} color="white" />
                </View>
                <View style={styles.privacyText}>
                  <Text size="md" emphasis="medium">{item.title}</Text>
                  <Text size="sm" style={{ color: '#666', marginTop: 2 }}>
                    {item.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={privacy[item.key]}
                onValueChange={() => togglePrivacy(item.key)}
                trackColor={{ 
                  false: '#767577', 
                  true: isDark ? Colors.brand.dark : Colors.brand.light 
                }}
                thumbColor={privacy[item.key] ? '#fff' : '#f4f3f4'}
              />
            </View>
          );
        })}
      </Card>

      <Card>
        <Text size="lg" emphasis="semibold" style={{ marginBottom: 12 }}>
          Data Management
        </Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text size="md" style={{ color: isDark ? Colors.brand.dark : Colors.brand.light }}>
            Download My Data
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, { marginTop: 8 }]}>
          <Text size="md" style={{ color: Colors.semantic.error }}>
            Delete Account
          </Text>
        </TouchableOpacity>
      </Card>
    </Body>
  );
}

const styles = StyleSheet.create({
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  privacyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  privacyText: {
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
});
