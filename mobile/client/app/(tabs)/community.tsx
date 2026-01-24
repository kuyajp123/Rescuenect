import { Button } from '@/components/components/button/Button';
import { CommunityStatus } from '@/components/components/community-status/communityStatus';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

const community = () => {
  const router = useRouter();

  return (
    <Body gap={50}>
      <View>
        <Text size="3xl" bold>
          Community
        </Text>
      </View>

      <CommunityStatus />

      <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Text size="xs" style={{ textAlign: 'justify' }}>
          This evacuation center serves as a safe place for community members during emergencies and disasters.
          Residents can check if the center is open, how many people it can still accommodate, and what basic facilities
          are available, helping families make informed evacuation decisions.
        </Text>
        <Button onPress={() => router.push('/evacuation')}>
          <Text style={{ color: '#ffffff' }} bold>
            View Evacuation Center
          </Text>
        </Button>
      </View>
    </Body>
  );
};

export default community;
