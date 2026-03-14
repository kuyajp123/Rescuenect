import Logo from '@/assets/images/logo/logoVerti.svg';
import { HeaderBackButton } from '@/components/components/button/Button';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const capabilityItems = [
  'View the current status of residents during a disaster.',
  'Access current weather conditions and disaster-related updates.',
  'See the latest earthquake information for timely awareness.',
  'Read official barangay announcements and advisories.',
  'Find official barangay contacts and hotline numbers.',
  'Report city problems and emergencies with location, images, and descriptions.',
  'Support faster response through centralized incident monitoring.',
];

const teamMembers = [
  'John Paul M. Naag',
  'Angeline D. Sismaet',
  'Kyla Sofia A. de Mesa',
  'Johann Lorenz B. Macalindong',
];

const goalItems = [
  'Provide real-time disaster and weather information to help communities stay aware of potential risks.',
  'Allow users to report city problems and emergencies through map-based reporting with images and descriptions.',
  'Improve communication between citizens and local authorities during disaster situations.',
  'Promote community awareness and preparedness for natural disasters such as floods, earthquakes, and storms.',
  'Create a centralized system for monitoring community incidents to support faster response and better decision-making.',
];

const AboutScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  return (
    <Body>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'About Us',
          headerLeft: () => <HeaderBackButton router={() => router.back()} />,
          headerStyle: {
            backgroundColor: isDark ? '#000' : '#fff',
          },
          headerTintColor: isDark ? '#fff' : '#000',
          headerShadowVisible: false,
        }}
      />

      <View style={styles.headerSection}>
        <Logo width={140} height={80} />
        <Text size="2xl" bold style={styles.titleText}>
          Welcome to Rescuenect
        </Text>
        <Text style={styles.paragraph}>
          Rescuenect is a disaster management system built to help communities stay informed, connected, and ready. It
          provides a reliable way to track community safety, access critical updates, and coordinate with local
          authorities during emergencies.
        </Text>
      </View>

      <View style={styles.section}>
        <Text size="lg" bold>
          Purpose
        </Text>
        <Text style={styles.paragraph}>
          The purpose of Rescuenect is to support disaster preparedness and response by giving residents and barangay
          officials a shared platform for real-time information, incident reporting, and community coordination.
        </Text>
      </View>

      <View style={styles.section}>
        <Text size="lg" bold>
          Key Capabilities
        </Text>
        {capabilityItems.map((item, index) => (
          <Text key={index} style={styles.listItem}>
            - {item}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text size="lg" bold>
          Mission
        </Text>
        <Text style={styles.paragraph}>
          To provide a reliable digital platform that enables communities to report local incidents, receive real-time
          disaster information, and stay connected with authorities and fellow citizens for faster and more organized
          disaster response.
        </Text>
      </View>

      <View style={styles.section}>
        <Text size="lg" bold>
          Vision
        </Text>
        <Text style={styles.paragraph}>
          To build a resilient and informed community where technology helps people prepare for disasters, respond
          quickly to emergencies, and support one another during times of crisis.
        </Text>
      </View>

      <View style={styles.section}>
        <Text size="lg" bold>
          Goals
        </Text>
        {goalItems.map((item, index) => (
          <Text key={index} style={styles.listItem}>
            - {item}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text size="lg" bold>
          Developed By
        </Text>
        {teamMembers.map((member, index) => (
          <Text key={index} style={styles.listItem}>
            - {member}
          </Text>
        ))}
      </View>
    </Body>
  );
};

const styles = StyleSheet.create({
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  titleText: {
    textAlign: 'center',
    marginTop: 8,
  },
  paragraph: {
    marginTop: 8,
    lineHeight: 20,
    textAlign: 'justify',
  },
  listItem: {
    marginTop: 8,
    lineHeight: 20,
  },
});

export default AboutScreen;
