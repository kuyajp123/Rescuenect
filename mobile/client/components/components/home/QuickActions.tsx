import { Text } from '@/components/ui/text';
import { ColorCombinations, Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native/button';
import { CircleUserRound, FileText, MapPin, Plus } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const QuickActions = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  const actions = [
    {
      id: 'create',
      label: 'Create Status',
      icon: Plus,
      route: '/status/createStatus',
    },
    {
      id: 'view',
      label: 'View Feed',
      icon: FileText,
      route: '/post/status',
    },
    {
      id: 'evacuation',
      label: 'Evacuation',
      icon: MapPin,
      route: '/evacuation',
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: CircleUserRound,
      route: '/profile',
    },
  ];
  const iconColor = isDark ? Colors.brand.dark : Colors.brand.light;
  const labelColor = isDark ? Colors.text.dark : Colors.text.light;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? Colors.border.dark : Colors.muted.light.background, borderRadius: 15 },
      ]}
    >
      <View style={styles.row}>
        {actions.map(action => {
          const Icon = action.icon;

          return (
            <Button
              key={action.id}
              variant="ghost"
              style={styles.actionButton}
              feedbackVariant="none"
              onPress={() => router.push(action.route as any)}
            >
              <View style={styles.actionContent}>
                <View style={styles.iconWrapper}>
                  <Icon size={28} color={iconColor} />
                </View>
                <Text size="2xs" bold numberOfLines={2} style={[styles.labelText, { color: labelColor }]}>
                  {action.label}
                </Text>
              </View>
            </Button>
          );
        })}
      </View>
    </View>
  );
};

export default QuickActions;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 2,
    minHeight: 96,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  labelText: {
    width: '100%',
    textAlign: 'center',
    lineHeight: 14,
    flexWrap: 'wrap',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
