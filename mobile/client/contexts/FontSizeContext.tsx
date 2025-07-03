import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type FontSizeScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface FontSizeContextType {
  fontScale: FontSizeScale;
  setFontScale: (scale: FontSizeScale) => void;
  fontMultiplier: number;
  isLoading: boolean;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

interface FontSizeProviderProps {
  children: React.ReactNode;
}

const FONT_SIZE_STORAGE_KEY = '@font_size_preference';

// Font scale multipliers - these multiply the base font size
const FONT_SCALE_MAP: Record<FontSizeScale, number> = {
  xs: 0.85,   // 85% of base size
  sm: 0.92,   // 92% of base size
  md: 1.0,    // 100% of base size (default)
  lg: 1.15,   // 115% of base size
  xl: 1.3,    // 130% of base size
};

export const FontSizeProvider = ({ children }: FontSizeProviderProps) => {
  const [fontScale, setFontScaleState] = useState<FontSizeScale>('md');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved font scale on app start
  useEffect(() => {
    loadFontScale();
  }, []);

  const loadFontScale = async () => {
    try {
      const savedFontScale = await AsyncStorage.getItem(FONT_SIZE_STORAGE_KEY);
      if (savedFontScale && Object.keys(FONT_SCALE_MAP).includes(savedFontScale)) {
        setFontScaleState(savedFontScale as FontSizeScale);
      }
    } catch (error) {
      console.error('Failed to load font scale preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setFontScale = async (scale: FontSizeScale) => {
    try {
      setFontScaleState(scale);
      await AsyncStorage.setItem(FONT_SIZE_STORAGE_KEY, scale);
    } catch (error) {
      console.error('Failed to save font scale preference:', error);
    }
  };

  const fontMultiplier = FONT_SCALE_MAP[fontScale];

  return (
    <FontSizeContext.Provider value={{ 
      fontScale, 
      setFontScale, 
      fontMultiplier, 
      isLoading 
    }}>
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
