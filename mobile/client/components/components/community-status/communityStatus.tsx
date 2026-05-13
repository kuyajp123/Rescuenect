import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ColorCombinations, Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useStatusStore } from '@/store/useCurrentStatusStore';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native/button';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';

type StatusKey = 'safe' | 'affected' | 'evacuated' | 'missing';

const STATUS_DOT_COLORS: Record<StatusKey, string> = {
  safe: Colors.semantic.success,
  affected: Colors.semantic.warning,
  evacuated: Colors.brand.light,
  missing: Colors.semantic.error,
};

export const CommunityStatus = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const { statusCounts, statusData } = useStatusStore();
  const totalCount = Object.values(statusCounts).reduce((sum, value) => sum + value, 0);

  const formatCategoryLabel = (value: string) => {
    return value.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  };

  const normalizeCategories = (value: unknown) => {
    if (Array.isArray(value)) {
      return value.map(item => String(item)).filter(Boolean);
    }

    if (typeof value !== 'string') {
      return [];
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item)).filter(Boolean);
        }
      } catch {
        return [];
      }
    }

    return trimmed
      .split(',')
      .map(item => item.replace(/[\[\]"]+/g, '').trim())
      .filter(Boolean);
  };

  const categoryCounts = statusData.reduce<Record<string, number>>((acc, status) => {
    const categories = normalizeCategories((status as { category?: unknown }).category);
    categories.forEach(item => {
      acc[item] = (acc[item] || 0) + 1;
    });
    return acc;
  }, {});

  const barPalette = [
    Colors.brand.light,
    Colors.semantic.warning,
    Colors.semantic.success,
    Colors.semantic.error,
    Colors.semantic.info,
    Colors.icons.light,
  ];
  const barLabelWidth = 110;

  const barData = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({
      value,
      label: formatCategoryLabel(label),
      frontColor: barPalette[index % barPalette.length],
    }));

  const pieData = [
    { value: statusCounts.safe, color: STATUS_DOT_COLORS.safe, text: 'Safe' },
    { value: statusCounts.affected, color: STATUS_DOT_COLORS.affected, text: 'Affected' },
    { value: statusCounts.evacuated, color: STATUS_DOT_COLORS.evacuated, text: 'Evacuated' },
    { value: statusCounts.missing, color: STATUS_DOT_COLORS.missing, text: 'Missing' },
  ].filter(item => item.value > 0);

  return (
    <View>
      <VStack space="lg">
        <Text>Status</Text>
        <View>
          <View
            style={[
              styles.chartCard,
              {
                backgroundColor: isDark
                  ? ColorCombinations.statusTemplate.dark
                  : ColorCombinations.statusTemplate.light,
              },
            ]}
          >
            <Text size="sm" bold>
              Status Categories
            </Text>
            {barData.length > 0 ? (
              <BarChart
                data={barData}
                barWidth={16}
                spacing={22}
                initialSpacing={12}
                endSpacing={16}
                disableScroll={false}
                showScrollIndicator
                roundedTop
                rotateLabel
                xAxisTextNumberOfLines={1}
                xAxisLabelsHeight={64}
                labelsDistanceFromXaxis={16}
                xAxisLabelsVerticalShift={12}
                labelsExtraHeight={16}
                yAxisLabelWidth={30}
                hideYAxisText={false}
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={{
                  color: isDark ? Colors.text.dark : Colors.text.light,
                  fontSize: 10,
                  textAlign: 'left',
                  width: barLabelWidth,
                  alignSelf: 'center',
                }}
                yAxisTextStyle={{
                  color: isDark ? Colors.text.dark : Colors.text.light,
                  fontSize: 10,
                  textAlign: 'right',
                }}
              />
            ) : (
              <Text size="2xs" emphasis="light" style={styles.emptyText}>
                No category data yet.
              </Text>
            )}
          </View>

          <View
            style={[
              styles.chartCard,
              {
                backgroundColor: isDark
                  ? ColorCombinations.statusTemplate.dark
                  : ColorCombinations.statusTemplate.light,
              },
            ]}
          >
            <Text size="sm" bold>
              Status Breakdown
            </Text>
            {totalCount > 0 ? (
              <View style={styles.pieRow}>
                <PieChart
                  data={pieData}
                  donut
                  radius={58}
                  innerRadius={36}
                  centerLabelComponent={() => (
                    <View style={styles.pieCenter}>
                      <Text size="sm" bold>
                        {totalCount}
                      </Text>
                      <Text size="2xs" emphasis="light">
                        Total
                      </Text>
                    </View>
                  )}
                />
                <View style={styles.legendColumn}>
                  {pieData.map(item => (
                    <View key={item.text} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text size="2xs" style={styles.legendLabel}>
                        {item.text}
                      </Text>
                      <Text size="2xs" style={styles.legendValue}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text size="2xs" emphasis="light" style={styles.emptyText}>
                No status data yet.
              </Text>
            )}
          </View>

          <Button style={styles.viewAllButton} onPress={() => router.push('post/status' as any)}>
            <Text style={{ color: '#ffffff' }} bold>
              View all Status
            </Text>
          </Button>
        </View>
      </VStack>
    </View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  pieCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendColumn: {
    flex: 1,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendLabel: {
    flex: 1,
  },
  legendValue: {
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 8,
  },
  viewAllButton: {
    borderRadius: 10,
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
