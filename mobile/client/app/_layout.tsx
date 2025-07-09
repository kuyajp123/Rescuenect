import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { Colors } from '@/constants/Colors';
import { FontSizeProvider, useFontSize } from '@/contexts/FontSizeContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

// Inner component that uses the theme context
function RootLayoutContent() {
  const { isDark, isLoading: themeLoading } = useTheme();
  const { isLoading: fontLoading } = useFontSize();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [loaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-light': require('../assets/fonts/Poppins-Light.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
  });

  // Mark component as mounted and prevent state updates after unmount
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Use useEffect to manage readiness state safely
  useEffect(() => {
    if (!isMounted) return; // Prevent state updates if not mounted
    
    // Use a longer delay to ensure all async operations complete
    const timer = setTimeout(() => {
      if (isMounted && loaded && !themeLoading && !fontLoading) {
        setIsReady(true);
      }
    }, 200); // Increased delay to prevent race conditions

    return () => clearTimeout(timer);
  }, [loaded, themeLoading, fontLoading, isMounted]);

  // Don't render anything until everything is ready and mounted
  if (!isMounted || !isReady || themeLoading || fontLoading) {
    return null;
  }

  // Ensure we have a stable mode value for GluestackUIProvider
  const gluestackMode = isDark ? 'dark' : 'light';

  return (
    <GluestackUIProvider mode={gluestackMode}>
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
                <Pressable onPress={() => { router.push('/notification'); }}>
                  <Bell size={24} color={isDark ? Colors.text.dark : Colors.text.light} />
                </Pressable>
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
            headerLeft: () => (
              <Pressable onPress={() => { router.back(); }}>
                <ChevronLeft size={24} color={isDark ? Colors.text.dark : Colors.text.light} />
              </Pressable>
            ),
            animation: 'slide_from_right',
            animationDuration: 150,
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GluestackUIProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <FontSizeProvider>
          <RootLayoutContent />
        </FontSizeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
