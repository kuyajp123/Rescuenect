import { PrimaryButton } from '@/components/ui/button/Button';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ColorCombinations, Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export interface CommunityStatusProps {
    safe: number | null
    evacuated: number | null
    affected: number | null
    missing: number | null
}

// Status Card Component
const StatusCard = ({ 
    status, 
    count, 
    label, 
    colorClass, 
    onPress 
}: { 
    status: string;
    count: number;
    label: string;
    colorClass: string;
    onPress: () => void;
}) => {
    const { isDark } = useTheme();
    
    return (
        <TouchableOpacity 
            style={styles.statusCard} 
            activeOpacity={1} 
            onPress={onPress}
        >
            <View style={styles.statusHeader}>
                <View style={styles.statusDot} className={colorClass} />
                <Text>{label}</Text>
            </View>
            <View style={styles.statusContent}>
                <Text size='xl'>{count}</Text>
                <ChevronRight color={isDark ? Colors.icons.light : Colors.icons.dark} />
            </View>
            <View>
                <Text emphasis='light' size='2xs'>Individual</Text>
            </View>
        </TouchableOpacity>
    );
};

export const communityStatus = ({ 
    safe, 
    evacuated, 
    affected, 
    missing 
}: CommunityStatusProps) => {
    const { isDark } = useTheme();

    return (
        <View>
            <VStack space='lg'>
                <Text>Community Status</Text>
                <View>
                    <View style={[
                        styles.statusContainer,
                        { backgroundColor: isDark ? ColorCombinations.statusTemplate.dark : ColorCombinations.statusTemplate.light }
                    ]}>
                        <View style={styles.leftColumn}>
                            <StatusCard 
                                status="safe"
                                count={safe ?? 0}
                                label="Safe"
                                colorClass="bg-safe-500"
                                onPress={() => alert('Safe pressed!')}
                            />
                            <StatusCard 
                                status="affected"
                                count={affected ?? 0}
                                label="Affected"
                                colorClass="bg-affected-500"
                                onPress={() => alert('affected pressed!')}
                            />
                        </View>

                        <View style={styles.rightColumn}>
                            <StatusCard 
                                status="evacuated"
                                count={evacuated ?? 0}
                                label="Evacuated"
                                colorClass="bg-evacuated-500"
                                onPress={() => alert('evacuated pressed!')}
                            />
                            <StatusCard 
                                status="missing"
                                count={missing ?? 0}
                                label="Missing"
                                colorClass="bg-missing-500"
                                onPress={() => alert('missing pressed!')}
                            />
                        </View>
                    </View>
                    <PrimaryButton onPress={() => alert('Primary pressed!')}>
                        View all Status
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
        alignItems: 'center',
        gap: 5,
        marginBottom: 20,
        borderRadius: 10,
    },
    leftColumn: {
        width: '45%',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
    },
    rightColumn: {
        width: '45%',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
    },
    statusCard: {
        padding: 10,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
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
        justifyContent: 'space-between',
        marginTop: 2,
    },
});

// Usage Example:

// import { communityStatus as CommunityStatus } from '@/components/ui/community-status/communityStatus';
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