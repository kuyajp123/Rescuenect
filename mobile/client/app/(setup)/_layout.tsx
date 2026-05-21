import { Stack } from 'expo-router';
import React from 'react';

export default function SetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
    </Stack>
  );
}
