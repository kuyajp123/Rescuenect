import Body from '@/components/ui/layout/Body'
import React from 'react'
import { StyleSheet } from 'react-native'
import { MainPage } from '@/components/ui/weather/MainPage'

export const index = () => {
  return (
    <Body style={styles.container}>
      <MainPage />
    </Body>
  )
}

const styles = StyleSheet.create({
  container: { padding: 0, paddingBottom: 0 }
});

export default index