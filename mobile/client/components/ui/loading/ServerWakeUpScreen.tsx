import { API_ROUTES } from '@/config/endpoints';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import axios from 'axios';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Network from 'expo-network';

interface ServerWakeUpScreenProps {
  onServerReady: () => void;
}

export const ServerWakeUpScreen: React.FC<ServerWakeUpScreenProps> = ({ onServerReady }) => {
  const { isDark } = useTheme();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkServerHealth = async () => {
      try {
        // If offline, bypass server check immediately
        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected || !networkState.isInternetReachable) {
          console.log('⚠️ Offline mode detected, bypassing server wake-up');
          if (isMounted) onServerReady();
          return;
        }

        // Use a shorter timeout for the health check so we retry faster if it hangs
        const response = await axios.get(API_ROUTES.SYSTEM.HEALTH, { timeout: 5000 });

        if (response.status === 200 && isMounted) {
          onServerReady();
        } else {
          throw new Error('Server not ready');
        }
      } catch (error) {
        if (!isMounted) return;

        setRetryCount(prev => prev + 1);
        // Retry every 2 seconds
        timeoutId = setTimeout(checkServerHealth, 2000);
      }
    };

    checkServerHealth();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onServerReady]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}
    >
      <View style={styles.content}>
        <Image
          source={
            isDark
              ? require('../../../assets/images/logo/splash-icon-light.png')
              : require('../../../assets/images/logo/splash-icon-dark.png')
          }
          style={styles.logo}
          contentFit="contain"
          transition={500}
        />

        <View style={styles.statusContainer}>
          <Text style={[styles.title, { color: isDark ? Colors.text.dark : Colors.text.light }]}>Rescuenect</Text>
          <Text style={[styles.subtitle, { color: isDark ? Colors.muted.dark.text : Colors.muted.light.text }]}>
            Preparing data… please wait a moment.
          </Text>
          <ActivityIndicator size="large" color={Colors.brand.light} />
          {retryCount > 2 && (
            <Text style={[styles.hint, { color: isDark ? Colors.muted.dark.text : Colors.muted.light.text }]}>
              (Attempt {retryCount})
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'Poppins-light',
  },
});
