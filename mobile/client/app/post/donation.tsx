import { DonationList } from '@/components/ui/data-display/DonationList'
import Body from '@/components/ui/layout/Body'
import React from 'react'
import { StyleSheet } from 'react-native'
import statusData from '../../data/statusData.json'

export const status = () => {
  return (
    <Body gap={10} style={{ padding: 0, paddingVertical: 20 }}>
      <DonationList donations={statusData} />
    </Body>
  )
}

const styles = StyleSheet.create({})

export default status;