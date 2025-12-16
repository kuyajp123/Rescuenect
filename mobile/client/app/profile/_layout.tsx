import { Stack } from 'expo-router';
import React from 'react';

export const _layout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          animation: 'default',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="(saveLocation)/index"
        options={{
          headerShown: false,
          animation: 'default',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="profileDetails"
        options={{
          headerShown: false,
          animation: 'default',
          presentation: 'card',
        }}
      />
    </Stack>
  );
};

export default _layout;
