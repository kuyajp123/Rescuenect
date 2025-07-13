import HighContrastOption from '@/components/shared/hooks/HighContrastOption'
import { HoveredButton } from '@/components/ui/button/Button'
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
  const { isHighContrast, toggleHighContrast } = useHighContrast();

  function toggleTheme(): void {
    throw new Error('Function not implemented.')
  }

  return (
    <Body style={{ paddingHorizontal: 0 }}>
      <Text size='3xl' bold style={{ marginLeft: 20, }}>Settings</Text>
      
      <View>
        <View style={{ marginTop: 20, marginLeft: 20}}>
          <Text emphasis='light'>Accessibility</Text>
        </View>
        
        <View style={{ 
          borderWidth: 1, 
          borderColor: isDark 
                ? Colors.border.dark 
                : Colors.border.light, 
          marginTop: 10, 
          backgroundColor: isDark
                ? ColorCombinations.statusTemplate.dark
                : ColorCombinations.statusTemplate.light, 
          }}>
          <HoveredButton style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, }}
            onPress={() => router.push('settings/font-size' as any)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: '85%'}}>
                <AArrowUp size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <View style={{ width: '80%' }}>
                  <Text>Font size</Text>
                  <Text emphasis='light' size='2xs' style={{ flexWrap: 'wrap', }}>Change the size of the text to make it easier to read.</Text>
                </View>
              </View>
              <View>
                <ChevronRight size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
              </View>
          </HoveredButton>
          <HoveredButton 
            onPress={toggleHighContrast}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 20, }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: '85%' }}>
                <TypeOutline size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <View style={{ width: '80%' }}>
                  <Text>Text Contrast</Text>
                  <Text emphasis='light' size='2xs' style={{ flexWrap: 'wrap', }}>Adjust the contrast of text to improve readability.</Text>
                </View>
              </View>
              <View>
                <View style={{ pointerEvents: 'none' }}>
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

const styles = StyleSheet.create({})