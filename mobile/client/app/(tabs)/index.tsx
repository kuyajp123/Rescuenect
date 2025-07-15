import { StatusIndicator } from '@/components/ui/data-display/StatusIndicator';
import { Body } from '@/components/ui/layout/Body';
import { useTheme } from "@/contexts/ThemeContext";
import statusData from '@/data/statusData.json';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CardWeather } from '@/components/ui/weather/CardWeather';

export const HomeScreen = () => {
  const { isDark } = useTheme();

  const firstUser = statusData[0];
  const logedInUser = {
    firstName: 'John',
    lastName: 'Doe',
    profileImage: 'https://randomuser.me/api/portraits/men/11.jpg'
  };

  return (
    <Body gap={20}>
      {firstUser ? (
        <StatusIndicator user={firstUser} />
      ) : (
        <StatusIndicator logedInUser={logedInUser} />
      )}

      <CardWeather />
    </Body>
  )
}

export default HomeScreen;

const styles = StyleSheet.create({

})