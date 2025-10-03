import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CustomRadio } from '@/components/ui/CustomRadio';
import type { ColorMode } from '@/contexts/ThemeContext';
import { Text } from '@/components/ui/text';

const ThemeSwitcher = () => {
  const { setColorMode, isDark, colorMode } = useTheme();

  const options = [
    { label: 'On', value: 'dark' as ColorMode },
    { label: 'Off', value: 'light' as ColorMode },
    { label: 'System', value: 'system' as ColorMode },
  ];

  const handleSelect = (value: string | number) => {
    setColorMode(value as ColorMode);
  };

  return (
    <View>
      {options.map(option => (
        <CustomRadio
          key={option.value}
          style={styles.radioButton}
          label={option.label}
          value={option.value}
          selectedValue={colorMode}
          onSelect={handleSelect}
          isDark={isDark}
        />
      ))}
      {colorMode === 'system' && (
        <Text emphasis="light" size="xs" style={{ marginTop: 4 }}>
          Please restart the app to apply the System theme mode.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  radioButton: {
    marginVertical: 8,
  },
});

export default ThemeSwitcher;
