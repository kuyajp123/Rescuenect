import { useTheme } from '@/contexts/ThemeContext';
import { Tabs } from 'expo-router';
import { AlignRight, House, Info, UsersRound } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.brand.light,
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
            paddingBottom: insets.bottom, // Add padding for home indicator
          },
          default: {
            // Use a solid background on Android
            paddingTop: 2,
            paddingBottom: Math.max(insets.bottom, 8), // Ensure minimum padding but respect home indicator
            backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            borderTopWidth: 0,
            height: 60 + insets.bottom, // Adjust height to include safe area
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <House color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <UsersRound color={color} size={24} />,
        }}
      />
      {/* <Tabs.Screen
        name="addStatus"
        options={{
          title: 'Status',
          tabBarIcon: ({ color }) => <Plus color={color} size={24} />,
        }}
      /> */}
      <Tabs.Screen
        name="details"
        options={{
          title: 'Details',
          tabBarIcon: ({ color }) => <Info color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <AlignRight color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
