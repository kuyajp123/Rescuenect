import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AlignRight, House, MapPinPlus, Phone, Plus, TriangleAlert, UsersRound } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleFABPress = () => {
    const sheet = require('react-native-actions-sheet').SheetManager;
    sheet.show('FAB', {
      payload: {
        items: actionSheetItems,
      },
    });
  };

  const handleCreateStatusPress = () => {
    router.push('status/createStatus' as any);
    const sheet = require('react-native-actions-sheet').SheetManager;
    sheet.hide('FAB');
  };

  const handleReportDangerZonePress = () => {
    router.push('danger-zone/create' as any);
    const sheet = require('react-native-actions-sheet').SheetManager;
    sheet.hide('FAB');
  };

  const actionSheetItems = [
    {
      id: 'createStatus',
      name: 'Create Status',
      icon: <MapPinPlus size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />,
      onPress: handleCreateStatusPress,
    },
    {
      id: 'reportDangerZone',
      name: 'Report Danger Zone',
      icon: <TriangleAlert size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />,
      onPress: handleReportDangerZonePress,
    },
  ];

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          bottom: Math.max(insets.bottom, 12),
        },
      ]}
      accessibilityRole="tablist"
      accessibilityLabel="Bottom navigation tabs"
    >
      <View
        style={[
          styles.glassPill,
          {
            backgroundColor: isDark ? 'rgba(20, 22, 27, 0.7)' : 'rgba(255, 255, 255, 0.74)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.65)',
            shadowColor: isDark ? '#000000' : '#1f2937',
          },
        ]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0)', 'rgba(0, 0, 0, 0.16)']
              : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0)', 'rgba(0, 0, 0, 0.06)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glassHighlight}
        />
        <LinearGradient
          pointerEvents="none"
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0)']
              : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.glassSheen}
        />
        <LinearGradient
          pointerEvents="none"
          colors={isDark ? ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.25)'] : ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.glassShade}
        />
        <View
          pointerEvents="none"
          style={[
            styles.glassInnerBorder,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.75)',
            },
          ]}
        />
        {/* <View
          pointerEvents="none"
          style={[
            styles.glassBubble,
            styles.glassBubbleLeft,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.45)',
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.glassBubble,
            styles.glassBubbleRight,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.35)',
            },
          ]}
        /> */}
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const getIcon = () => {
            const color = isFocused
              ? isDark
                ? Colors.brand.dark
                : Colors.brand.light
              : isDark
                ? Colors.text.dark
                : Colors.text.light;
            const size = 20;

            switch (route.name) {
              case 'index':
                return <House color={color} size={size} />;
              case 'community':
                return <UsersRound color={color} size={size} />;
              case 'contacts':
                return <Phone color={color} size={size} />;
              case 'menu':
                return <AlignRight color={color} size={size} />;
              default:
                return null;
            }
          };

          const getAccessibilityLabel = () => {
            const baseLabels = {
              index: 'Home',
              community: 'Community',
              contacts: 'Contacts',
              menu: 'Menu',
            };

            const baseLabel = baseLabels[route.name as keyof typeof baseLabels] || label;
            return `${baseLabel} tab${isFocused ? ', selected' : ''}`;
          };

          const getAccessibilityHint = () => {
            const hints = {
              index: 'Navigate to home screen with dashboard and overview',
              community: 'Navigate to community screen to see status updates and posts',
              contacts: 'Navigate to contacts screen for managing your connections',
              menu: 'Navigate to menu screen for app settings and options',
            };

            return hints[route.name as keyof typeof hints] || `Navigate to ${label} screen`;
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={getAccessibilityLabel()}
              accessibilityHint={getAccessibilityHint()}
            >
              {getIcon()}
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused
                      ? isDark
                        ? Colors.brand.dark
                        : Colors.brand.light
                      : isDark
                        ? Colors.text.dark
                        : Colors.text.light,
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={handleFABPress}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Create report or status"
        accessibilityHint="Opens actions for creating a status or reporting a danger zone"
      >
        <LinearGradient
          pointerEvents="none"
          colors={isDark ? ['#1d4ed8', '#3b82f6', '#60a5fa'] : ['#0ea5e9', '#38bdf8', '#7dd3fc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        />
        {/* <LinearGradient
          pointerEvents="none"
          colors={['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.fabGloss}
        /> */}
        <Plus color="#FFFFFF" size={24} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 12,
    gap: 12,
    zIndex: 50,
    elevation: 50,
  },
  glassPill: {
    flex: 1,
    maxWidth: 420,
    minHeight: 62,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  glassHighlight: {
    ...StyleSheet.absoluteFillObject,
  },
  glassSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  glassShade: {
    ...StyleSheet.absoluteFillObject,
  },
  glassInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 999,
  },
  glassBubble: {
    position: 'absolute',
    borderRadius: 999,
  },
  glassBubbleLeft: {
    width: 70,
    height: 70,
    top: -30,
    left: 30,
  },
  glassBubbleRight: {
    width: 52,
    height: 52,
    bottom: -20,
    right: 40,
  },
  tabItem: {
    flex: 1,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 12,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 80,
    includeFontPadding: false,
    flexShrink: 1,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  fabGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  fabGloss: {
    ...StyleSheet.absoluteFillObject,
  },
});
