import { Colors } from '@/constants/Colors';
import { getScaledFontSize, useFontSize } from '@/contexts/FontSizeContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import React from 'react';
import { Text as RNText } from 'react-native';
import { textStyle } from './styles';

type ITextProps = React.ComponentProps<typeof RNText> &
  VariantProps<typeof textStyle>;

const Text = React.forwardRef<React.ComponentRef<typeof RNText>, ITextProps>(
  function Text(
    {
      className,
      isTruncated,
      bold,
      underline,
      strikeThrough,
      size = 'xs',
      sub,
      italic,
      highlight,
      style,
      emphasis,
      ...props
    },
    ref
  ) {
    const { isDark } = useTheme();
    const { fontMultiplier } = useFontSize();
    const defaultColor = isDark ? Colors.text.dark : Colors.text.light;
    
    // Map size prop to numeric values (base font sizes)
    const sizeMap: Record<string, number> = {
      '2xs': 10,
      'xs': 12,
      'sm': 14,
      'md': 16,
      'lg': 18,
      'xl': 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
    };

    // Get base font size and apply multiplier
    const baseFontSize = sizeMap[size] || 14;
    const scaledFontSize = getScaledFontSize(baseFontSize, fontMultiplier);
    
    // Map emphasis to font family
    const getFontFamily = () => {
      if (bold) return 'Poppins-Bold';
      
      switch (emphasis) {
        case 'light':
          return 'Poppins-light';
        case 'medium':
          return 'Poppins-Medium';
        case 'semibold':
          return 'Poppins-Medium'; // Use Medium for semibold since you don't have SemiBold
        case 'bold':
          return 'Poppins-Bold';
        case 'extrabold':
          return 'Poppins-Bold'; // Use Bold for extrabold since you don't have ExtraBold
        case 'normal':
        default:
          return 'Poppins';
      }
    };
    
    return (
      <RNText
        className={textStyle({
          isTruncated,
          bold,
          underline,
          strikeThrough,
          size,
          sub,
          italic,
          highlight,
          emphasis,
          class: className,
        })}
        style={[
          { 
            color: defaultColor,
            fontSize: scaledFontSize,
            fontFamily: getFontFamily(),
          }, 
          style
        ]}
        {...props}
        ref={ref}
      />
    );
  }
);

Text.displayName = 'Text';

export { Text };

// The `emphasis` prop can take the following values:
// - "normal" | "bold" | "light" | "medium" |
// - you can use also opacity from style prop

// Example usage with different base sizes
{/* 
  - <Text size="3xl">Large Title (3xl base)</Text>
  - <Text size="2xl">Subtitle (2xl base)</Text>
  - <Text size="xl">Section Header (xl base)</Text>
  - <Text size="lg">Large Text (lg base)</Text>
  - <Text size="md">Medium Text (md base)</Text>
  - <Text size="sm">Small Text (sm base)</Text>
  - <Text size="xs">Extra Small Text (xs base)</Text>
*/}