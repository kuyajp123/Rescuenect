import { useTheme } from '@/contexts/ThemeContext';
import { Tabs, useRouter } from 'expo-router';
import { AlignRight, House, Info, Plus, UsersRound } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

// Custom Tab Bar Component with FAB
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleFABPress = () => {
    // Navigate to status screen or show modal
    router.push('/status' as any);
  };

  return (
    <View style={[
      styles.tabBarContainer,
      {
        backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
        borderTopColor: isDark ? Colors.border.dark : Colors.border.light,
        paddingBottom: Math.max(insets.bottom, 8),
        height: 60 + insets.bottom,
      }
    ]}>
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

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[
              styles.tabItem,
              // Add extra margin for tabs adjacent to FAB (community and details)
              (route.name === 'community') && styles.tabItemBeforeFAB,
              (route.name === 'details') && styles.tabItemAfterFAB,
            ]}
          >
            {getIcon()}
          </TouchableOpacity>
        );
      })}

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleFABPress}
        style={[
          styles.fab,
          {
            backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light,
          }
        ]}
      >
        <Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>
    </View>
  );
};

export default function TabLayout() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: Colors.brand.light,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',          
          tabBarIcon: ({ color }) => <House color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <UsersRound color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="status"
          options={{
          title: 'Status',
          tabBarIcon: ({ color }) => <Plus color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="details"
        options={{
          title: 'Details',
          tabBarIcon: ({ color }) => <Info color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <AlignRight color={color} size={20} />,
        }}
      />
    </Tabs>
  );
}

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
