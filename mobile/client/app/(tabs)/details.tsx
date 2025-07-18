import { MainHotlineAndContact } from '@/components/ui/HotlineAndContact/MainHotlineAndContact';
import Body from '@/components/ui/layout/Body';
import React from 'react';
import { StyleSheet } from 'react-native';

export const DetailsScreen = () => {

  return (
    <Body>
      <MainHotlineAndContact />
      
    </Body>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 50,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
});

export default DetailsScreen;
