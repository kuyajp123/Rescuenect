import { Stack } from 'expo-router';
import React from 'react';

export default function PublicAuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="signIn"
        options={{
          headerShown: false,
          animation: 'none',
        }}
      />
    </Stack>
  );
}
