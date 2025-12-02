import { CommunityStatus } from '@/components/components/community-status/communityStatus';
import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import statusData from '@/data/statusData.json';
import React from 'react';
import { View } from 'react-native';
import { Button } from '@/components/components/button/Button';
import { useRouter } from 'expo-router';

const community = () => {
  const router = useRouter();
  // Calculate status counts from statusData
  const statusCounts = statusData.reduce(
    (counts, person) => {
      const status = person.status?.toLowerCase();

      switch (status) {
        case 'safe':
          counts.safe += 1;
          break;
        case 'evacuated':
          counts.evacuated += 1;
          break;
        case 'affected':
          counts.affected += 1;
          break;
        case 'missing':
          counts.missing += 1;
          break;
        default:
          break;
      }
      return counts;
    },
    {
      safe: 0,
      evacuated: 0,
      affected: 0,
      missing: 0,
    }
  );

  return (
    <Body gap={50}>
      <View>
        <Text size="3xl" bold>
          Community
        </Text>
      </View>

      <CommunityStatus
        safe={statusCounts.safe}
        evacuated={statusCounts.evacuated}
        affected={statusCounts.affected}
        missing={statusCounts.missing}
      />

      <Button onPress={() => router.push('/evacuation')}>
        <Text style={{ color: '#ffffff' }} bold>
          View Evacuation Center
        </Text>
      </Button>
    </Body>
  );
};

export default community;
