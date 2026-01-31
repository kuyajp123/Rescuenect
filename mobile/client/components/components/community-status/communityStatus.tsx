import { PrimaryButton } from '@/components/components/button/Button';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ColorCombinations } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useStatusStore } from '@/store/useCurrentStatusStore';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

// Status Card Component
const StatusCard = ({
  status,
  count,
  label,
  colorClass,
  onPress,
  isDark,
}: {
  status: string;
  count: number;
  label: string;
  colorClass: string;
  onPress: () => void;
  isDark: boolean;
}) => {
  return (
    <TouchableOpacity
      style={[styles.statusCard, isDark ? styles.statusCardDark : styles.statusCardLight]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.statusHeader}>
        <View style={styles.statusDot} className={colorClass} />
        <Text>{label}</Text>
      </View>
      <View style={styles.statusContent}>
        <Text size="xl">{count}</Text>
      </View>
      <View>
        <Text emphasis="light" size="2xs">
          Individual
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const CommunityStatus = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const { statusCounts, statusesByCondition } = useStatusStore();

  return (
    <View>
      <VStack space="lg">
        <Text>Status</Text>
        <View>
          <View
            style={[
              styles.statusContainer,
              {
                backgroundColor: isDark
                  ? ColorCombinations.statusTemplate.dark
                  : ColorCombinations.statusTemplate.light,
              },
            ]}
          >
            <View style={styles.leftColumn}>
              <StatusCard
                status="safe"
                count={statusCounts.safe}
                label="Safe"
                colorClass="bg-safe-500"
                onPress={() => {}}
                isDark={isDark}
              />
              <StatusCard
                status="affected"
                count={statusCounts.affected}
                label="Affected"
                colorClass="bg-affected-500"
                onPress={() => {}}
                isDark={isDark}
              />
            </View>

            <View style={styles.rightColumn}>
              <StatusCard
                status="evacuated"
                count={statusCounts.evacuated}
                label="Evacuated"
                colorClass="bg-evacuated-500"
                onPress={() => {}}
                isDark={isDark}
              />
              <StatusCard
                status="missing"
                count={statusCounts.missing}
                label="Missing"
                colorClass="bg-missing-500"
                onPress={() => {}}
                isDark={isDark}
              />
            </View>
          </View>
          <PrimaryButton onPress={() => router.push('post/status' as any)}>
            <Text style={{ color: '#ffffff' }} bold>
              View all Status
            </Text>
          </PrimaryButton>
        </View>
      </VStack>
    </View>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 10,
    marginBottom: 20,
    borderRadius: 10,
  },
  leftColumn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
  },
  rightColumn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
  },
  statusCard: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusCardLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  statusCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  statusDot: {
    height: 10,
    width: 10,
    borderRadius: 50,
  },
  statusContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 2,
  },
});

// Usage Example:

// import { CommunityStatus } from '@/components/ui/community-status/CommunityStatus';
// import statusData from '../../data/statusData.json';

// export default function HomeScreen () {
//   // Calculate status counts from statusData
//   const statusCounts = statusData.reduce((counts, person) => {
//     const status = person.status?.toLowerCase();
//     switch (status) {
//       case 'safe':
//         counts.safe += 1;
//         break;
//       case 'evacuated':
//         counts.evacuated += 1;
//         break;
//       case 'affected':
//         counts.affected += 1;
//         break;
//       case 'missing':
//         counts.missing += 1;
//         break;
//       default:
//         // Handle any unknown status or null/undefined status
//         break;
//     }
//     return counts;
//   }, {
//     safe: 0,
//     evacuated: 0,
//     affected: 0,
//     missing: 0
//   });

//   return (
//    <Body gap={10} >
//       <CommunityStatus
//         safe={statusCounts.safe}
//         evacuated={statusCounts.evacuated}
//         affected={statusCounts.affected}
//         missing={statusCounts.missing}
//       />
//     </Body>
//   )
// }
