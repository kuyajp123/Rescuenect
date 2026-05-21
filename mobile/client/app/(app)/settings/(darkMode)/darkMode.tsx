import { StyleSheet } from 'react-native';
import React from 'react';
import ThemeSwitcher from '@/hooks/ThemeSwitcher';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';

const darkMode = () => {
  return (
    <Body>
      <Text size="3xl" bold>
        Dark Mode
      </Text>
      <ThemeSwitcher />
    </Body>
  );
};

export default darkMode;

const styles = StyleSheet.create({});
