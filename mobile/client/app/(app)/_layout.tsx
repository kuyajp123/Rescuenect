import { HeaderBackButton, IconButton } from '@/components/components/button/Button';
import Dialog from '@/components/ui/Dialog';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Stack, usePathname, useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

export default function AppLayout() {
  const { isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const NotificationButton = () => {
    return (
      <View style={{ position: 'relative' }}>
        <IconButton onPress={() => router.push('/notification' as any)} style={styles.notificationButton}>
          <Bell size={20} color={isDark ? Colors.text.dark : Colors.text.light} />
        </IconButton>
        {unreadCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 10,
              height: 10,
              borderRadius: 10,
              backgroundColor: 'red',
              borderWidth: 1,
              borderColor: 'gray',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          />
        )}
      </View>
    );
  };

  useEffect(() => {
    const handleHardwareBackPress = () => {
      const rootRoutes = ['/', '/(app)/(tabs)', '/(tabs)', '/index'];

      if (rootRoutes.includes(pathname) || pathname === '/') {
        setExitModalVisible(true);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleHardwareBackPress);

    return () => backHandler.remove();
  }, [pathname]);

  return (
    <>
      <Stack screenOptions={{ gestureEnabled: true }}>
        <Stack.Screen
          name="(tabs)"
          options={{
            title: 'Rescuenect',
            headerShown: true,
            animation: 'fade',
            animationDuration: 500,
            headerTintColor: isDark ? Colors.text.dark : Colors.brand.light,
            headerStyle: {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            },
            headerTitleStyle: {
              fontSize: 24,
              fontWeight: 'bold',
              color: isDark ? Colors.text.dark : Colors.brand.light,
            },
            headerShadowVisible: false,
            headerRight: () => (
              <View style={styles.headerRightContainer}>
                <NotificationButton />
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="notification"
          options={{
            headerShown: true,
            title: '',
            headerTintColor: isDark ? Colors.text.dark : Colors.text.light,
            headerStyle: {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            },
            headerTitleStyle: {
              fontSize: 24,
              fontWeight: 'bold',
              color: isDark ? Colors.text.dark : Colors.brand.light,
            },
            headerShadowVisible: false,
            headerLeft: () => <HeaderBackButton router={handleBack} />,
            animation: 'default',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="evacuation"
          options={{
            headerShown: false,
            title: '',
            headerTintColor: isDark ? Colors.text.dark : Colors.text.light,
            headerStyle: {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            },
            headerTitleStyle: {
              fontSize: 24,
              fontWeight: 'bold',
              color: isDark ? Colors.text.dark : Colors.brand.light,
            },
            headerShadowVisible: false,
            headerLeft: () => <HeaderBackButton router={handleBack} />,
            animation: 'none',
            animationDuration: 150,
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen
          name="post"
          options={{
            headerShown: true,
            title: '',
            headerStyle: {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            },
            headerShadowVisible: false,
            headerLeft: () => <HeaderBackButton router={handleBack} />,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: '',
            headerStyle: {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            },
            headerShadowVisible: false,
            headerLeft: () => <HeaderBackButton router={handleBack} />,
            animation: 'default',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="status"
          options={{
            headerShown: false,
            title: '',
            headerStyle: {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            },
            headerShadowVisible: false,
            headerLeft: () => <HeaderBackButton router={handleBack} />,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="Weather"
          options={{
            headerShown: false,
            title: '',
            headerStyle: {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            },
            headerShadowVisible: false,
            headerLeft: () => <HeaderBackButton router={handleBack} />,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: true,
            title: '',
            headerStyle: {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            },
            headerShadowVisible: false,
            headerLeft: () => <HeaderBackButton router={handleBack} />,
            animation: 'default',
            presentation: 'card',
          }}
        />
      </Stack>

      <Dialog
        modalVisible={exitModalVisible}
        size="full"
        onClose={() => setExitModalVisible(false)}
        primaryText="Exit App"
        secondaryText="Are you sure you want to exit Rescuenect?"
        primaryButtonText="Exit"
        secondaryButtonText="Cancel"
        primaryButtonOnPress={() => BackHandler.exitApp()}
        secondaryButtonOnPress={() => setExitModalVisible(false)}
        primaryButtonAction="error"
        primaryButtonVariant="solid"
        iconOnPress={() => setExitModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  notificationButton: {
    borderRadius: 50,
    padding: 8,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
