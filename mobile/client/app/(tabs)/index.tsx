import { AdvancedCarousel } from '@/components/ui/carousel/AdvancedCarousel';
import { StatusIndicator } from '@/components/ui/data-display/StatusIndicator';
import { Body } from '@/components/ui/layout/Body';
import { CardWeather } from '@/components/ui/weather/CardWeather';
import { useTheme } from "@/contexts/ThemeContext";
import statusData from '@/data/statusData.json';
import React from 'react';
import { StyleSheet } from 'react-native';
import { MainPage } from '@/components/ui/weather/MainPage';
StatusIndicator
CardWeather
AdvancedCarousel

export const HomeScreen = () => {
  const { isDark } = useTheme();

  const firstUser = statusData[10];
  const logedInUser = {
    firstName: 'John',
    lastName: 'Doe',
    profileImage: 'https://randomuser.me/api/portraits/men/11.jpg'
  };

  return (
    <Body gap={20}>
        <CardWeather />

      {/* <StatusIndicator user={firstUser} logedInUser={logedInUser} />

      
      <View style={{ marginTop: 20 }}>
        <AdvancedCarousel />
      </View> */}
      <MainPage />
    </Body>
  )
}

export default HomeScreen;

const styles = StyleSheet.create({

})