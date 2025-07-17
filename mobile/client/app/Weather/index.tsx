import Body from '@/components/ui/layout/Body'
import React from 'react'
import { MainPage } from '@/components/ui/weather/MainPage'

export const index = () => {
  return (
    <Body style={{ padding: 0, paddingBottom: 0 }}>
      <MainPage />
    </Body>
  )
}

export default index