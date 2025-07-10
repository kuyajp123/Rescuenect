import Body from '@/components/ui/Body';
import { ListOfEvents } from '@/components/ui/volunteer-events/ListOfEvents';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function HomeScreen () {

  return (
   <Body gap={10} >
      <ListOfEvents />
    </Body>
  )
}

const styles = StyleSheet.create({
  
});