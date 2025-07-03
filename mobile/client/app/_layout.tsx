import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { Colors } from '@/constants/Colors';
import { FontSizeProvider } from '@/contexts/FontSizeContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

// Inner component that uses the theme context
function RootLayoutContent() {
  const { isDark } = useTheme();

  const [loaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
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
                <Bell size={20} color={ '#8E8E93' } />
              </View>
            ),
          }} 
        />
        <Stack.Screen name="+not-found" />
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
