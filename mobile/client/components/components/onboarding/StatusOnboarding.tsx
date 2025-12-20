import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Image } from 'expo-image';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { Button } from '../button/Button';

interface StatusOnboardingProps {
  visible: boolean;
  onDone: () => void;
  onSkip: () => void;
}

const StatusOnboarding = ({ visible, onDone, onSkip }: StatusOnboardingProps) => {
  const { isDark } = useTheme();

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const subTextColor = isDark ? Colors.muted.dark.text : Colors.muted.light.text;

  const DoneButton = ({ ...props }) => (
    <Button style={styles.button} {...props} width="auto">
      <Text style={{ color: Colors.text.dark, fontWeight: 'bold' }}>Done</Text>
    </Button>
  );

  const SkipButton = ({ ...props }) => (
    <TouchableOpacity style={styles.button} {...props}>
      <Text style={{ color: subTextColor }}>Skip</Text>
    </TouchableOpacity>
  );

  const NextButton = ({ ...props }) => (
    <Button style={styles.button} {...props} width="auto">
      <Text style={{ color: Colors.text.dark }}>Next</Text>
    </Button>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.container, { backgroundColor }]}>
        <Onboarding
          onDone={onDone}
          onSkip={onSkip}
          DoneButtonComponent={DoneButton}
          SkipButtonComponent={SkipButton}
          NextButtonComponent={NextButton}
          bottomBarHighlight={false}
          containerStyles={{ paddingHorizontal: 15 }}
          pages={[
            {
              backgroundColor: backgroundColor,
              image: (
                <Image source={require('@/assets/images/images/welcome.png')} style={{ width: 300, height: 300 }} />
              ),
              title: <Text style={[styles.title, { color: textColor }]}>Welcome to Status Creation</Text>,
              subtitle: (
                <Text style={[styles.subtitle, { color: subTextColor }]}>
                  Let others know your situation during emergencies so we can help faster.
                </Text>
              ),
            },
            {
              backgroundColor: backgroundColor,
              image: (
                <Image source={require('@/assets/images/images/map_model.png')} style={{ width: 300, height: 300 }} />
              ),
              title: <Text style={[styles.title, { color: textColor }]}>How to Create a Status</Text>,
              subtitle: (
                <View style={{ alignItems: 'center', gap: 10 }}>
                  <Text style={[styles.subtitle, { color: subTextColor }]}>1. Tap on the Map to place a marker</Text>
                  <Text style={[styles.subtitle, { color: subTextColor }]}>
                    2. Swipe up the bottom sheet to fill form
                  </Text>
                  <Text style={[styles.subtitle, { color: subTextColor }]}>3. Submit your accurate details</Text>
                </View>
              ),
            },
            {
              backgroundColor: backgroundColor,
              image: (
                <Image source={require('@/assets/images/images/complete.png')} style={{ width: 300, height: 300 }} />
              ),
              title: <Text style={[styles.title, { color: textColor }]}>You are Protected</Text>,
              subtitle: (
                <Text style={[styles.subtitle, { color: subTextColor }]}>
                  Your status will be monitored by admins instantly. Stay safe!
                </Text>
              ),
            },
          ]}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    marginHorizontal: 20,
    marginBottom: 10, // Adjust for bottom bar safe area if needed
  },
});

export default StatusOnboarding;
