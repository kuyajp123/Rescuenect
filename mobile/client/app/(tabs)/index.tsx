import Body from '@/components/ui/Body';
import { Card } from '@/components/ui/Card';
import { AdvancedCarousel } from '@/components/ui/carousel/AdvancedCarousel';
import type { CarouselItem } from '@/components/ui/carousel/CarouselScreen';
import { CarouselScreen } from '@/components/ui/carousel/CarouselScreen';
import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';
import mostNeededItem from '../../data/mostNeedItem.json';
import type { StatusTemplateProps } from '@/components/ui/post-template/StatusTemplate';
import statusData from '../../data/statusData.json';

export default function HomeScreen () {
  // Extract user data from statusData for the carousel
  const usersData = statusData.map((item: StatusTemplateProps) => ({
    firstName: item.firstName,
    lastName: item.lastName,
    profileImage: item.profileImage,
  }));

  console.log('Users Data:', usersData);

  return (
    <View>
      <Body gap={10} >
      <Card>
        <Text size="md" emphasis="bold" style={{ textAlign: 'center' }}>
          Welcome to Rescuenect!
        </Text>
        <Text style={{ textAlign: 'center', marginTop: 10 }}>
          This is the home screen. Navigate to the tabs below to explore more.
        </Text>
      </Card>
      <AdvancedCarousel />
      <CarouselScreen 
        data={mostNeededItem as CarouselItem[]} 
        usersData={usersData}
      />
    </Body>
    </View>
  )
}