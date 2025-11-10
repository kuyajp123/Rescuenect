import { Stack } from 'expo-router'
import React from 'react'

export const _layout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          animation: 'none',
        }}
      />
      <Stack.Screen
        name="(saveLocation)/index"
        options={{
          headerShown: false,
          animation: 'none',
        }}
      />
    </Stack>
  );
}

export default _layout;