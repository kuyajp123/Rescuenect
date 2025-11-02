import RootLayoutContent from '@/components/components/_layout/RootLayout';
import '@/components/components/ActionSheet/sheets';
import { useAuth } from '@/components/store/useAuth';
import { useStatusFormStore } from '@/components/store/useStatusForm';
import { FontSizeProvider } from '@/contexts/FontSizeContext';
import { HighContrastProvider } from '@/contexts/HighContrastContext';
import MapContext from '@/contexts/MapContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useIdToken } from '@/hooks/useIdToken';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSaveStatusSettings } from '@/hooks/useSaveStatusSettings';
import { useStatusFetchBackgroundData } from '@/hooks/useStatusFetchBackgroundData';
import MapboxGL from '@rnmapbox/maps';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SheetProvider } from 'react-native-actions-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API_TOKEN!);

export default function RootLayout() {
  const authUser = useAuth(state => state.authUser);
  const { idToken } = useIdToken();
  const setFormData = useStatusFormStore(state => state.setFormData);
  const statusData = useStatusFetchBackgroundData(authUser ? authUser.uid : null, idToken);

  useNetworkStatus();

  useEffect(() => {
    // Create form data with proper defaults when statusData is null
    const formDataToSet = statusData ? { ...statusData, uid: authUser ? authUser.uid : '' } : null;

    setFormData(formDataToSet);
  }, [statusData, authUser, setFormData]);

  useSaveStatusSettings(statusData);

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
