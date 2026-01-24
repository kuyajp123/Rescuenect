import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { AlignRight, House, MapPinPlus, MapPlus, Phone, Plus, UsersRound } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleFABPress = () => {
    // const sheet = require('react-native-actions-sheet').SheetManager;
    // sheet.show('FAB', {
    //   payload: {
    //     items: actionSheetItems,
    //   },
    // });
    router.push('status/createStatus' as any);
  };

  const handleCreateStatusPress = () => {
    router.push('status/createStatus' as any);
    const sheet = require('react-native-actions-sheet').SheetManager;
    sheet.hide('FAB');
  };

  const handleCityReportsPress = () => {
    // Add navigation to city needs page here if needed
    router.push('status/cityReports' as any);
    const sheet = require('react-native-actions-sheet').SheetManager;
    sheet.hide('FAB');
  };

  // Action sheet items
  const actionSheetItems = [
    {
      id: 'createStatus',
      name: 'Create Status',
      icon: <MapPinPlus size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />,
      onPress: handleCreateStatusPress,
    },
    {
      id: 'cityReports',
      name: 'City Reports',
      icon: <MapPlus size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />,
      onPress: handleCityReportsPress,
    },
  ];

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
          borderTopColor: isDark ? Colors.border.dark : Colors.border.light,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 75 + insets.bottom, // Increased height to accommodate labels
        },
      ]}
      accessibilityRole="tablist"
      accessibilityLabel="Bottom navigation tabs"
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        // For 4 tabs, FAB should be between community (index 1) and contacts (index 2)
        // So we adjust spacing for these tabs but don't skip any
        const isBeforeFAB = index === 1; // community
        const isAfterFAB = index === 2; // contacts

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

        // Get the appropriate icon
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

        // Get accessibility label based on route name
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
            style={[
              styles.tabItem,
              // Add extra margin for tabs adjacent to FAB
              isBeforeFAB && styles.tabItemBeforeFAB,
              isAfterFAB && styles.tabItemAfterFAB,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={getAccessibilityLabel()}
            accessibilityHint={getAccessibilityHint()}
          >
            {getIcon()}
            <Text
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

      {/* Floating Action Button */}
      <Pressable
        onPress={handleFABPress}
        style={[
          styles.fab,
          {
            backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add status update"
        accessibilityHint="Opens status update screen to post your safety status"
      >
        <Plus color="#FFFFFF" size={24} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    // borderTopColor moved to inline style for theme awareness
    paddingTop: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  tabItemBeforeFAB: {
    marginRight: 28, // Extra space before FAB
  },
  tabItemAfterFAB: {
    marginLeft: 28, // Extra space after FAB
  },
  fab: {
    position: 'absolute',
    top: -20, // Raised above the tab bar
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF', // White border around FAB
  },
});
