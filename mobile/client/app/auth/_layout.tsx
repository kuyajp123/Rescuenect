import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import React from 'react';

export const _layout = () => {
  const { isDark } = useTheme();
  return (
    <GluestackUIProvider mode={isDark ? 'dark' : 'light'}>
      <Stack>
        <Stack.Screen
          name="signIn"
          options={{
            headerShown: false,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="nameAndContactForm"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 150,
          }}
        />
        <Stack.Screen
          name="barangayForm"
          options={{
            headerShown: false,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="setupComplete"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
      </Stack>
    </GluestackUIProvider>
  );
};

export default _layout;
