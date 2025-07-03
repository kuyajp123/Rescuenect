import { useTheme } from '@/contexts/ThemeContext';
import { Tabs } from 'expo-router';
import { AlignRight, House, Info, UsersRound } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Text } from '@/components/ui/text';

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.brand.light,
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {
            // Use a solid background on Android
            paddingTop: 2,
            backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
            borderTopWidth: 0,
          },
        }),
      }}>
      <Tabs.Screen
        name="home"
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
