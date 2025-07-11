import type { CarouselItem, StatusTemplateProps } from '@/components/shared/types/components';
import { CarouselScreen } from '@/components/ui/carousel/CarouselScreen';
import { CommunityStatus } from '@/components/ui/community-status/CommunityStatus';
import { ListOfEvents } from '@/components/ui/data-display/ListOfEvents';
import Body from '@/components/ui/layout/Body';
import React from 'react';
import { StyleSheet } from 'react-native';
import mostNeedItem from '../../data/mostNeedItem.json';
import statusData from '../../data/statusData.json';

const community = () => {
// Calculate status counts from statusData
  const statusCounts = statusData.reduce((counts, person) => {
    const status = person.status?.toLowerCase();
    
    switch (status) {
      case 'safe':
        counts.safe += 1;
        break;
      case 'evacuated':
        counts.evacuated += 1;
        break;
      case 'affected':
        counts.affected += 1;
        break;
      case 'missing':
        counts.missing += 1;
        break;
      default:
        // Handle any unknown status or null/undefined status
        break;
    }
    return counts;
  }, {
    safe: 0,
    evacuated: 0,
    affected: 0,
    missing: 0
  });

  // carousel data preparation
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
   <Body gap={50} >
      <CommunityStatus
        safe={statusCounts.safe}
        evacuated={statusCounts.evacuated}
        affected={statusCounts.affected}
        missing={statusCounts.missing}
      />

      <CarouselScreen 
        // data={[]}
        data={mostNeededItem as CarouselItem[]} 
        usersData={usersData} // optional
      />
      <ListOfEvents />
    </Body>
  )
}

export default community

const styles = StyleSheet.create({})