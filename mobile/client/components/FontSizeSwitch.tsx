import { Text } from '@/components/ui/text';
import { ColorCombinations, Colors } from '@/constants/Colors';
import { FontSizeScale, useFontSize } from '@/contexts/FontSizeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Minus, Plus, Type } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface FontSizeSwitchProps {
  showLabel?: boolean;
  variant?: 'buttons' | 'scale';
}

export const FontSizeSwitch = ({ 
  showLabel = true, 
  variant = 'buttons' 
}: FontSizeSwitchProps) => {
  const { fontScale, setFontScale, fontMultiplier } = useFontSize();
  const { isDark } = useTheme();

  const fontScales: { scale: FontSizeScale; label: string; description: string }[] = [
    { scale: 'xs', label: 'XS', description: 'Extra Small' },
    { scale: 'sm', label: 'S', description: 'Small' },
    { scale: 'md', label: 'M', description: 'Medium' },
    { scale: 'lg', label: 'L', description: 'Large' },
    { scale: 'xl', label: 'XL', description: 'Extra Large' },
  ];

  const currentIndex = fontScales.findIndex(scale => scale.scale === fontScale);
  const currentScale = fontScales[currentIndex];

  const decreaseFontSize = () => {
    if (currentIndex > 0) {
      setFontScale(fontScales[currentIndex - 1].scale);
    }
  };

  const increaseFontSize = () => {
    if (currentIndex < fontScales.length - 1) {
      setFontScale(fontScales[currentIndex + 1].scale);
    }
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: 16,
      backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? Colors.border.dark : Colors.border.light,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    buttonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    button: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? Colors.background.light : Colors.background.dark,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? Colors.border.medium : Colors.border.light,
    },
    disabledButton: {
      opacity: 0.5,
    },
    currentSizeContainer: {
      minWidth: 80,
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    scaleContainer: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 6,
    },
    scaleButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? Colors.border.dark : Colors.border.light,
      backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
    },
    activeScaleButton: {
      backgroundColor: isDark ? Colors.brand.light : Colors.brand.light,
      borderColor: isDark ? Colors.brand.light : Colors.brand.light,
    },
    previewContainer: {
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor: isDark ? ColorCombinations.card_dark.background : ColorCombinations.card.background,
      borderColor: isDark ? '#000000' : ColorCombinations.card.border,
      borderWidth: 1,
      alignItems: 'center',
    },
  });

  if (variant === 'scale') {
    return (
      <View style={styles.container}>
        {showLabel && (
          <View style={styles.header}>
            <Type size={18} color={isDark ? Colors.text.dark : Colors.text.light} />
            <Text size="md" style={{ fontWeight: '600' }}>
              Font Size
            </Text>
          </View>
        )}

        <View style={styles.scaleContainer}>
          {fontScales.map((scaleOption) => (
            <TouchableOpacity
              key={scaleOption.scale}
              style={[
                styles.scaleButton,
                fontScale === scaleOption.scale && styles.activeScaleButton,
              ]}
              onPress={() => setFontScale(scaleOption.scale)}
            >
              <Text 
                size="sm" 
                style={{ 
                  fontWeight: fontScale === scaleOption.scale ? 'bold' : 'normal',
                  color: fontScale === scaleOption.scale 
                    ? (isDark ? Colors.text.light : Colors.text.dark)
                    : (isDark ? Colors.text.dark : Colors.text.light)
                }}
              >
                {scaleOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.previewContainer}>
          <Text size="sm" style={{ opacity: 0.7 }}>
            Preview ({Math.round(fontMultiplier * 100)}%)
          </Text>
          <Text size="lg" style={{ marginTop: 4 }}>
            Sample Text
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.header}>
          <Type size={18} color={isDark ? Colors.text.dark : Colors.text.light} />
          <Text size="md" style={{ fontWeight: '600' }}>
            Font Size
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            currentIndex === 0 && styles.disabledButton,
          ]}
          onPress={decreaseFontSize}
          disabled={currentIndex === 0}
        >
          <Minus 
            size={20} 
            color={isDark ? Colors.text.light : Colors.text.dark} 
          />
        </TouchableOpacity>

        <View style={styles.currentSizeContainer}>
          <Text size="xl" style={{ fontWeight: 'bold' }}>
            {currentScale.label}
          </Text>
          <Text size="xs" style={{ opacity: 0.7, marginTop: 2 }}>
            {currentScale.description}
          </Text>
          <Text size="xs" style={{ opacity: 0.6, marginTop: 1 }}>
            {Math.round(fontMultiplier * 100)}%
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            currentIndex === fontScales.length - 1 && styles.disabledButton,
          ]}
          onPress={increaseFontSize}
          disabled={currentIndex === fontScales.length - 1}
        >
          <Plus 
            size={20} 
            color={isDark ? Colors.text.light : Colors.text.dark} 
          />
        </TouchableOpacity>
      </View>

      {/* Visual indicator */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
        {fontScales.map((_, index) => (
          <View
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === currentIndex 
                ? (isDark ? Colors.brand.light : Colors.brand.light)
                : (isDark ? Colors.border.dark : Colors.border.light),
            }}
          />
        ))}
      </View>

      <View style={styles.previewContainer}>
        <Text size="sm" style={{ opacity: 0.7 }}>
          Preview
        </Text>
        <Text size="md" style={{ marginTop: 4 }}>
          Sample Text
        </Text>
        <Text size="lg" style={{ marginTop: 2 }}>
          Larger Sample
        </Text>
      </View>
    </View>
  );
};
