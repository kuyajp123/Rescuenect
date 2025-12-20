import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { storageHelpers } from '@/helper/storage';
import { STORAGE_KEYS } from '@/config/asyncStorage';

export type ColorMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  isDark: boolean;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children?: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme();
  const [colorMode, setColorModeState] = useState<ColorMode>('system');
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkState, setIsDarkState] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Load theme from AsyncStorage on mount
  useEffect(() => {
    let isMounted = true;
    const loadTheme = async () => {
      try {
        const savedTheme = await storageHelpers.getField(STORAGE_KEYS.USER_SETTINGS, 'theme_preference');
        if (isMounted && savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setColorModeState(savedTheme as ColorMode);
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save theme to AsyncStorage when it changes
  const setColorMode = async (mode: ColorMode) => {
    try {
      setColorModeState(mode);
      await storageHelpers.setField(STORAGE_KEYS.USER_SETTINGS, 'theme_preference', mode);

      // Force a re-check of system theme when switching to system mode
      if (mode === 'system') {
        setForceUpdate(prev => prev + 1);
      }
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  // Update isDark state whenever colorMode or systemColorScheme changes
  useEffect(() => {
    // Get the actual current system color scheme
    const currentSystemScheme = Appearance.getColorScheme();
    const effectiveSystemScheme = currentSystemScheme || systemColorScheme;

    const newIsDark = colorMode === 'dark' || (colorMode === 'system' && effectiveSystemScheme === 'dark');
    setIsDarkState(newIsDark);
  }, [colorMode, forceUpdate]);

  const value = {
    colorMode,
    setColorMode,
    isDark: isDarkState,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
