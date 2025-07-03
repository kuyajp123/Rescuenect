/**
 * Custom Color Palette
 * Centralized color definitions for the entire application
 */

export const Colors = {
  // Brand Colors
  brand: {
    light: '#0ea5e9',
    dark: '#171C42',
  },

  // Semantic Colors  
  semantic: {
    success: '#10b981',
    warning: '#f59e0b', 
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Text Colors
  text: {
    light: '#000000',
    dark: '#F2F2F2',
  },

  // Background Colors
  background: {
    light: '#F8FAFC',
    dark: '#171717',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Border Colors
  border: {
    light: '#e4e4e7',
    medium: '#d4d4d8',
    dark: '#a1a1aa',
  },
} as const;

// Type for color keys - useful for TypeScript autocomplete
export type ColorKey = keyof typeof Colors;
export type BrandColorKey = keyof typeof Colors.brand;
export type SemanticColorKey = keyof typeof Colors.semantic;

// Helper function to get color by path
export const getColor = (category: ColorKey, shade: string): string => {
  return (Colors[category] as any)[shade] || '#000000';
};

// Predefined color combinations for common UI patterns
export const ColorCombinations = {
  primaryButton: {
    // background: Colors.brand.primary,
    text: Colors.text.dark,
    // border: Colors.brand.primary,
  },
  secondaryButton: {
    background: 'transparent',
    // text: Colors.brand.primary,
    // border: Colors.brand.primary,
  },
  successAlert: {
    background: '#dcfce7', // light green
    text: Colors.semantic.success,
    border: Colors.semantic.success,
  },
  errorAlert: {
    background: '#fee2e2', // light red
    text: Colors.semantic.error,
    border: Colors.semantic.error,
  },
  card: {
    background: '#FFFFFF', // white background
    border: Colors.border.light,
  },
  card_dark: {
    background: '#000000', // dark background
    border: Colors.border.dark,
  },
} as const;
