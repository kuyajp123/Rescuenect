import { HeaderBackButton } from '@/components/components/button/Button';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, useRouter } from 'expo-router';
import React from 'react';

const DangerZoneLayout = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name="create"
        options={{
          headerShown: true,
          title: 'Report Danger Zone',
          headerStyle: {
            backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
          },
          headerTitleStyle: {
            color: isDark ? Colors.text.dark : Colors.text.light,
          },
          headerShadowVisible: false,
          headerLeft: () => <HeaderBackButton router={() => router.back()} />,
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
};

export default DangerZoneLayout;
