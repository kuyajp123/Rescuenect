import { Stack } from 'expo-router'
import React from 'react'

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
        name="(font)/font-size"
        options={{
          headerShown: false,
          animation: 'default',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="(darkMode)/darkMode"
        options={{
          headerShown: false,
          animation: 'default',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="(map)/mapSettings"
        options={{
          headerShown: false,
          animation: 'default',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}

export default _layout;