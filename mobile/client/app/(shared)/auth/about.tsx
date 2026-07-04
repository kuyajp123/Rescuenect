import { HeaderBackButton } from '@/components/components/button/Button';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts/ThemeContext';
import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const releaseVersion = String(Constants.expoConfig?.extra?.releaseVersion ?? Constants.expoConfig?.version ?? '2.0.0');

const capabilityItems = [
  'Locate nearby evacuation centers and check their live capacities.',
  'View verified danger zones with precise mapped areas (points, lines, and polygons).',
  'Report local emergencies with descriptions, photos, and exact map locations.',
  'Access official barangay and municipal announcements or advisories.',
  'Get dynamic weather forecasts tailored to your specific municipality.',
  'Receive real-time earthquake alerts impacting your region.',
  'Find categorized emergency contacts and hotline numbers for your local government.',
];

const teamMembers = [
  'John Paul M. Naag',
  'Angeline D. Sismaet',
  'Kyla Sofia A. de Mesa',
  'Johann Lorenz B. Macalindong',
];

const goalItems = [
  'Provide a centralized, dynamic platform for LGUs and citizens to communicate during crises.',
  'Improve situational awareness through real-time mapping of hazards and shelters.',
  'Empower residents to crowdsource emergency data securely and accurately.',
  'Equip local authorities with the necessary tools to monitor, verify, and resolve ongoing incidents.',
  'Enhance disaster preparedness by delivering localized weather and earthquake intelligence.',
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

      {/* <View style={styles.section}>
        <Text size="lg" bold>
          Developed By
        </Text>
        {teamMembers.map((member, index) => (
          <Text key={index} style={styles.listItem}>
            - {member}
          </Text>
        ))}
      </View> */}
      <Text emphasis="light" size="xs" style={styles.versionText}>
        Rescuenect {releaseVersion}
      </Text>
    </Body>
  );
};

const styles = StyleSheet.create({
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  versionText: {
    marginTop: 18,
    marginBottom: 24,
    textAlign: 'center',
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
