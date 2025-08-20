import Logo from '@/assets/images/logo/logoVerti.svg'
import GoogleButton from '@/components/components/button/GoogleButton'
import Body from '@/components/ui/layout/Body'
import { Text } from '@/components/ui/text'
import { useTheme } from '@/contexts/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

const signIn = () => {
  const router = useRouter();
  const { isDark } = useTheme();

  // Define gradient colors based on theme
  const gradientColors = isDark 
    ? ['#0C0012', '#170009', '#15070C', '#000C17', '#070E15'] as const // Dark theme: subtle gray gradient
    : ['#E8DAF0', '#FFE4EE', '#FFE8F0', '#DEEFFF', '#E8F4FF'] as const; // Light theme: subtle blue-gray gradient

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        locations={[0.1, 0.3, 0.5, 0.7, 0.9]}
        style={styles.gradient}
      >
        <Body style={styles.body}>
            <View style={styles.welcomeContainer}>
                <Logo width={200} height={100} />
            </View>
            <View style={styles.welcomeTextContainer}>
                <Text size='2xl'>
                    Welcome
                </Text>
            </View>
            <View style={styles.buttons}>
                <GoogleButton />
                <Pressable
                    onPress={() => router.push('/auth/barangayForm')}
                >
                    <Text>Continue as a guest</Text>
                </Pressable>
            </View>
        </Body>
      </LinearGradient>
    </View>
  )
}

export default signIn

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    body: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent', // Make Body transparent to show gradient
    },
    welcomeContainer: {
        position: 'absolute',
        top: '10%',
        textAlign: 'center',
    },
    buttons: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 30,
    },
    welcomeTextContainer: {
        position: 'absolute',
        top: '25%',
        textAlign: 'center',
    },
})