import React, { createContext, useContext, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { storageHelpers } from '@/helper/storage';

export type FontSizeScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface FontSizeContextType {
  fontScale: FontSizeScale;
  setFontScale: (scale: FontSizeScale) => void;
  fontMultiplier: number;
  isLoading: boolean;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

interface FontSizeProviderProps {
  children?: React.ReactNode;
}

// Font scale multipliers - these multiply the base font size
const FONT_SCALE_MAP: Record<FontSizeScale, number> = {
  xs: 0.85, // 85% of base size
  sm: 0.92, // 92% of base size
  md: 1.0, // 100% of base size (default)
  lg: 1.15, // 115% of base size
  xl: 1.3, // 130% of base size
};

export const FontSizeProvider = ({ children }: FontSizeProviderProps) => {
  const [fontScale, setFontScaleState] = useState<FontSizeScale>('md');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Track mount status
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Load saved font scale on app start
  useEffect(() => {
    if (!isMounted) return;
    loadFontScale();
  }, [isMounted]);

  const loadFontScale = async () => {
    try {
      // const savedFontScale = await AsyncStorage.getItem(FONT_SIZE_STORAGE_KEY);
      const savedFontScale = await storageHelpers.getField(STORAGE_KEYS.USER_SETTINGS, 'font_size_preference');
      if (isMounted && savedFontScale && Object.keys(FONT_SCALE_MAP).includes(savedFontScale)) {
        setFontScaleState(savedFontScale as FontSizeScale);
      }
    } catch (error) {
      console.error('Failed to load font scale preference:', error);
    } finally {
      if (isMounted) {
        setIsLoading(false);
        setIsInitialized(true);
      }
    }
  };

  const setFontScale = async (scale: FontSizeScale) => {
    if (!isMounted) return;

    try {
      setFontScaleState(scale);
      // await AsyncStorage.setItem(FONT_SIZE_STORAGE_KEY, scale);
      await storageHelpers.setField(STORAGE_KEYS.USER_SETTINGS, 'font_size_preference', scale);
    } catch (error) {
      console.error('Failed to save font scale preference:', error);
    }
  };

  const fontMultiplier = isInitialized ? FONT_SCALE_MAP[fontScale] : FONT_SCALE_MAP['md'];

  return (
    <FontSizeContext.Provider
      value={{
        fontScale,
        setFontScale,
        fontMultiplier,
        isLoading,
      }}
    >
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};

// Helper function to calculate scaled font size
export const getScaledFontSize = (baseSize: number, multiplier: number): number => {
  return Math.round(baseSize * multiplier);
};
