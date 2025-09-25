import { CustomTabBar } from "@/components/components/_layout/CustomTabBar";
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Tabs } from 'expo-router';
import { AlignRight, House, Info, UsersRound } from 'lucide-react-native';
import React from 'react';

export const TabLayout = () => {
  const { isDark } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: isDark ? Colors.brand.dark : Colors.brand.light,
        headerShown: false,
        lazy: true, // Enable lazy loading
        tabBarHideOnKeyboard: true, // Hide tab bar when keyboard is open
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
        name="contacts"
        options={{
          title: 'Contacts',
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

export default TabLayout;
