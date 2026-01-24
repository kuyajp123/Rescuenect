import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { FileText, MapPin, Plus, CircleUserRound } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {actions.map(action => (
          <Pressable
            key={action.id}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: action.isPrimary
                  ? isDark
                    ? Colors.brand.dark
                    : Colors.brand.light
                  : isDark
                    ? Colors.muted.dark.background
                    : '#FFFFFF',
                opacity: pressed ? 0.95 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                borderColor: isDark ? '#333' : '#F0F0F0',
                borderWidth: action.isPrimary ? 0 : 1,
              },
            ]}
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
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text
                size="xs"
                bold
                style={{
                  color: action.isPrimary ? '#FFF' : isDark ? Colors.text.dark : Colors.text.light,
                }}
              >
                {action.label}
              </Text>
              <Text
                size="xs"
                style={{
                  marginTop: 2,
                  color: action.isPrimary
                    ? 'rgba(255,255,255,0.8)'
                    : isDark
                      ? Colors.muted.dark.text
                      : Colors.muted.light.text,
                }}
              >
                {action.subLabel}
              </Text>
            </View>
          </Pressable>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 24,
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
});
