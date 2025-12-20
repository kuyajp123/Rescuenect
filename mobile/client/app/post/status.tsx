import Body from '@/components/ui/layout/Body'
import { StatusList } from '@/components/components/PostTemplate'
import React from 'react'
import { useStatusStore } from '@/store/useCurrentStatusStore';

export const status = () => {
  const { statusData } = useStatusStore();

  return (
    <Body gap={10} style={{ padding: 0, paddingVertical: 20 }}>
      <StatusList statusUpdates={statusData} />
    </Body>
  )
}

export default status;