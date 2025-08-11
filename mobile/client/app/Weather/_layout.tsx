import React from 'react'
import { Stack } from 'expo-router';

const _layout = () => {
  return (
    <Stack>
        <Stack.Screen
        name='index'
        options={{
          headerShown: false,
          animation: 'none'
        }}
        />
    </Stack>
  )
}

export default _layout