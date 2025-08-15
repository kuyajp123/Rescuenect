import { StyleSheet, Image, View, Pressable } from 'react-native'
import { Text } from '@/components/ui/text'
import React from 'react'
import Body from '@/components/ui/layout/Body'
import { useTheme } from '@/contexts/ThemeContext'
import { PrimaryButton } from '@/components/ui/button/Button'
import { router } from 'expo-router'

const setupComplete = () => {
    const { isDark } = useTheme();
    const imageSource = isDark 
        ? require('@/assets/images/states/done-dark.png') 
        : require('@/assets/images/states/done-light.png');

  return (
    <Body style={styles.body}>
      <Image 
        source={imageSource}
      />
      <Text size='sm'>Setup Complete</Text>
      <Text emphasis='light'> You're all set! Welcome to Rescuenect</Text>
      <View style={styles.homeButton}>
        <PrimaryButton onPress={() => router.replace("(tabs)" as any)}>
          Continue
        </PrimaryButton>
        {/* <Pressable
          onPress={() => router.replace("/status/createStatus" as any)}
        >
          <Text style={styles.setStatusText}>Set a status</Text>
        </Pressable> */}
      </View>
    </Body>
  )
}

export default setupComplete

const styles = StyleSheet.create({
    body: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1
    },
    homeButton: {
        width: '100%',
        marginTop: 20
    },
    setStatusText: {
        textAlign: 'center',
        marginTop: 20
    }
})