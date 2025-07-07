import Body from '@/components/ui/Body';
import { DonnationPostTemplate } from '@/components/ui/post-template/DonnationPostTemplate';
import { StatusTemplate } from '@/components/ui/post-template/StatusTemplate';
import type { StatusTemplateProps } from '@/components/ui/post-template/StatusTemplate';
import React from 'react';
import { StyleSheet } from 'react-native';
import statusData from '../../data/statusData.json';

const community = () => {
  return (
    <Body gap={10} style={{ padding: 0, paddingVertical: 20 }}>
      {statusData.map((item: StatusTemplateProps, index: number) => (
      <DonnationPostTemplate key={index} {...item} />
      ))}
      {statusData.map((item: StatusTemplateProps, index: number) => (
      <StatusTemplate key={index} {...item} />
      ))}

    </Body>
  )
}

export default community

const styles = StyleSheet.create({})