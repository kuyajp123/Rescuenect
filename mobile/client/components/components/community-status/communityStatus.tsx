import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ColorCombinations, Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useStatusStore } from '@/store/useCurrentStatusStore';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native/button';
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';

type StatusKey = 'safe' | 'affected' | 'evacuated' | 'missing';

const STATUS_DOT_COLORS: Record<StatusKey, string> = {
  safe: Colors.semantic.success,
  affected: Colors.semantic.warning,
  evacuated: Colors.brand.light,
  missing: Colors.semantic.error,
};

const PIE_RADIUS = 58;
const PIE_INNER_RADIUS = 36;
const PIE_CENTER_SIZE = PIE_INNER_RADIUS * 2;
const CATEGORY_BAR_WIDTH = 18;
const CATEGORY_BAR_SPACING = 34;
const CATEGORY_LABEL_SLOT_WIDTH = CATEGORY_BAR_WIDTH + CATEGORY_BAR_SPACING;
const CATEGORY_LABEL_WIDTH = 92;
const CATEGORY_LABEL_HEIGHT = 96;
const CATEGORY_CHART_HORIZONTAL_PADDING = 64;

export const CommunityStatus = () => {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { statusCounts, statusData } = useStatusStore();
  const totalCount = Object.values(statusCounts).reduce((sum, value) => sum + value, 0);
  const chartTextColor = isDark ? Colors.text.dark : Colors.text.light;
  const categoryChartWidth = Math.max(240, width - CATEGORY_CHART_HORIZONTAL_PADDING);
  const categoryRulesLength = Math.max(180, categoryChartWidth - 36);
  const categoryRuleColor = isDark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.12)';

  const formatCategoryLabel = (value: string) => {
    return value.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  };

  const wrapCategoryLabel = (value: string) => {
    const words = value.split(/\s+/).filter(Boolean);

    if (value.length <= 16 || words.length < 2) {
      return value;
    }

    const midpoint = Math.ceil(words.length / 2);
    return `${words.slice(0, midpoint).join(' ')}\n${words.slice(midpoint).join(' ')}`;
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

  const renderCategoryLabel = (label: string) => (
    <View style={styles.categoryLabelSlot}>
      <Text
        size="2xs"
        numberOfLines={2}
        style={[styles.categoryLabelText, { color: chartTextColor }]}
      >
        {label}
      </Text>
    </View>
  );

  const barData = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => {
      const displayLabel = wrapCategoryLabel(formatCategoryLabel(label));

      return {
        value,
        label: displayLabel,
        labelWidth: CATEGORY_BAR_WIDTH,
        labelComponent: () => renderCategoryLabel(displayLabel),
        frontColor: barPalette[index % barPalette.length],
      };
    });

  const pieData = [
    { value: statusCounts.safe, color: STATUS_DOT_COLORS.safe, text: 'Safe' },
    { value: statusCounts.affected, color: STATUS_DOT_COLORS.affected, text: 'Affected' },
    { value: statusCounts.evacuated, color: STATUS_DOT_COLORS.evacuated, text: 'Evacuated' },
    { value: statusCounts.missing, color: STATUS_DOT_COLORS.missing, text: 'Missing' },
  ].filter(item => item.value > 0);

  return (
    <View>
      <VStack space="lg">
        <Text size="lg" bold>
          Status
        </Text>
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
              <View style={styles.categoryChartFrame}>
                <BarChart
                  data={barData}
                  height={150}
                  width={categoryChartWidth}
                  barWidth={CATEGORY_BAR_WIDTH}
                  spacing={CATEGORY_BAR_SPACING}
                  initialSpacing={40}
                  endSpacing={42}
                  disableScroll={barData.length <= 3}
                  showScrollIndicator={barData.length > 3}
                  roundedTop
                  xAxisTextNumberOfLines={2}
                  xAxisLabelsHeight={CATEGORY_LABEL_HEIGHT}
                  labelsDistanceFromXaxis={24}
                  xAxisLabelsVerticalShift={22}
                  labelsExtraHeight={36}
                  yAxisLabelWidth={30}
                  hideYAxisText={false}
                  yAxisThickness={0}
                  xAxisThickness={0}
                  rulesType="solid"
                  rulesColor={categoryRuleColor}
                  rulesThickness={1}
                  rulesLength={categoryRulesLength}
                  xAxisLabelTextStyle={{
                    color: chartTextColor,
                    fontSize: 10,
                    lineHeight: 12,
                    textAlign: 'right',
                    width: CATEGORY_LABEL_WIDTH,
                  }}
                  yAxisTextStyle={{
                    color: chartTextColor,
                    fontSize: 10,
                    textAlign: 'right',
                  }}
                />
              </View>
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
                  radius={PIE_RADIUS}
                  innerRadius={PIE_INNER_RADIUS}
                  centerLabelComponent={() => (
                    <View
                      style={[
                        styles.pieCenter,
                        {
                          backgroundColor: isDark
                            ? ColorCombinations.statusTemplate.dark
                            : ColorCombinations.statusTemplate.light,
                        },
                      ]}
                    >
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
  categoryChartFrame: {
    minHeight: 268,
    paddingTop: 4,
    overflow: 'hidden',
  },
  categoryLabelSlot: {
    width: CATEGORY_LABEL_SLOT_WIDTH,
    height: CATEGORY_LABEL_HEIGHT,
    overflow: 'visible',
  },
  categoryLabelText: {
    position: 'absolute',
    top: 4,
    left: CATEGORY_LABEL_SLOT_WIDTH / 2 - CATEGORY_LABEL_WIDTH,
    width: CATEGORY_LABEL_WIDTH,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'right',
    transform: [{ rotate: '-45deg' }],
    transformOrigin: 'right top',
  },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  pieCenter: {
    width: PIE_CENTER_SIZE,
    height: PIE_CENTER_SIZE,
    borderRadius: PIE_CENTER_SIZE / 2,
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
