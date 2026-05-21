import { Stack } from 'expo-router';
import React from 'react';

export default function SharedAuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="about" />
      <Stack.Screen name="legal" />
    </Stack>
  );
}
