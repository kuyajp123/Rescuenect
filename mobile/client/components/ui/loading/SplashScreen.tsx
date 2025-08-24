import React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import Body from '@/components/ui/layout/Body'
import { Text } from '@/components/ui/text'

export const SplashScreen = () => {
  return (
    <Body style={styles.container}>
        <View>
            <Image 
            source={require('@/assets/images/logo/splash-icon-light.png')} 
            style={styles.image}
            />
        </View>
        <Text size='md' style={styles.bottomText}>
            Rescuenect
        </Text>
    </Body>
  )
}

export default SplashScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 200,
        height: 100,
    },
    bottomText: {
        position: 'absolute',
        bottom: 50,
        textAlign: 'center',
    },
})