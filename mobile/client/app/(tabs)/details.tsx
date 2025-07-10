import Body from '@/components/ui/Body';
import { DonationList } from '@/components/ui/post-template/DonationList';
import { StatusList } from '@/components/ui/post-template/StatusList';
import React from 'react';
import { StyleSheet } from 'react-native';
import statusData from '../../data/statusData.json';
statusData
StatusList
DonationList

export default function DetailsScreen() {

  return (
    <Body gap={10} style={{ padding: 0, paddingVertical: 20 }}>

      {/* <StatusList statusUpdates={statusData} /> */}
      {/* <DonationList donations={statusData} /> */}
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
