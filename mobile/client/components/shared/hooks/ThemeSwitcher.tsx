import { ToggleButton } from '@/components/ui/button/Button';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const ThemeSwitcher = () => {
  const { setColorMode, isDark } = useTheme();

  const toggleTheme = () => {
    setColorMode(isDark ? 'light' : 'dark');
  };

  return (
    <View>
      <ToggleButton 
        isEnabled={isDark}
        onToggle={toggleTheme}
      />
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
});

export default ThemeSwitcher;