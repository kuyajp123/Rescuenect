import { StyleSheet } from 'react-native'
import React from 'react'
import Body from '@/components/ui/Body';
import { Text } from '@/components/ui/text'
import { Card } from '@/components/ui/Card';

const community = () => {
  return (
    <Body>
      <Card>
        <Text>Welcome to the Community Screen!</Text>
      </Card>
      <Card>
        <Text>Here you can find various community resources and discussions.</Text>
      </Card>
      <Card>
        <Text>Feel free to explore and engage with the community!</Text>
      </Card>
    </Body>
  )
}

export default community

const styles = StyleSheet.create({})