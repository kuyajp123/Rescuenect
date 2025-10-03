import { useTheme } from '@/contexts/ThemeContext';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { CustomRadio } from '@/components/ui/CustomRadio';
import type { ColorMode } from '@/contexts/ThemeContext';

const ThemeSwitcher = () => {
  const { setColorMode, colorMode, isDark } = useTheme();

  // Debug logging - remove this after testing
  useEffect(() => {
    console.log('ThemeSwitcher - colorMode:', colorMode, 'isDark:', isDark);
  }, [colorMode, isDark]);

  const options = [
    { label: 'Off', value: 'light' as ColorMode },
    { label: 'On', value: 'dark' as ColorMode },
    { label: 'System', value: 'system' as ColorMode },
  ];

  const handleThemeSelect = (value: string | number) => {
    setColorMode(value as ColorMode);
  };

  return (
    <View>
      {options.map(option => (
        <CustomRadio
          style={styles.radioGroup}
          key={option.value}
          label={option.label}
          value={option.value}
          selectedValue={colorMode}
          onSelect={handleThemeSelect}
          labelSize="sm"
          isDark={isDark}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  labelContainer: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    marginBottom: 4,
  },
  description: {
    opacity: 0.7,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    position: 'absolute',
  },
  radioGroup: {
    marginTop: 10,
  },
});

export default ThemeSwitcher;
