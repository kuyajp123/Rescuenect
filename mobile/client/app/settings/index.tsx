import { HoveredButton } from '@/components/components/button/Button'
import HighContrastOption from '@/hooks/HighContrastOption'
import { Body } from '@/components/ui/layout/Body'
import { Text } from '@/components/ui/text'
import { ColorCombinations, Colors } from '@/constants/Colors'
import { useHighContrast } from '@/contexts/HighContrastContext'
import { useTheme } from '@/contexts/ThemeContext'
import { router } from 'expo-router'
import { AArrowUp, ChevronRight, TypeOutline } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, View } from 'react-native'

export const index = () => {
  const { isDark } = useTheme();
  const { toggleHighContrast } = useHighContrast();

  return (
    <Body style={styles.bodyContainer}>
      <Text size='3xl' bold style={styles.titleText}>Settings</Text>
      
      <View>
        <View style={styles.sectionTitle}>
          <Text emphasis='light'>Accessibility</Text>
        </View>
        
        <View style={[
          styles.sectionContainer,
          {
            borderColor: isDark ? Colors.border.dark : Colors.border.light,
            backgroundColor: isDark ? ColorCombinations.statusTemplate.dark : ColorCombinations.statusTemplate.light,
          }
        ]}>
          <HoveredButton style={styles.menuButton}
            onPress={() => router.push('settings/font-size' as any)}
            >
              <View style={styles.menuButtonContent}>
                <AArrowUp size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <View style={styles.textContainer}>
                  <Text>Font size</Text>
                  <Text emphasis='light' size='2xs' style={styles.descriptionText}>Change the size of the text to make it easier to read.</Text>
                </View>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </HoveredButton>
          <HoveredButton 
            onPress={toggleHighContrast}
            style={styles.contrastButton}>
              <View style={styles.menuButtonContent}>
                <TypeOutline size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <View style={styles.textContainer}>
                  <Text>Text Contrast</Text>
                  <Text emphasis='light' size='2xs' style={styles.descriptionText}>Adjust the contrast of text to improve readability.</Text>
                </View>
              </View>
              <View>
                <View style={styles.highContrastContainer}>
                  <HighContrastOption />
                </View>
              </View>
          </HoveredButton>
        </View>
      </View>
      
    </Body>
  )
}

export default index

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
})