import Body from '@/components/ui/layout/Body';
import React from 'react';
import { StyleSheet } from 'react-native';
import { MainHotlineAndContact } from '@/components/ui/HotlineAndContact/MainHotlineAndContact';

export const DetailsScreen = () => {

  return (
    <Body>
      <MainHotlineAndContact />
    </Body>
  );
}

const styles = StyleSheet.create({
});

export default DetailsScreen;
