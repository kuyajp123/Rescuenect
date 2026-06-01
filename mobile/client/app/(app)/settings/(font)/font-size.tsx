import { FontSizeSwitch } from '@/hooks/FontSizeSwitch'
import { Body } from '@/components/ui/layout/Body'
import { Text } from '@/components/ui/text'
import React from 'react'
import { StyleSheet, } from 'react-native'

export const FontSize = () => {
  return (
    <Body>
      <Text size='3xl' bold style={styles.title}>
        Font Size
      </Text>
      <FontSizeSwitch />
    </Body>
  )
}

export default FontSize

const styles = StyleSheet.create({
  title: { marginBottom: 20 }
})