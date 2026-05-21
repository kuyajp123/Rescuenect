import { DonationList } from '@/components/components/data-display/DonationList'
import Body from '@/components/ui/layout/Body'
import statusData from '@/data/statusData.json'
import React from 'react'

export const status = () => {
  return (
    <Body gap={10} style={{ padding: 0, paddingVertical: 20 }}>
      <DonationList donations={statusData} />
    </Body>
  )
}

export default status;