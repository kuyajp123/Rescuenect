import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type EmphasisType = 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';

interface HighContrastContextType {
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  getTextEmphasis: (originalEmphasis?: string) => EmphasisType;
}

const HighContrastContext = createContext<HighContrastContextType | undefined>(undefined);

const HIGH_CONTRAST_STORAGE_KEY = 'high-contrast-mode';

export const HighContrastProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved high contrast preference
  useEffect(() => {
    const loadHighContrastPreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(HIGH_CONTRAST_STORAGE_KEY);
        if (savedPreference !== null) {
          setIsHighContrast(JSON.parse(savedPreference));
        }
      } catch (error) {
        console.error('Error loading high contrast preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHighContrastPreference();
  }, []);

  // Save high contrast preference
  const saveHighContrastPreference = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving high contrast preference:', error);
    }
  };

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    saveHighContrastPreference(newValue);
  };

  const getTextEmphasis = (originalEmphasis?: string): EmphasisType => {
    if (!isHighContrast) {
      return (originalEmphasis as EmphasisType) || 'normal';
    }

    // High contrast mode: convert light emphasis to normal
    // Other emphasis levels remain unchanged
    switch (originalEmphasis) {
      case 'light':
        return 'normal';
      case 'medium':
        return 'medium';
      case 'semibold':
        return 'semibold';
      case 'bold':
        return 'bold';
      case 'extrabold':
        return 'extrabold';
      default:
        return 'normal';
    }
  };

  // Don't render children until context is loaded
  if (isLoading) {
    return null;
  }

  return (
    <HighContrastContext.Provider value={{
      isHighContrast,
      toggleHighContrast,
      getTextEmphasis,
    }}>
      {children}
    </HighContrastContext.Provider>
  );
};

export const useHighContrast = (): HighContrastContextType => {
  const context = useContext(HighContrastContext);
  if (context === undefined) {
    throw new Error('useHighContrast must be used within a HighContrastProvider');
  }
  return context;
};
