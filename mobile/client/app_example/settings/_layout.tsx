import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsLayout() {
  const { isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
        },
        headerTintColor: isDark ? Colors.text.dark : Colors.text.light,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Settings',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          title: 'Notification Settings',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="privacy" 
        options={{ 
          title: 'Privacy Settings',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="about" 
        options={{ 
          title: 'About App',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}
