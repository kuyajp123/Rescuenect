import HighContrastOption from '@/components/shared/hooks/HighContrastOption';
import { Card } from '@/components/ui/card/Card';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useHighContrast } from '@/contexts/HighContrastContext';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export const DetailsScreen = () => {
  const { isDark } = useTheme();
  const { isHighContrast } = useHighContrast();

  return (
    <Body gap={20}>
      {/* High Contrast Option */}
      <Card>
        <VStack space="md">
          <Text size="lg" emphasis="medium">
            Accessibility Settings
          </Text>
          <HighContrastOption />
        </VStack>
      </Card>

      {/* High Contrast Demo */}
      <Card>
        <VStack space="md">
          <Text size="lg" emphasis="medium">
            High Contrast Text Demo
          </Text>
          
          <View style={styles.statusIndicator}>
            <Text size="sm" emphasis="medium">
              Mode: {isHighContrast ? 'High Contrast' : 'Normal'}
            </Text>
            <Text size="sm" emphasis="medium">
              Theme: {isDark ? 'Dark' : 'Light'}
            </Text>
          </View>

          <VStack space="sm">
            <Text size="md" emphasis="normal">
              Normal text - this should stay the same
            </Text>
            <Text size="md" emphasis="light">
              Light text - this becomes normal in high contrast
            </Text>
            <Text size="md" emphasis="medium">
              Medium text - this should stay the same
            </Text>
            <Text size="md" emphasis="bold">
              Bold text - this should stay the same
            </Text>
          </VStack>
        </VStack>
      </Card>

      {/* Example Usage */}
      <Card>
        <VStack space="md">
          <Text size="lg" emphasis="medium">
            Real-world Example
          </Text>
          
          <VStack space="xs">
            <Text size="md" emphasis="normal">
              Emergency Status: Safe
            </Text>
            <Text size="sm" emphasis="light">
              Last updated: 2 hours ago
            </Text>
            <Text size="sm" emphasis="light">
              Location: Cavite City
            </Text>
          </VStack>

          <VStack space="xs">
            <Text size="md" emphasis="normal">
              Contact Information
            </Text>
            <Text size="sm" emphasis="light">
              Phone: +63 912 345 6789
            </Text>
            <Text size="sm" emphasis="light">
              Email: example@rescuenect.com
            </Text>
          </VStack>
        </VStack>
      </Card>

      {/* Instructions */}
      <Card>
        <VStack space="md">
          <Text size="lg" emphasis="medium">
            How it Works
          </Text>
          
          <VStack space="sm">
            <Text size="sm" emphasis="normal">
              • Toggle the high contrast switch above
            </Text>
            <Text size="sm" emphasis="normal">
              • Text with "light" emphasis becomes "normal" emphasis
            </Text>
            <Text size="sm" emphasis="normal">
              • Other text emphasis levels remain unchanged
            </Text>
            <Text size="sm" emphasis="normal">
              • Improves readability for users with visual impairments
            </Text>
          </VStack>
        </VStack>
      </Card>
    </Body>
  );
}

const styles = StyleSheet.create({
  statusIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
});

export default DetailsScreen;
