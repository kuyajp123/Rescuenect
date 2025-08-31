import CustomRadio from '@/components/ui/CustomRadio';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { FontSizeScale, useFontSize } from '@/contexts/FontSizeContext';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export const FontSizeSwitch = () => {
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
  const textValueColor = isDark ? Colors.text.dark : Colors.text.light;

  const handleRadioChange = (selectedScale: string) => {
    setFontScale(selectedScale as FontSizeScale);
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
    },
    radioGroupContainer: {
      flexDirection: 'column',
      width: '100%',
      gap: 8,
      paddingVertical: 16,
    },
    previewContainer: {
      width: '100%',
      padding: 20,
      borderRadius: 12,
      borderColor: isDark ? Colors.border.dark : Colors.border.light,
      borderWidth: 1,
      alignItems: 'center',
      minHeight: 200,
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
          <View style={styles.radioGroupContainer}>
            {fontScales.map((scaleOption) => (
              <CustomRadio
                key={scaleOption.scale}
                label={`${scaleOption.label} - ${scaleOption.description}`}
                value={scaleOption.scale}
                selectedValue={fontScale}
                onSelect={handleRadioChange}
                isDark={isDark}
                textValueColor={textValueColor}
              />
            ))}
          </View>
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
