import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { AlignRight, House, Info, Plus, UsersRound, MapPinPlus, MapPlus } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

export const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const [showActionsheet, setShowActionsheet] = React.useState(false)
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleFABPress = useCallback(() => {
    setShowActionsheet(true);
  }, []);

  const handleCloseActionsheet = useCallback(() => {
    setShowActionsheet(false);
  }, []);

  const handleCreateStatusPress = useCallback(() => {
    setShowActionsheet(false);
    router.push('/createStatus' as any);
  }, [router]);

  const handleCityNeedsPress = useCallback(() => {
    setShowActionsheet(false);
    // Add navigation to city needs page here if needed
    // router.push('/cityNeeds' as any);
  }, []);

  return (
    <View style={[
      styles.tabBarContainer,
      {
        backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
        borderTopColor: isDark ? Colors.border.dark : Colors.border.light,
        paddingBottom: Math.max(insets.bottom, 8),
        height: 75 + insets.bottom, // Increased height to accommodate labels
      }
    ]}
    accessibilityRole="tablist"
    accessibilityLabel="Bottom navigation tabs"
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
          ? options.title
          : route.name;

        const isFocused = state.index === index;
        const isMiddle = index === 2; // Status tab (middle position)

        // Skip rendering the middle tab normally, we'll handle it with FAB
        if (isMiddle) return null;

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
          const color = isFocused ? Colors.brand.light : (isDark ? Colors.text.dark : Colors.text.light);
          const size = 20;
          
          switch (route.name) {
            case 'index': return <House color={color} size={size} />;
            case 'community': return <UsersRound color={color} size={size} />;
            case 'details': return <Info color={color} size={size} />;
            case 'menu': return <AlignRight color={color} size={size} />;
            default: return null;
          }
        };

        // Get accessibility label based on route name
        const getAccessibilityLabel = () => {
          const baseLabels = {
            'index': 'Home',
            'community': 'Community',
            'details': 'Details',
            'menu': 'Menu'
          };
          
          const baseLabel = baseLabels[route.name as keyof typeof baseLabels] || label;
          return `${baseLabel} tab${isFocused ? ', selected' : ''}`;
        };

        const getAccessibilityHint = () => {
          const hints = {
            'index': 'Navigate to home screen with dashboard and overview',
            'community': 'Navigate to community screen to see status updates and posts',
            'details': 'Navigate to details screen for additional information',
            'menu': 'Navigate to menu screen for app settings and options'
          };
          
          return hints[route.name as keyof typeof hints] || `Navigate to ${label} screen`;
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[
              styles.tabItem,
              // Add extra margin for tabs adjacent to FAB (community and details)
              (route.name === 'community') && styles.tabItemBeforeFAB,
              (route.name === 'details') && styles.tabItemAfterFAB,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={getAccessibilityLabel()}
            accessibilityHint={getAccessibilityHint()}
          >
            {getIcon()}
            <Text style={[
              styles.tabLabel,
              {
                color: isFocused ? Colors.brand.light : (isDark ? Colors.text.dark : Colors.text.light),
              }
            ]}>
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
          }
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add status update"
        accessibilityHint="Opens status update screen to post your safety status"
      >
        <Plus color="#FFFFFF" size={24} />
      </Pressable>

      {/* Actionsheet */}
      <Actionsheet isOpen={showActionsheet} onClose={handleCloseActionsheet}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <ActionsheetItem onPress={handleCreateStatusPress}>
            <MapPinPlus size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
            <ActionsheetItemText>Create Status</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={handleCityNeedsPress}>
            <MapPlus size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
            <ActionsheetItemText>City Needs</ActionsheetItemText>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>
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