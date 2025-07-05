import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { Colors } from '@/constants/Colors';
import { FontSizeProvider, useFontSize } from '@/contexts/FontSizeContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

// Inner component that uses the theme context
function RootLayoutContent() {
  const { isDark, isLoading: themeLoading } = useTheme();
  const { isLoading: fontLoading } = useFontSize();
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [loaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-light': require('../assets/fonts/Poppins-Light.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
  });

  // Mark component as mounted
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Use useEffect to manage readiness state
  useEffect(() => {
    if (!isMounted) return; // Don't update state if not mounted
    
    // Add a small delay to ensure all contexts are fully initialized
    const timer = setTimeout(() => {
      if (loaded && !themeLoading && !fontLoading) {
        setIsReady(true);
      }
    }, 100); // Increased delay slightly

    return () => clearTimeout(timer);
  }, [loaded, themeLoading, fontLoading, isMounted]);

  // Wait for everything to be ready before rendering
  if (!isReady || !isMounted) {
    return null;
  }

  return (
    <GluestackUIProvider mode={isDark ? 'dark' : 'light'}>
      <Stack>
        <Stack.Screen 
          name="(tabs)" 
          options={{
            title: 'RescueNect', 
            headerShown: true, 
            headerTintColor: isDark ? Colors.text.dark : Colors.brand.light,
            headerStyle: { 
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            },
            headerTitleStyle: { 
              fontSize: 24, 
              fontWeight: 'bold',
              color: isDark ? Colors.text.dark : Colors.brand.light 
            },
            headerShadowVisible: false,
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Bell size={20} color={isDark ? Colors.text.dark : Colors.text.light} />
              </View>
            ),
          }} 
        />
        <Stack.Screen name="+not-found" />
        <Stack.Screen 
          name="modal-example" 
          options={{ 
            presentation: 'modal',
            headerShown: false,
            title: 'Modal Example'
          }} 
        />
        <Stack.Screen 
          name="user/[id]" 
          options={{ 
            headerShown: false,
            title: 'User Profile'
          }} 
        />
      </Stack>
    </GluestackUIProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <FontSizeProvider>
        <RootLayoutContent />
      </FontSizeProvider>
    </ThemeProvider>
  );
}
