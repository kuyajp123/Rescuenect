import { ToggleButton } from '@/components/ui/button/Button';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useHighContrast } from '@/contexts/HighContrastContext';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export const HighContrastOption = () => {
  const { isDark } = useTheme();
  const { isHighContrast, toggleHighContrast } = useHighContrast();

  return (
      <ToggleButton 
        isEnabled={isHighContrast}
        onToggle={toggleHighContrast}
      />
  );
};

export default HighContrastOption;

const styles = StyleSheet.create({});