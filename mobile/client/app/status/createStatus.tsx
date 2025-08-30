import { HoveredButton } from '@/components/components/button/Button';
import Map from '@/components/components/Map';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const createStatus = () => {
  const insets = useSafeAreaInsets();
  const [isMapReady, setIsMapReady] = useState(false);
  const { isDark } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Body style={[
      styles.container,
      {
        paddingTop: insets.top,
        paddingBottom: 0,
      }
      ]}>
      {isMapReady && (
        <Map />
      )}

    </Body>
  );
}

export default createStatus

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 0 
  },
  map: { 
    flex: 1 
  },
});