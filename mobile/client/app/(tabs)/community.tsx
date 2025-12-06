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

      <Button onPress={() => router.push('/evacuation')}>
        <Text style={{ color: '#ffffff' }} bold>
          View Evacuation Center
        </Text>
      </Button>
    </Body>
  );
};

export default community;
