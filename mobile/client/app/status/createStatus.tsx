import { StyleSheet, } from 'react-native'
import { Text } from '@/components/ui/text'
import React from 'react'
import Body from '@/components/ui/layout/Body'
import { Button } from '@/components/ui/button/Button'
import { useRouter } from 'expo-router'

const createStatus = () => {
  const router = useRouter();

  return (
    <Body>
      <Text>createStatus</Text>
    </Body>
  )
}

export default createStatus

const styles = StyleSheet.create({})