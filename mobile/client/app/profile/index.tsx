import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Body from '@/components/ui/layout/Body';
import { Pen, Settings } from 'lucide-react-native';
import ThemeSwitcher from '@/hooks/ThemeSwitcher';

const index = () => {
  return (
    <Body>
      {/* <ThemeSwitcher /> */}
      <View style={styles.profile}></View>
      <View style={styles.buttons}></View>
      <View style={styles.lists}></View>
    </Body>
  );
}

export default index

const styles = StyleSheet.create({
  profile: {
    borderWidth: 1,
  },
  buttons: {
    borderWidth: 1,
  },
  lists: {
    borderWidth: 1,
  },
});