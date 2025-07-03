import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';


export type ColorMode = 'light' | 'dark' | 'system';

const ThemeSwitcher = () => {
  const { colorMode, setColorMode, isDark } = useTheme();

  const toggleTheme = () => {
    setColorMode(isDark ? 'light' : 'dark');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {isDark ? <Moon size={16} color="#fff" /> : <Sun size={16} color="#333" />}
      </View>
      <Switch
        value={isDark}
        onValueChange={toggleTheme}
        trackColor={{ false: '#767577', true: '#0ea5e9' }}
        thumbColor={isDark ? '#f4f3f4' : '#f4f3f4'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    padding: 4,
  },
});

export default ThemeSwitcher;