import Body from '@/components/ui/Body';
import React from 'react';
import { StyleSheet } from 'react-native';

import { CarouselScreen } from '@/components/ui/carousel/CarouselScreen';
import type { StatusTemplateProps } from '@/components/ui/post-template/StatusTemplate';
import type { CarouselItem } from '@/components/ui/carousel/CarouselScreen';
import statusData from '../../data/statusData.json';
import mostNeedItem from '../../data/mostNeedItem.json';

export default function HomeScreen () {
  // Extract user data from statusData for the carousel
  const usersData = statusData.map((item: StatusTemplateProps) => ({
    firstName: item.firstName,
    lastName: item.lastName,
    profileImage: item.profileImage,
  }));

  // Convert statusData to CarouselItem format
  const mostNeededItem = mostNeedItem.map((item: CarouselItem) => ({
    id: item.id,
    category: item.category,
    current_item: item.current_item,
    target_item: item.target_item,
  }));

  return (
   <Body gap={10} >
      <CarouselScreen 
        data={mostNeedItem.length > 0 ? mostNeededItem as CarouselItem[] : []} 
        usersData={usersData}
      />
    </Body>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});