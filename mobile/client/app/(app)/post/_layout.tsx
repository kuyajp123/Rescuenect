import { Stack } from 'expo-router'
import React from 'react'

export const _layout = () => {
  return (
    <Stack>
      <Stack.Screen
        name='status'
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='donation'
        options={{
          headerShown: false,
        }}
      />
      </Stack>
  )
}

export default _layout;