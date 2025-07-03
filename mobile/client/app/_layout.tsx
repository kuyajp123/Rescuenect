import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { Bell } from 'lucide-react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import '../global.css';
import { Colors } from '@/constants/Colors';

export default function RootLayout() {

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GluestackUIProvider mode="light">
      <Stack>
        <Stack.Screen 
          name="(tabs)" 
          options={{
        title: 'RescueNect', 
        headerShown: true, 
        headerTintColor: Colors.brand.light,
        headerStyle: { backgroundColor: Colors.background.light },
        headerTitleStyle: { fontSize: 24, fontWeight: 'bold' },
        headerShadowVisible: false,
        headerRight: () => <Bell size={20} />,
          }} 
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GluestackUIProvider>
  );
}
