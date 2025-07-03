import { Tabs } from 'expo-router';
import { AlignRight, House, Info, UsersRound } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {

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
          },
        }),
      }}>
      <Tabs.Screen
        name="home"
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
