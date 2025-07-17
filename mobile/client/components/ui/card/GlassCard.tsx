import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

export interface GlassCardProps {
  title?: string;
  value?: string;
  style?: object | ViewStyle;
  size?: 'small' | 'medium' | 'large';
  children?: React.ReactNode;
}

export const GlassCard = ({ title, value, style, size = 'medium', children }: GlassCardProps) => {
  const { isDark } = useTheme();

  const cardSize = {
    small: styles.smallCard,
    medium: styles.mediumCard,
    large: styles.largeCard,
  };

  const textSize = {
    small: { title: 'xs' as const, value: 'sm' as const },
    medium: { title: 'sm' as const, value: 'lg' as const },
    large: { title: 'md' as const, value: 'xl' as const },
  };

  return (
    <View style={[
      styles.container,
      cardSize[size],
      {
        backgroundColor: isDark 
          ? 'rgba(255, 255, 255, 0.08)' // Slightly more opaque for dark mode
          : 'rgba(0, 0, 0, 0.12)', // More opaque for light mode
        borderColor: isDark 
          ? 'rgba(255, 255, 255, 0.15)' 
          : 'rgba(255, 255, 255, 0.2)',
      },
      style
    ]}>
      <Text 
        size={textSize[size].title}
        style={styles.titleText}
      >
        {title}
      </Text>
      <Text 
        size={textSize[size].value}
        bold
        style={styles.valueText}
      >
        {value}
      </Text>
        {children}
    </View>
  );
};

export default GlassCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // Glassmorphism effect
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    // Backdrop blur simulation
    backdropFilter: 'blur(10px)',
  },
  smallCard: {
    minWidth: 80,
    minHeight: 60,
    padding: 12,
  },
  mediumCard: {
    minWidth: 120,
    minHeight: 80,
    padding: 16,
  },
  largeCard: {
    minWidth: 160,
    minHeight: 100,
    padding: 20,
  },
  titleText: {
    color: 'white',
    textAlign: 'center',
    opacity: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 2,
    marginBottom: 4,
  },
  valueText: {
    color: 'white',
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 2,
  },
});
