import { Stack } from 'expo-router'
import React from 'react'
import { StyleSheet } from 'react-native'

export default function _layout() {
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