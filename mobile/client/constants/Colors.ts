/**
 * Custom Color Palette
 * Centralized color definitions for the entire application
 */

export const Colors = {
  // Brand Colors
  brand: {
    light: '#0ea5e9',
    dark: '#2563eb',
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
    dark: '#2a2a2a',
  },
  icons: {
    dark: '#A6A6A6',
    light: '#5B5B5B',
  },

  // Muted Colors (desaturated, subtle variations)
  muted: {
    // Light mode muted colors
    light: {
      background: '#f1f5f9', // Very light slate gray
      foreground: '#64748b', // Medium slate gray
      border: '#cbd5e1', // Light slate border
      text: '#475569', // Muted text gray
    },
    // Dark mode muted colors
    dark: {
      background: '#1e293b', // Dark slate background
      foreground: '#94a3b8', // Light slate gray
      border: '#334155', // Dark slate border
      text: '#94a3b8', // Muted light text
    },
  },

  // Button Interactive States
  button: {
    // Primary button states (based on brand colors)
    primary: {
      default: '#0ea5e9', // Your brand light
      hover: '#0284c7', // Slightly darker blue
      pressed: '#0369a1', // Even darker blue
      disabled: '#94a3b8', // Muted gray-blue
    },
    primaryDark: {
      default: '#2563eb', // Updated brand dark color
      hover: '#3b82f6', // Slightly lighter blue
      pressed: '#1d4ed8', // Slightly darker blue for pressed state
      disabled: '#64748b', // Muted gray
    },

    // Secondary button states (based on border/gray colors)
    secondary: {
      default: '#d4d4d8', // Your medium border
      hover: '#a1a1aa', // Darker gray
      pressed: '#71717a', // Even darker gray
      disabled: '#f4f4f5', // Very light gray
    },
    secondaryDark: {
      default: '#3f3f46', // Your dark border
      hover: '#52525b', // Lighter gray
      pressed: '#71717a', // Even lighter gray
      disabled: '#27272a', // Darker than default
    },

    // Success button states (based on semantic success)
    success: {
      default: '#10b981', // Your semantic success
      hover: '#059669', // Darker green
      pressed: '#047857', // Even darker green
      disabled: '#86efac', // Light green
    },
    successDark: {
      default: '#10b981', // Emerald green - works well in dark mode
      hover: '#34d399', // Lighter emerald
      pressed: '#059669', // Darker emerald
      disabled: '#374151', // Muted dark gray
    },

    // Error button states (based on semantic error)
    error: {
      default: '#ef4444', // Your semantic error
      hover: '#dc2626', // Darker red
      pressed: '#b91c1c', // Even darker red
      disabled: '#fca5a5', // Light red
    },
    errorDark: {
      default: '#ef4444', // Red - works well in dark mode
      hover: '#f87171', // Lighter red
      pressed: '#dc2626', // Darker red
      disabled: '#374151', // Muted dark gray
    },

    // Warning button states (based on semantic warning)
    warning: {
      default: '#f59e0b', // Your semantic warning
      hover: '#d97706', // Darker orange
      pressed: '#b45309', // Even darker orange
      disabled: '#fed7aa', // Light orange
    },
    warningDark: {
      default: '#f59e0b', // Amber - works well in dark mode
      hover: '#fbbf24', // Lighter amber
      pressed: '#d97706', // Darker amber
      disabled: '#374151', // Muted dark gray
    },

    // Text colors for different button states
    text: {
      onPrimary: '#ffffff', // White text on colored backgrounds
      onSecondary: '#000000', // Black text on light backgrounds
      onSecondaryDark: '#F2F2F2', // Light text on dark backgrounds
      onDisabled: '#9ca3af', // Muted text for disabled state
    },

    // Overlay effects for outline and link buttons
    overlay: {
      light: 'rgba(0, 0, 0, 0.05)', // Subtle dark overlay
      medium: 'rgba(0, 0, 0, 0.1)', // Medium dark overlay
      lightDark: 'rgba(255, 255, 255, 0.1)', // Subtle light overlay for dark mode
      mediumDark: 'rgba(255, 255, 255, 0.15)', // Medium light overlay for dark mode
    },
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

// Helper functions for button colors
export const getButtonColor = (
  action: 'primary' | 'secondary' | 'success' | 'error' | 'warning',
  state: 'default' | 'hover' | 'pressed' | 'disabled',
  isDark: boolean = false
) => {
  if (action === 'primary') {
    return isDark ? Colors.button.primaryDark[state] : Colors.button.primary[state];
  } else if (action === 'secondary') {
    return isDark ? Colors.button.secondaryDark[state] : Colors.button.secondary[state];
  } else if (action === 'success') {
    return isDark ? Colors.button.successDark[state] : Colors.button.success[state];
  } else if (action === 'error') {
    return isDark ? Colors.button.errorDark[state] : Colors.button.error[state];
  } else if (action === 'warning') {
    return isDark ? Colors.button.warningDark[state] : Colors.button.warning[state];
  }

  // Fallback to light mode if no match
  return Colors.button[action][state];
};

export const getButtonTextColor = (
  action: 'primary' | 'secondary' | 'success' | 'error' | 'warning',
  variant: 'solid' | 'outline' | 'link',
  isDark: boolean = false,
  isDisabled: boolean = false
) => {
  if (isDisabled) {
    return Colors.button.text.onDisabled;
  }

  if (variant === 'solid') {
    if (action === 'secondary') {
      return isDark ? Colors.button.text.onSecondaryDark : Colors.button.text.onSecondary;
    }
    return Colors.button.text.onPrimary; // White text for all colored solid buttons
  } else {
    // For outline and link variants, use the button's default color as text color
    if (action === 'primary') {
      return isDark ? Colors.button.primaryDark.default : Colors.button.primary.default;
    } else if (action === 'secondary') {
      return isDark ? Colors.text.dark : Colors.text.light;
    } else if (action === 'success') {
      return isDark ? Colors.button.successDark.default : Colors.button.success.default;
    } else if (action === 'error') {
      return isDark ? Colors.button.errorDark.default : Colors.button.error.default;
    } else if (action === 'warning') {
      return isDark ? Colors.button.warningDark.default : Colors.button.warning.default;
    }
  }
};

// Predefined color combinations for common UI patterns
export const ColorCombinations = {
  primaryButton: {
    text: Colors.text.dark,
  },
  secondaryButton: {
    background: 'transparent',
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
    Background: '#FFFFFF', // white background
    border: Colors.border.light,
  },
  card_dark: {
    background: Colors.background.dark, // dark background
    border: Colors.border.dark,
  },
  statusTemplate: {
    dark: '#1c1c1d',
    light: '#ffffff',
  },
} as const;
