import { Stack } from 'expo-router';
import React from 'react'

const _layout = () => {
  return (
      <Stack>
          <Stack.Screen
          name='createStatus'
          options={{
            headerShown: false,
            animation: 'none'
          }}
          />
      </Stack>
    )
}

export default _layout