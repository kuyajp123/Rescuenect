import { Stack } from 'expo-router'
import React from 'react'
import { StyleSheet } from 'react-native'

export const _layout = () => {
  return (
    <Stack>
        <Stack.Screen
        name='index'
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='(font)/font-size'
        options={{
          headerShown: false,
          animation: 'none',
        }}
      />
      </Stack>
  )
}

const styles = StyleSheet.create({})

export default _layout;