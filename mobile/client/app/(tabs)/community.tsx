import { CommunityStatus } from '@/components/components/community-status/communityStatus';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native/button';
import React from 'react';
import { View } from 'react-native';

const community = () => {
  const router = useRouter();

  return (
    <Body style={{ paddingBottom: 110 }} gap={50}>
      <View>
        <Text size="3xl" bold>
          Community
        </Text>
      </View>

      <CommunityStatus />

      <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Image
          source={require('../../assets/images/images/evacuation_map.png')}
          contentFit="contain"
          style={{ width: '100%', height: 300, borderRadius: 12 }}
          accessibilityLabel="Evacuation center map illustration"
        />
        <Text size="xs" style={{ textAlign: 'justify' }}>
          A safe shelter for community members during emergencies. Check real-time availability, capacity, and facilities to make informed evacuation decisions.
        </Text>
        <Button style={{ borderRadius: 10 }} onPress={() => router.push('/evacuation')}>
          <Text style={{ color: '#ffffff' }} bold>
            View Evacuation Center
          </Text>
        </Button>
      </View>
    </Body>
  );
};

export default community;
