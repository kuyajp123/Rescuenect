import { Radio, RadioGroup, RadioIcon, RadioIndicator } from '@/components/ui/radio';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { FontSizeScale, useFontSize } from '@/contexts/FontSizeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Circle } from 'lucide-react-native';
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

  const handleRadioChange = (selectedScale: FontSizeScale) => {
    setFontScale(selectedScale);
  };

  const getStyles = () => StyleSheet.create({
    fullContainer: {
      flex: 1,
      backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
    },
    container: {
      alignItems: 'center',
    },
    currentSizeContainer: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
      borderRadius: 12,
      width: '100%',
      height: 120, // Fixed height for current size display
      justifyContent: 'center',
    },
    sliderContainer: {
      width: '100%',
      marginVertical: 24,
      height: 80, // Reduced height since no slider
    },
    radioGroupContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      height: 80,
    },
    checkpoint: {
      alignItems: 'center',
      flex: 1,
      height: 80,
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderRadius: 8,
    },
    radioContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      marginBottom: 8,
      borderRadius: 14,
      backgroundColor: 'transparent',
    },
    checkpointLabel: {
      fontSize: 12,
      fontWeight: '600',
      height: 16, // Fixed height for label
      lineHeight: 16,
    },
    checkpointDescription: {
      fontSize: 10,
      opacity: 0.7,
      textAlign: 'center',
      height: 12, // Fixed height for description
      lineHeight: 12,
    },
    previewContainer: {
      width: '100%',
      padding: 20,
      borderRadius: 12,
      borderColor: isDark ? Colors.border.dark : Colors.border.light,
      borderWidth: 1,
      alignItems: 'center',
      height: 300, // Fixed height for preview section
      justifyContent: 'flex-start',
    },
    previewTitle: {
      opacity: 0.8,
      height: 24, // Fixed height for title
      lineHeight: 24,
    },
    previewTextContainer: {
      alignItems: 'center',
      gap: 8,
      flex: 1,
      justifyContent: 'center',
      width: '100%',
    },
  });

  const styles = getStyles();

  return (
    <View style={styles.fullContainer}>
      <View style={styles.container}>

        {/* Current Size Display */}
        <View style={styles.currentSizeContainer}>
          <Text size="2xl" style={{ fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }} numberOfLines={1}>
            {currentScale.label}
          </Text>
          <Text size="md" style={{ opacity: 0.8, marginBottom: 4, textAlign: 'center' }} numberOfLines={1}>
            {currentScale.description}
          </Text>
          <Text size="sm" style={{ opacity: 0.6, textAlign: 'center' }} numberOfLines={1}>
            {Math.round(fontMultiplier * 100)}%
          </Text>
        </View>

        {/* Radio Button Selection */}
        <View style={styles.sliderContainer}>
          <RadioGroup 
            value={fontScale} 
            onChange={handleRadioChange}
          >
            <View style={styles.radioGroupContainer}>
              {fontScales.map((scaleOption, index) => (
                <TouchableOpacity 
                  key={scaleOption.scale} 
                  style={[
                    styles.checkpoint,
                    fontScale === scaleOption.scale && {
                      backgroundColor: isDark 
                        ? 'rgba(59, 130, 246, 0.1)' 
                        : 'rgba(59, 130, 246, 0.05)'
                    }
                  ]}
                  onPress={() => handleRadioChange(scaleOption.scale)}
                  activeOpacity={0.6}
                >
                  <View style={styles.radioContainer}>
                    <Radio value={scaleOption.scale} size="md">
                      <RadioIndicator>
                        <RadioIcon 
                          as={Circle} 
                          color={fontScale === scaleOption.scale 
                            ? (isDark ? Colors.brand.light : Colors.brand.light)
                            : 'transparent'
                          }
                        />
                      </RadioIndicator>
                    </Radio>
                  </View>
                  <Text 
                    style={[
                      styles.checkpointLabel,
                      { 
                        color: index === currentIndex 
                          ? (isDark ? Colors.brand.light : Colors.brand.light)
                          : (isDark ? Colors.text.dark : Colors.text.light),
                        opacity: index === currentIndex ? 1 : 0.7
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {scaleOption.label}
                  </Text>
                  <Text 
                    style={[
                      styles.checkpointDescription,
                      { color: isDark ? Colors.text.dark : Colors.text.light }
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {scaleOption.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </RadioGroup>
        </View>

        {/* Preview Section */}
        <View style={styles.previewContainer}>
          <Text size="lg" style={[styles.previewTitle, { fontWeight: 'bold', textAlign: 'center' }]} numberOfLines={1}>
            Preview
          </Text>
          <View style={styles.previewTextContainer}>
            <Text size="sm" numberOfLines={1} style={{ textAlign: 'center' }}>
              Small sample text
            </Text>
            <Text size="md" numberOfLines={1} style={{ textAlign: 'center' }}>
              Medium sample text
            </Text>
            <Text size="lg" numberOfLines={1} style={{ textAlign: 'center' }}>
              Large sample text
            </Text>
            <Text size="xl" style={{ marginTop: 8, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>
              Extra large heading
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
