import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
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
      subLabel: 'Share Update',
      icon: <Plus size={26} color={isDark ? Colors.brand.dark : Colors.brand.light} />,
      route: '/status/createStatus',
      isPrimary: false,
    },
    {
      id: 'view',
      label: 'View Feed',
      subLabel: 'Community',
      icon: <FileText size={26} color={isDark ? Colors.brand.dark : Colors.brand.light} />,
      route: '/post/status',
      isPrimary: false,
    },
    {
      id: 'evacuation',
      label: 'Evacuation',
      subLabel: 'Centers',
      icon: <MapPin size={26} color={isDark ? Colors.brand.dark : Colors.brand.light} />,
      route: '/evacuation',
      isPrimary: false,
    },
    {
      id: 'profile',
      label: 'My Profile',
      subLabel: 'Account',
      icon: <CircleUserRound size={26} color={isDark ? Colors.brand.dark : Colors.brand.light} />,
      route: '/profile',
      isPrimary: false,
    },
  ];

  const rows = [actions.slice(0, 2), actions.slice(2, 4)];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map(action => (
              <Button
                key={action.id}
                variant="ghost"
                style={styles.buttons}
                feedbackVariant="none"
                onPress={() => router.push(action.route as any)}
              >
                <View
                  style={[
                    styles.iconWrapper,
                    {
                      backgroundColor: action.isPrimary
                        ? 'rgba(255,255,255,0.2)'
                        : isDark
                          ? 'rgba(255,255,255,0.05)'
                          : Colors.muted.light.background,
                    },
                  ]}
                >
                  {action.icon}
                </View>
                <View style={styles.labelWrapper}>
                  <Text
                    size="sm"
                    bold
                    style={[
                      styles.labelText,
                      {
                        color: action.isPrimary ? '#FFF' : isDark ? Colors.text.dark : Colors.text.light,
                      },
                    ]}
                  >
                    {action.label}
                  </Text>
                  <Text
                    size="xs"
                    style={[
                      styles.subLabelText,
                      {
                        color: action.isPrimary
                          ? 'rgba(255,255,255,0.8)'
                          : isDark
                            ? Colors.muted.dark.text
                            : Colors.muted.light.text,
                      },
                    ]}
                  >
                    {action.subLabel}
                  </Text>
                </View>
              </Button>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default QuickActions;

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  headerTitle: {
    marginBottom: 16,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'column',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  buttons: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 112,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  labelWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  labelText: {
    width: '100%',
    textAlign: 'center',
  },
  subLabelText: {
    marginTop: 2,
    width: '100%',
    textAlign: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
