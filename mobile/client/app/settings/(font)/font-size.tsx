import { FontSizeSwitch } from '@/components/shared/hooks/FontSizeSwitch'
import { Body } from '@/components/ui/layout/Body'
import { Text } from '@/components/ui/text'
import React from 'react'
import { StyleSheet, } from 'react-native'

export const FontSize = () => {
  return (
    <Body style={{ marginBottom: 30 }}>
      <Text size='3xl' bold style={{ marginBottom: 20 }}>Font Size</Text>
      <FontSizeSwitch />
    </Body>
  )
}

export default FontSize

const styles = StyleSheet.create({})