import '@/components/components/ActionSheet/sheets';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { ServerWakeUpScreen } from '@/components/ui/loading/ServerWakeUpScreen';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import { FontSizeProvider, useFontSize } from '@/contexts/FontSizeContext';
import { HighContrastProvider } from '@/contexts/HighContrastContext';
import MapContext from '@/contexts/MapContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { storageHelpers } from '@/helper/storage';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { useAuthGate } from '@/hooks/useAuthGate';
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
import { useCoords } from '@/store/useCoords';
import { useSavedLocationsStore } from '@/store/useSavedLocationsStore';
import { useStatusFormStore } from '@/store/useStatusForm';
import { useWeatherStore } from '@/store/useWeatherStore';
import MapboxGL from '@rnmapbox/maps';
import axios from 'axios';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { HeroUINativeConfig, HeroUINativeProvider } from 'heroui-native';
import React, { useEffect, useState } from 'react';
import { LogBox, StyleSheet } from 'react-native';
import { SheetProvider } from 'react-native-actions-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API_TOKEN!);

LogBox.ignoreLogs([
  '`new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method.',
  '`new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method.',
]);

function RootNavigator() {
  const { isDark, isLoading: themeLoading } = useTheme();
  const { isLoading: fontLoading } = useFontSize();
  const { isBooting, canAccessApp, canAccessSetup, canAccessPublic } = useAuthGate();
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isServerReady, setIsServerReady] = useState(false);
  const authUser = useAuth(state => state.authUser);
  const userData = useUserData((state: any) => state.userData);

  useEffect(() => {
    const checkStorage = async () => {
      const getStorage = await storageHelpers.getData(STORAGE_KEYS.USER);
      console.log('Storage check on app load:', JSON.stringify(getStorage, null, 2));
    };
    checkStorage();
  }, [authUser]);

  useEffect(() => {
    console.log('Authenticated user on app load:', JSON.stringify(authUser, null, 2));
  }, [authUser]);

  useEffect(() => {
    console.log('User data on app load:', JSON.stringify(userData, null, 2));
  }, [userData]);

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

  if (!isMounted || !isReady || themeLoading || fontLoading || isBooting) {
    return null;
  }

  if (!isServerReady) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ServerWakeUpScreen onServerReady={() => setIsServerReady(true)} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={canAccessApp}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={canAccessSetup}>
          <Stack.Screen name="(setup)" />
        </Stack.Protected>
        <Stack.Protected guard={canAccessPublic}>
          <Stack.Screen name="(public)" />
        </Stack.Protected>
        <Stack.Screen name="(shared)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

const config: HeroUINativeConfig = {
  devInfo: {
    stylingPrinciples: false,
  },
  toast: {
    defaultProps: {
      variant: 'accent',
      placement: 'top',
      isSwipeable: true,
    },
    insets: {
      top: 80,
      bottom: 20,
      left: 20,
      right: 20,
    },
  },
};

function LayoutContent() {
  useAppBootstrap();
  useNetworkStatus();

  const authUser = useAuth(state => state.authUser);
  const { idToken } = useIdToken();
  const setFormData = useStatusFormStore(state => state.setFormData);
  const setCoords = useCoords(state => state.setCoords);
  const setActiveStatusCoords = useCoords(state => state.setActiveStatusCoords);
  const statusData = useStatusFetchBackgroundData(authUser ? authUser.uid : null, idToken);
  const userData = useUserData((state: any) => state.userData);
  const setUserData = useUserData((state: any) => state.setUserData);
  const setWeather = useWeatherStore(state => state.setWeather);
  const setSavedLocations = useSavedLocationsStore(state => state.setSavedLocations);
  useCurrentStatuses();

  useNotificationSubscriber({
    userLocation: userData?.barangay || undefined,
    userId: authUser?.uid || undefined,
    maxNotifications: 50,
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (userData?.barangay) {
      unsubscribe = subscribeToWeatherData(userData.barangay, weatherData => {
        setWeather?.(weatherData);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userData?.barangay, setWeather]);

  useEffect(() => {
    const formDataToSet = statusData ? { ...statusData, uid: authUser ? authUser.uid : '' } : null;

    setFormData(formDataToSet);
  }, [statusData, authUser, setFormData]);

  useEffect(() => {
    if (statusData?.lat != null && statusData?.lng != null) {
      setCoords([statusData.lng, statusData.lat]);
      setActiveStatusCoords(true);
    } else {
      setCoords(null);
      setActiveStatusCoords(false);
    }
  }, [statusData?.lat, statusData?.lng, setCoords, setActiveStatusCoords]);

  useEffect(() => {
    if (!authUser) return;

    FCMTokenService.updateUserFcmToken(authUser).catch(error => {
      console.error('Failed to register FCM token on login:', error);
    });

    const unsubscribeTokenRefresh = FCMTokenService.setupTokenRefreshListener(authUser, newToken => {
      const currentUserData = useUserData.getState().userData;
      setUserData({
        userData: {
          ...currentUserData,
          fcmToken: newToken,
        },
      });
    });

    return () => {
      unsubscribeTokenRefresh();
    };
  }, [authUser, setUserData]);

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
  }, [authUser, setSavedLocations]);

  return (
    <GestureHandlerRootView style={styles.gestureHandlerContainer}>
      <ThemeProvider>
        <FontSizeProvider>
          <HighContrastProvider>
            <HeroUINativeProvider config={config}>
              <SheetProvider>
                <MapContext>
                  <RootNavigator />
                </MapContext>
              </SheetProvider>
            </HeroUINativeProvider>
          </HighContrastProvider>
        </FontSizeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <LayoutContent />
    </GlobalErrorBoundary>
  );
}

const styles = StyleSheet.create({
  gestureHandlerContainer: {
    flex: 1,
  },
});
