import { AdvancedCarousel } from '@/components/components/carousel/AdvancedCarousel';
import StatusIndicator from '@/components/components/data-display/StatusIndicator';
import { CardWeather } from '@/components/components/weather/CardWeather';
import { Body } from '@/components/ui/layout/Body';
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