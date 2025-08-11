import { FontSizeSwitch } from '@/components/shared/hooks/FontSizeSwitch'
import { Body } from '@/components/ui/layout/Body'
import { Text } from '@/components/ui/text'
import React from 'react'
import { StyleSheet, } from 'react-native'

export const FontSize = () => {
  return (
    <Body style={styles.body}>
      <Text size='3xl' bold style={styles.title}>
        Font Size
      </Text>
      <FontSizeSwitch />
    </Body>
  )
}

export default FontSize

const styles = StyleSheet.create({
  body: { marginBottom: 30 },
  title: { marginBottom: 20 }
})