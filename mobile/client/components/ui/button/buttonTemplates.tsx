import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Button } from '@/components/ui/button/Button'
import { useTheme } from '@/contexts/ThemeContext'
import { ColorCombinations } from '@/constants/Colors'
import { ChevronRight } from 'lucide-react-native'
import { Colors } from 'react-native/Libraries/NewAppScreen'

export default function buttonTemplates() {
    const { isDark } = useTheme()

  return (
    <View>
      <Button
          variant="outline"
          onPress={() => alert('Outline Pressed')}
        >
          <Text className={`font-semibold ${isDark ? 'text-text_dark-500' : 'text-zinc-600'}`}>
            Outline Button
          </Text>
        </Button>

        <Button
        action="primary"
        variant="solid"
        style={{ marginTop: 20 }}
        onPress={() => alert('Button Pressed')}
        >
        <Text className="text-white font-semibold">Solid Button</Text>
        </Button>

        <Button
        action="error"
        variant="solid"
        style={{ marginTop: 20 }}
        onPress={() => alert('Button Pressed')}
        >
        <Text className="text-white font-semibold">Solid Button</Text>
        </Button>

        <Button
        action="warning"
        variant="solid"
        style={{ marginTop: 20 }}
        onPress={() => alert('Button Pressed')}
        >
        <Text className="text-white font-semibold">Solid Button</Text>
        </Button>

        <Button
        variant="outline"
        style={{ marginTop: 20, borderRadius: 50 }}
        onPress={() => alert('Button Pressed')}
        >
        <Text className='dark:text-text_dark-500 text-text_light-500 '>Solid Button</Text>
        <ChevronRight size={24} color={isDark ? ColorCombinations.statusTemplate.light : ColorCombinations.statusTemplate.dark} />
        </Button>

        <Button
        variant='outline'
        style={{ marginTop: 20, borderColor: Colors.semantic.success, borderWidth: 2 }}
        onPress={() => alert('Button Pressed')}
        >
        <Text style={{ color: Colors.semantic.success }}>Solid Button</Text>
        </Button>
    </View>
  )
}

const styles = StyleSheet.create({})