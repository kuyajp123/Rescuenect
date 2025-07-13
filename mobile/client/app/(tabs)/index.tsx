import { Body } from '@/components/ui/layout/Body';
import { useHighContrast } from '@/contexts/HighContrastContext';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MainHotlineAndContact } from '@/components/ui/HotlineAndContact/MainHotlineAndContact';

export const HomeScreen = () => {
  const { isDark } = useTheme();
  const { isHighContrast, toggleHighContrast } = useHighContrast();

  return (
    <Body>
      <View>
        <MainHotlineAndContact />
      </View>
    </Body>
  )
}

export default HomeScreen;

const styles = StyleSheet.create({})