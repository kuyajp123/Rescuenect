import { MainHotlineAndContact } from '@/components/ui/HotlineAndContact/MainHotlineAndContact';
import Body from '@/components/ui/layout/Body';
import React from 'react';
import { StyleSheet } from 'react-native';

export const HomeScreen = () => {

  return (
   <Body gap={10} >
      <MainHotlineAndContact />
    </Body>
  )
}

const styles = StyleSheet.create({
  
});

export default HomeScreen;