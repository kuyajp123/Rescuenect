import { AdvancedCarousel } from '@/components/ui/carousel/AdvancedCarousel';
import { StatusIndicator } from '@/components/ui/data-display/StatusIndicator';
import { Body } from '@/components/ui/layout/Body';
import { CardWeather } from '@/components/ui/weather/CardWeather';
import statusData from '@/data/statusData.json';
import React, { useMemo } from 'react';
import { View } from 'react-native';


export const HomeScreen = React.memo(() => {
  const firstUser = useMemo(() => statusData[10], []);
  const logedInUser = useMemo(() => ({
    firstName: 'John',
    lastName: 'Doe',
    profileImage: 'https://randomuser.me/api/portraits/men/11.jpg'
  }), []);

  return (
      <Body gap={20}>
        <StatusIndicator user={firstUser} logedInUser={logedInUser} />
        <CardWeather />

        <View style={{ marginTop: 20 }}>
          <AdvancedCarousel />
        </View>
      </Body>
  )
})

export default HomeScreen;