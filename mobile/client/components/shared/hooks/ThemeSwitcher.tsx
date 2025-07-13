import { ToggleButton } from '@/components/ui/button/Button';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const ThemeSwitcher = () => {
  const { colorMode, setColorMode, isDark } = useTheme();

  const toggleTheme = () => {
    setColorMode(isDark ? 'light' : 'dark');
  };

  return (
    <View>
      {/* <View style={styles.iconContainer}>
        {isDark ? <Moon size={16} color="#fff" /> : <Sun size={16} color="#333" />}
      </View> */}
      {/* <Switch
        value={isDark}
        onValueChange={toggleTheme}
        trackColor={{ false: '#767577', true: '#0ea5e9' }}
        thumbColor={isDark ? '#f4f3f4' : '#f4f3f4'}
        style={{ height: 24, width: 48 }}
      /> */}
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