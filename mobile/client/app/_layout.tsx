import '@/components/components/ActionSheet/sheets';
import { HeaderBackButton, IconButton } from '@/components/components/button/Button';
import Modal from '@/components/components/Modal';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import { Colors } from '@/constants/Colors';
import { FontSizeProvider, useFontSize } from '@/contexts/FontSizeContext';
import { HighContrastProvider } from '@/contexts/HighContrastContext';
import MapContext from '@/contexts/MapContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { storageHelpers } from '@/helper/storage';
import { useIdToken } from '@/hooks/useIdToken';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useNotificationSubscriber } from '@/hooks/useNotificationSubscriber';
import { useSaveStatusSettings } from '@/hooks/useSaveStatusSettings';
import { useStatusFetchBackgroundData } from '@/hooks/useStatusFetchBackgroundData';
import { useCurrentStatuses } from '@/hooks/useStatusSubscriber';
import { subscribeToWeatherData } from '@/hooks/useWeatherData';
import { FCMTokenService } from '@/services/fcmTokenService';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useSavedLocationsStore } from '@/store/useSavedLocationsStore';
import { useStatusFormStore } from '@/store/useStatusForm';
import { useWeatherStore } from '@/store/useWeatherStore';
import MapboxGL from '@rnmapbox/maps';
import axios from 'axios';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { SheetProvider } from 'react-native-actions-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API_TOKEN!);

function RootLayoutNav() {
  const { isDark, isLoading: themeLoading } = useTheme();
  const { isLoading: fontLoading } = useFontSize();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
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

  const [loaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-light': require('../assets/fonts/Poppins-Light.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
  });

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => {
      if (isMounted && loaded && !themeLoading && !fontLoading) {
        setIsReady(true);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [loaded, themeLoading, fontLoading, isMounted]);

  // Handle hardware back button for exit confirmation
  useEffect(() => {
    const handleHardwareBackPress = () => {
      // List of routes where back button should trigger exit modal
      const rootRoutes = ['/', '/(tabs)', '/index'];

      if (rootRoutes.includes(pathname) || pathname === '/') {
        setExitModalVisible(true);
        return true; // Prevent default behavior
      }
      return false; // Let default behavior happen (pop stack)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleHardwareBackPress);

    return () => backHandler.remove();
  }, [pathname]);

  if (!isMounted || !isReady || themeLoading || fontLoading) {
    return null;
  }

  return (
    <GluestackUIProvider mode={isDark ? 'dark' : 'light'}>
      <Stack screenOptions={{ gestureEnabled: true }}>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
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
          name="auth"
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
        <Stack.Screen name="+not-found" />
      </Stack>

      {/* Exit Confirmation Modal */}
      <Modal
        modalVisible={exitModalVisible}
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
    </GluestackUIProvider>
  );
}

export default function RootLayout() {
  useNetworkStatus();
  const authUser = useAuth(state => state.authUser);
  const { idToken } = useIdToken();
  const setFormData = useStatusFormStore(state => state.setFormData);
  const statusData = useStatusFetchBackgroundData(authUser ? authUser.uid : null, idToken);
  const userData = useUserData((state: any) => state.userData);
  const setUserData = useUserData((state: any) => state.setUserData);
  const setWeather = useWeatherStore(state => state.setWeather);
  const setSavedLocations = useSavedLocationsStore(state => state.setSavedLocations);
  useCurrentStatuses();

  // Subscribe to notifications with user location for filtering
  useNotificationSubscriber({
    userLocation: userData?.barangay || undefined,
    userId: authUser?.uid || undefined,
    maxNotifications: 50,
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (
      userData.barangay !== '' &&
      userData.barangay !== undefined &&
      userData !== '' &&
      userData.barangay !== undefined
    ) {
      unsubscribe = subscribeToWeatherData(userData.barangay, weatherData => {
        setWeather?.(weatherData);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userData.barangay]);

  useEffect(() => {
    const formDataToSet = statusData ? { ...statusData, uid: authUser ? authUser.uid : '' } : null;

    setFormData(formDataToSet);
  }, [statusData, authUser, setFormData]);

  // FCM Token Management - Register on login, refresh, and cleanup on logout
  useEffect(() => {
    if (!authUser) return;

    // Register FCM token when user logs in
    FCMTokenService.updateUserFcmToken(authUser).catch(error => {
      console.error('Failed to register FCM token on login:', error);
    });

    // Setup token refresh listener
    const unsubscribeTokenRefresh = FCMTokenService.setupTokenRefreshListener(authUser, newToken => {
      // Update local state with new token
      setUserData((prev: any) => ({
        userData: {
          ...prev.userData,
          fcmToken: newToken,
        },
      }));
    });

    return () => {
      // Cleanup token refresh listener
      unsubscribeTokenRefresh();
    };
  }, [authUser]);

  useSaveStatusSettings(statusData);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!authUser) return;

      try {
        const params = { uid: authUser.uid };
        const idToken = await authUser.getIdToken();
        const response = await axios.get(API_ROUTES.DATA.GET_LOCATIONS, {
          params,
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (response.status === 200 && response.data.savedLocations.length > 0) {
          await storageHelpers.setData(STORAGE_KEYS.SAVED_LOCATIONS, response.data.savedLocations);
          setSavedLocations(response.data.savedLocations);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, [authUser]);

  return (
    <GestureHandlerRootView style={styles.gestureHandlerContainer}>
      <ThemeProvider>
        <FontSizeProvider>
          <HighContrastProvider>
            <SheetProvider>
              <MapContext>
                <RootLayoutNav />
              </MapContext>
            </SheetProvider>
          </HighContrastProvider>
        </FontSizeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureHandlerContainer: {
    flex: 1,
  },
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
