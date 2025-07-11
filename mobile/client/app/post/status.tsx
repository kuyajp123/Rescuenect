import Body from '@/components/ui/Body'
import { StatusList } from '@/components/ui/post-template'
import React from 'react'
import { StyleSheet } from 'react-native'
import statusData from '../../data/statusData.json'

export default function status() {
  return (
    <Body gap={10} style={{ padding: 0, paddingVertical: 20 }}>
      <StatusList statusUpdates={statusData} />
    </Body>
  )
}

const styles = StyleSheet.create({})