import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { HeaderBackButton } from '@/components/components/button/Button';

const _layout = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <Stack>
      <Stack.Screen
        name="createStatus"
        options={{
          headerShown: false,
          animation: 'none',
        }}
      />
      <Stack.Screen
        name="(settings)/statusSettings"
        options={{
          headerShown: true,
          title: '',
          headerStyle: {
            backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
          },
          headerShadowVisible: false,
          headerLeft: () => <HeaderBackButton router={handleBack} />,
          animation: 'slide_from_right',
          animationDuration: 100,
        }}
      />
      <Stack.Screen
        name="cityNeeds"
        options={{
          headerShown: false,
          animation: 'none',
        }}
      />
    </Stack>
  );
};

export default _layout;
