import { IconButton } from '@/components/ui/button/Button';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { Colors } from '@/constants/Colors';
import { useFontSize } from '@/contexts/FontSizeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

function RootLayoutContent() {
  const { isDark, isLoading: themeLoading } = useTheme();
  const { isLoading: fontLoading } = useFontSize();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Enhanced back button component
  const BackButton = () => {
    return (
      <IconButton 
        onPress={() => router.back()}
      >
        <ChevronLeft size={24} color={isDark ? Colors.text.dark : Colors.text.light} />
      </IconButton>
    );
  };

  // Enhanced notification button component
  const NotificationButton = () => {
    return (
      <IconButton 
        onPress={() => router.push('/notification')}
      >
        <Bell size={20} color={isDark ? Colors.text.dark : Colors.text.light} />
      </IconButton>
    );
  };

  const [loaded] = useFonts({
    Poppins: require('../../../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../../../../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-light': require('../../../../assets/fonts/Poppins-Light.ttf'),
    'Poppins-Medium': require('../../../../assets/fonts/Poppins-Medium.ttf'),
  });

  // Mark component as mounted and prevent state updates after unmount
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

  if (!isMounted || !isReady || themeLoading || fontLoading) {
    return null;
  }

  const gluestackMode = isDark ? 'dark' : 'light';

  return (
    <GluestackUIProvider mode={gluestackMode}>
      <Stack 
        screenOptions={{
          gestureEnabled: true,
          animation: 'slide_from_right',
          animationDuration: 150,
        }}
      >
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
            headerLeft: () => <BackButton />,
            animation: 'slide_from_right',
            animationDuration: 150,
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen
          name='post'
          options={{
            headerShown: true,
            title: '',
            headerStyle: {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            },
            headerShadowVisible: false,
            headerLeft: () => <BackButton />,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name='settings'
          options={{
            headerShown: true,
            title: '',
            headerStyle: {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            },
            headerShadowVisible: false,
            headerLeft: () => <BackButton />,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name='status'
          options={{
            headerShown: true,
            title: '',
            headerStyle: {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            },
            headerShadowVisible: false,
            headerLeft: () => <BackButton />,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name='Weather'
          options={{
            headerShown: false,
            title: '',
            headerStyle: {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            },
            headerShadowVisible: false,
            headerLeft: () => <BackButton />,
            animation: 'none',
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GluestackUIProvider>
  );
}

export default RootLayoutContent

const styles = StyleSheet.create({
  backButton: {
    width: 'auto',
    borderRadius: 50,
    padding: 8,
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
  gestureHandlerContainer: {
    flex: 1,
  },
});