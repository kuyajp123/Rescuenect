import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// @ts-ignore
import Onboarding from 'react-native-onboarding-swiper';

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
    <TouchableOpacity style={styles.button} {...props}>
      <Text style={{ color: isDark ? Colors.brand.dark : Colors.brand.light, fontWeight: 'bold' }}>Done</Text>
    </TouchableOpacity>
  );

  const SkipButton = ({ ...props }) => (
    <TouchableOpacity style={styles.button} {...props}>
      <Text style={{ color: subTextColor }}>Skip</Text>
    </TouchableOpacity>
  );

  const NextButton = ({ ...props }) => (
    <TouchableOpacity style={styles.button} {...props}>
      <Text style={{ color: isDark ? Colors.brand.dark : Colors.brand.light }}>Next</Text>
    </TouchableOpacity>
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
              image: <Text style={{ fontSize: 100 }}>👋</Text>,
              title: <Text style={[styles.title, { color: textColor }]}>Welcome to Status Creation</Text>,
              subtitle: (
                <Text style={[styles.subtitle, { color: subTextColor }]}>
                  Let others know your situation during emergencies so we can help faster.
                </Text>
              ),
            },
            {
              backgroundColor: backgroundColor,
              image: <Text style={{ fontSize: 100 }}>📍</Text>,
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
              image: <Text style={{ fontSize: 100 }}>✅</Text>,
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
