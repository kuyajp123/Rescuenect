import NavigationButton from '@/components/components/button/NavigationButton';
import { Body } from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { ColorCombinations, Colors } from '@/constants/Colors';
import { useHighContrast } from '@/contexts/HighContrastContext';
import { useTheme } from '@/contexts/ThemeContext';
import HighContrastOption from '@/hooks/HighContrastOption';
import { router } from 'expo-router';
import { AArrowUp, Bookmark, TypeOutline } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export const index = () => {
  const { isDark } = useTheme();
  const { toggleHighContrast } = useHighContrast();

  return (
    <Body style={styles.bodyContainer}>
      <Text size="3xl" bold style={styles.titleText}>
        Settings
      </Text>

      <View>
        <View style={styles.sectionTitle}>
          <Text emphasis="light">Accessibility</Text>
        </View>

        <View
          style={[
            styles.sectionContainer,
            {
              borderColor: isDark ? Colors.border.dark : Colors.border.light,
              backgroundColor: isDark ? ColorCombinations.statusTemplate.dark : ColorCombinations.statusTemplate.light,
            },
          ]}
        >
          <NavigationButton
            label="Font size"
            onPress={() => router.push('settings/font-size' as any)}
            description="Change the size of the text to make it easier to read."
            iconLeft={<AArrowUp size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
          />
          <NavigationButton
            label="Text Contrast"
            onPress={toggleHighContrast}
            description="Adjust the contrast of text to improve readability."
            iconLeft={<TypeOutline size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
            iconRight={<HighContrastOption />}
          />
        </View>
        <View style={styles.sectionTitle}>
          <Text emphasis="light">Preferences</Text>
        </View>
        <View
          style={[
            styles.sectionContainer,
            {
              borderColor: isDark ? Colors.border.dark : Colors.border.light,
              backgroundColor: isDark ? ColorCombinations.statusTemplate.dark : ColorCombinations.statusTemplate.light,
            },
          ]}
        >
          <NavigationButton
            label="Saved Locations"
            onPress={() => router.push('profile/(saveLocation)' as any)}
            description="Manage your saved locations."
            iconLeft={<Bookmark size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />}
          />
        </View>
      </View>
    </Body>
  );
};

export default index;

const styles = StyleSheet.create({
  bodyContainer: {
    paddingHorizontal: 0,
  },
  titleText: {
    marginLeft: 20,
  },
  sectionTitle: {
    marginTop: 20,
    marginLeft: 20,
  },
  sectionContainer: {
    borderWidth: 1,
    marginTop: 10,
  },
  menuButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  menuButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '85%',
  },
  textContainer: {
    width: '80%',
  },
  descriptionText: {
    flexWrap: 'wrap',
  },
  contrastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  highContrastContainer: {
    pointerEvents: 'none',
  },
});
