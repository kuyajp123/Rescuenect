import { Stack } from 'expo-router';
import React from 'react';

export default function SetupAuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="barangayForm"
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
        name="setupComplete"
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
