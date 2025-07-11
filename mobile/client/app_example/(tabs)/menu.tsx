import { FontSizeSwitch } from '@/components/shared/hooks/FontSizeSwitch';
import ThemeSwitcher from '@/components/shared/hooks/ThemeSwitcher';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { Bell, ChevronRight, FileText, Settings, Shield, Smartphone, User } from 'lucide-react-native';
import React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

export default function MenuScreen() {
  const { isDark } = useTheme();
  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const cardColor = isDark ? '#262626' : '#ffffff'; // Using hex colors since surface doesn't exist
  const secondaryTextColor = isDark ? '#a1a1aa' : '#64748b';

  const navigationItems = [
    {
      title: 'Profile',
      subtitle: 'View and edit your profile',
      icon: User,
      action: () => router.push('/(tabs)/profile' as any),
    },
    {
      title: 'Settings',
      subtitle: 'App preferences and configuration',
      icon: Settings,
      action: () => router.push('/settings/' as any),
    },
    {
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      icon: Bell,
      action: () => router.push('/settings/notifications' as any),
    },
    {
      title: 'Privacy',
      subtitle: 'Privacy and security settings',
      icon: Shield,
      action: () => router.push('/settings/privacy' as any),
    },
  ];

  const demoItems = [
    {
      title: 'Dynamic Route Example',
      subtitle: 'Navigate to user profile with ID',
      icon: User,
      action: () => router.push('/user/123' as any),
    },
    {
      title: 'Modal Example',
      subtitle: 'Open a modal screen',
      icon: Smartphone,
      action: () => router.push('/modal-example' as any),
    },
    {
      title: 'Navigation Guide',
      subtitle: 'View comprehensive navigation docs',
      icon: FileText,
      action: () => Alert.alert(
        'Navigation Guide',
        'Check the docs folder for EXPO_ROUTER_NAVIGATION_GUIDE.md to learn all navigation patterns!',
        [{ text: 'OK' }]
      ),
    },
  ];

  const renderMenuItem = (item: typeof navigationItems[0], index: number) => (
    <Pressable
      key={index}
      onPress={item.action}
      style={[
        {
          backgroundColor: cardColor,
          padding: 16,
          marginHorizontal: 16,
          marginVertical: 4,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        },
      ]}
      android_ripple={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.brand.light,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <item.icon color="white" size={20} />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: textColor,
              marginBottom: 2,
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: secondaryTextColor,
            }}
          >
            {item.subtitle}
          </Text>
        </View>
      </View>
      
      <ChevronRight
        color={secondaryTextColor}
        size={20}
      />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ padding: 16, paddingTop: 60 }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: textColor,
              marginBottom: 8,
            }}
          >
            Menu & Navigation
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: secondaryTextColor,
            }}
          >
            Explore different navigation patterns and app settings
          </Text>
        </View>

        {/* App Settings */}
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: textColor,
              marginBottom: 16,
            }}
          >
            App Settings
          </Text>
          
          <View
            style={{
              backgroundColor: cardColor,
              padding: 16,
              borderRadius: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 16, color: textColor, fontWeight: '500' }}>
              Theme
            </Text>
            <ThemeSwitcher />
          </View>
          
          <View
            style={{
              backgroundColor: cardColor,
              padding: 16,
              borderRadius: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 16, color: textColor, fontWeight: '500' }}>
              Font Size
            </Text>
            <FontSizeSwitch showLabel={false} variant="buttons" />
          </View>
        </View>

        {/* Navigation Examples */}
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: textColor,
              marginHorizontal: 16,
              marginBottom: 12,
            }}
          >
            Navigation Examples
          </Text>
          
          {navigationItems.map(renderMenuItem)}
        </View>

        {/* Demo Features */}
        <View style={{ marginTop: 32 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: textColor,
              marginHorizontal: 16,
              marginBottom: 12,
            }}
          >
            Demo Features
          </Text>
          
          {demoItems.map(renderMenuItem)}
        </View>

        {/* Quick Actions */}
        <View style={{ margin: 16, marginTop: 32 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: textColor,
              marginBottom: 16,
            }}
          >
            Quick Navigation Actions
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Pressable
              onPress={() => router.push('/user/456' as any)}
              style={{
                backgroundColor: Colors.button.primary.default,
                padding: 12,
                borderRadius: 8,
                flex: 1,
                minWidth: '45%',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>
                User Profile
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
                Dynamic Route
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                router.push('/settings/' as any);
                Alert.alert('Navigation', 'Pushed to settings stack!');
              }}
              style={{
                backgroundColor: Colors.button.secondary.default,
                padding: 12,
                borderRadius: 8,
                flex: 1,
                minWidth: '45%',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>
                Settings Stack
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
                Nested Navigation
              </Text>
            </Pressable>
          </View>
          
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
                Alert.alert('Navigation', 'Went back in navigation stack!');
              } else {
                Alert.alert('Navigation', 'Cannot go back - at root of stack');
              }
            }}
            style={{
              backgroundColor: Colors.button.warning.default,
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Go Back (if possible)
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
              Tests router.back() and router.canGoBack()
            </Text>
          </Pressable>
        </View>

        {/* Navigation Tips */}
        <View style={{ margin: 16, marginTop: 24 }}>
          <View
            style={{
              backgroundColor: cardColor,
              padding: 16,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: Colors.brand.light,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: textColor,
                marginBottom: 8,
              }}
            >
              💡 Navigation Tips
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: secondaryTextColor,
                lineHeight: 20,
              }}
            >
              • Use router.push() for forward navigation{'\n'}
              • Use router.back() to go to previous screen{'\n'}
              • Use router.replace() to replace current screen{'\n'}
              • File structure determines navigation hierarchy{'\n'}
              • (parentheses) create route groups without URL segments{'\n'}
              • Check docs/EXPO_ROUTER_NAVIGATION_GUIDE.md for full guide
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
