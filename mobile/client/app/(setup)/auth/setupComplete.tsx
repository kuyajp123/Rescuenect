import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/store/useAuth';
import { router } from 'expo-router';
import { Button } from 'heroui-native/button';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const setupComplete = () => {
  const { isDark } = useTheme();
  const setShowingSetupComplete = useAuth(state => state.setShowingSetupComplete);
  const imageSource = isDark
    ? require('@/assets/images/states/done-dark.png')
    : require('@/assets/images/states/done-light.png');

  return (
    <Body style={styles.body}>
      <Image source={imageSource} />
      <Text size="sm">Setup Complete</Text>
      <Text emphasis="light"> You're all set! Welcome to Rescuenect</Text>
      <View style={styles.homeButton}>
        <Button
          style={{ borderRadius: 10 }}
          onPress={() => {
            setShowingSetupComplete(false);
            router.replace('/(app)/(tabs)' as any);
          }}
        >
          Continue
        </Button>
      </View>
    </Body>
  );
};

export default setupComplete;

const styles = StyleSheet.create({
  body: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  homeButton: {
    width: '100%',
    marginTop: 20,
  },
  setStatusText: {
    textAlign: 'center',
    marginTop: 20,
  },
});
