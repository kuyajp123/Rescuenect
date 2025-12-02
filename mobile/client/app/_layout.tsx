import RootLayoutContent from '@/components/components/_layout/RootLayout';
import '@/components/components/ActionSheet/sheets';
import { storageHelpers, updateTokenInDatabase } from '@/components/helper';
import { useAuth } from '@/components/store/useAuth';
import { useUserData } from '@/components/store/useBackendResponse';
import { useSavedLocationsStore } from '@/components/store/useSavedLocationsStore';
import { useStatusFormStore } from '@/components/store/useStatusForm';
import { useWeatherStore } from '@/components/store/useWeatherStore';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import { FontSizeProvider } from '@/contexts/FontSizeContext';
import { HighContrastProvider } from '@/contexts/HighContrastContext';
import MapContext from '@/contexts/MapContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useIdToken } from '@/hooks/useIdToken';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSaveStatusSettings } from '@/hooks/useSaveStatusSettings';
import { useStatusFetchBackgroundData } from '@/hooks/useStatusFetchBackgroundData';
import { subscribeToWeatherData } from '@/hooks/useWeatherData';
import { messaging } from '@/lib/firebaseConfig';
import { onTokenRefresh } from '@react-native-firebase/messaging';
import MapboxGL from '@rnmapbox/maps';
import axios from 'axios';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SheetProvider } from 'react-native-actions-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';
import { useEarthquakeListener } from '@/hooks/useEarthquakeListener';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API_TOKEN!);

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
  useEarthquakeListener();

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

  useEffect(() => {
    if (!authUser) return;

    let unsubscribeTokenRefresh: () => void = () => {};

    unsubscribeTokenRefresh = onTokenRefresh(messaging, (token: string) => {
      console.log('🔄 FCM Token refreshed:', token);

      setUserData((prev: any) => ({
        userData: {
          ...prev.userData,
          fcmToken: token,
        },
      }));

      updateTokenInDatabase(authUser, token);
    });

    return () => {
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
                <RootLayoutContent />
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
});
