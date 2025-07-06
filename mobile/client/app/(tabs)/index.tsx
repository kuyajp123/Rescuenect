import Body from '@/components/ui/Body';
import type { StatusTemplateProps } from '@/components/ui/post-template/StatusTemplate';
import { StatusTemplate } from '@/components/ui/post-template/StatusTemplate';
import React from 'react';
import statusData from '../../data/statusData.json';

export default function HomeScreen () {
  return (
    <Body gap={10} style={{ padding: 0, paddingVertical: 20 }}>
      {statusData.map((item: StatusTemplateProps, index: number) => (
      <StatusTemplate key={index} {...item} />
      ))}
    </Body>
  )
}