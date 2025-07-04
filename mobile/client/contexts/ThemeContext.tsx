import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ColorMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    colorMode: ColorMode;
    setColorMode: (mode: ColorMode) => void;
    isDark: boolean;
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: React.ReactNode;
}

const THEME_STORAGE_KEY = '@theme_preference';

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const systemColorScheme = useColorScheme();
    const [colorMode, setColorModeState] = useState<ColorMode>('system');
    const [isLoading, setIsLoading] = useState(true);

    // Load theme from AsyncStorage on mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
                    setColorModeState(savedTheme as ColorMode);
                }
            } catch (error) {
                console.log('Error loading theme:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTheme();
    }, []);

    // Save theme to AsyncStorage when it changes
    const setColorMode = async (mode: ColorMode) => {
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
            setColorModeState(mode);
        } catch (error) {
            console.log('Error saving theme:', error);
            setColorModeState(mode); // Still update state even if storage fails
        }
    };

    // Determine if we should use dark mode
    const isDark = colorMode === 'dark' || (colorMode === 'system' && systemColorScheme === 'dark');

    const value = {
        colorMode,
        setColorMode,
        isDark,
        isLoading,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};