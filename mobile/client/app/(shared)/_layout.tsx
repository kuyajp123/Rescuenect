import { Stack } from 'expo-router';
import React from 'react';

export default function SharedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
    </Stack>
  );
}
