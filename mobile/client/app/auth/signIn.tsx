import Logo from '@/assets/images/logo/logoVerti.svg';
import { Button } from '@/components/components/button/Button';
import GoogleButton from '@/components/components/button/GoogleButton';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { useTheme } from '@/contexts/ThemeContext';
import { storageHelpers } from '@/helper/storage';
import { Checkbox } from 'expo-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const signIn = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const [acceptedTOS, setAcceptedTOS] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const loadAcceptedTOS = async () => {
      const acceptedTOS = await storageHelpers.getField(STORAGE_KEYS.ACCEPTED_TOS, 'acceptedTOS');
      setAcceptedTOS(acceptedTOS || false);
    };
    loadAcceptedTOS();
  }, []);

  const handleAcceptTOS = async () => {
    if (!acceptedTOS) {
      setIsOpen(false);
    }

    const newValue = !acceptedTOS;
    setAcceptedTOS(newValue);
    await storageHelpers.setData(STORAGE_KEYS.ACCEPTED_TOS, { acceptedTOS: newValue });
  };

  const handleValidate = () => {
    if (!acceptedTOS) {
      setIsOpen(true);
      return false;
    }
    return true;
  };

  const gradientColors = isDark
    ? (['#0C0012', '#170009', '#15070C', '#000C17', '#070E15'] as const) // Dark theme: subtle gray gradient
    : (['#E8DAF0', '#FFE4EE', '#FFE8F0', '#DEEFFF', '#E8F4FF'] as const); // Light theme: subtle blue-gray gradient

  const handleGuestLogin = () => {
    if (handleValidate()) {
      router.push('/auth/barangayForm');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} locations={[0.1, 0.3, 0.5, 0.7, 0.9]} style={styles.gradient}>
        <Body style={styles.body}>
          <View style={styles.welcomeContainer}>
            <Logo width={200} height={100} />
          </View>
          <View style={styles.welcomeTextContainer}>
            <Text size="2xl">Welcome</Text>
          </View>
          <View style={styles.buttons}>
            <GoogleButton onValidate={handleValidate} />
            <Button action="secondary" onPress={handleGuestLogin}>
              <Text>Continue as a guest</Text>
            </Button>
          </View>
          <View style={styles.checkboxContainer}>
            {isOpen && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 40,
                  left: 0,
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                  zIndex: 50,
                  width: '100%',
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    bottom: -8,
                    left: 14,
                    width: 0,
                    height: 0,
                    borderLeftWidth: 8,
                    borderRightWidth: 8,
                    borderTopWidth: 8,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: isDark ? '#334155' : '#e2e8f0', // Border arrow
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: -6, // Adjusted to sit inside the border arrow
                    left: 14,
                    width: 0,
                    height: 0,
                    borderLeftWidth: 8,
                    borderRightWidth: 8,
                    borderTopWidth: 8,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: isDark ? '#0f172a' : '#ffffff', // Background arrow matches box bg
                  }}
                />
                <Text style={{ textAlign: 'center', fontSize: 12 }}>
                  Please read and agree to the Terms and Conditions and Privacy Policy to continue.
                </Text>
              </View>
            )}
            <Pressable onPress={handleAcceptTOS} style={{ padding: 4 }}>
              <Checkbox color="#0ea5e9" value={acceptedTOS} onValueChange={handleAcceptTOS} />
            </Pressable>
            <Text style={{ flex: 1 }}>
              I have read and agree to the{' '}
              <Text
                style={{ color: '#0ea5e9', textDecorationLine: 'underline' }}
                onPress={() =>
                  router.push({
                    pathname: '/auth/legal',
                    params: {
                      url: 'https://rescuenect.vercel.app/terms-and-condition',
                      title: 'Terms and Conditions',
                    },
                  })
                }
              >
                Terms and Conditions
              </Text>{' '}
              and{' '}
              <Text
                style={{ color: '#0ea5e9', textDecorationLine: 'underline' }}
                onPress={() =>
                  router.push({
                    pathname: '/auth/legal',
                    params: {
                      url: 'https://rescuenect.vercel.app/privacy-policy',
                      title: 'Privacy Policy',
                    },
                  })
                }
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </Body>
      </LinearGradient>
    </View>
  );
};

export default signIn;

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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 40,
    // borderWidth: 1,
    // borderColor: '#ffffff',
    borderRadius: 5,
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
});
