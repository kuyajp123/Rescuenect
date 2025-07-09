import Body from '@/components/ui/Body';
import { DonnationPostTemplate } from '@/components/ui/post-template/DonnationPostTemplate';
import type { StatusTemplateProps } from '@/components/ui/post-template/StatusTemplate';
import { StatusTemplate } from '@/components/ui/post-template/StatusTemplate';
import React from 'react';
import { StyleSheet } from 'react-native';
import statusData from '../../data/statusData.json';

export default function DetailsScreen() {

  return (
    <Body gap={10} style={{ padding: 0, paddingVertical: 20 }}>
      {statusData.map((item: StatusTemplateProps, index: number) => (
      <DonnationPostTemplate key={index} {...item} />
      ))}
      {statusData.map((item: StatusTemplateProps, index: number) => (
      <StatusTemplate key={index} {...item} />
      ))}
    </Body>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: Colors.background.light,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
