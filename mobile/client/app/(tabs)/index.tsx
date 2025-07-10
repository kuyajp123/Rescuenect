import Body from '@/components/ui/Body';
import React from 'react';
import { StyleSheet } from 'react-native';
import MainHotlineAndContact from "@/components/ui/hotline-and-contact/MainHotlineAndContact";

export default function HomeScreen () {

  return (
   <Body gap={10} >
      <MainHotlineAndContact />
    </Body>
  )
}

const styles = StyleSheet.create({
  
});