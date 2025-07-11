import { Stack } from 'expo-router'
import React from 'react'
import { StyleSheet } from 'react-native'

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

const styles = StyleSheet.create({})

export default _layout;