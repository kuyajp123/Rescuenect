import { CarouselScreen } from "@/components/components/carousel/CarouselScreen";
import { CommunityStatus } from "@/components/components/community-status/communityStatus";
import { ListOfEvents } from "@/components/components/data-display/ListOfEvents";
import type { CarouselItem, StatusTemplateProps } from "@/types/components";
import Body from "@/components/ui/layout/Body";
import { Text } from "@/components/ui/text";
import mostNeedItem from "@/data/mostNeedItem.json";
import statusData from "@/data/statusData.json";
import React from "react";
import { View } from "react-native";

const community = () => {
  // Calculate status counts from statusData
  const statusCounts = statusData.reduce(
    (counts, person) => {
      const status = person.status?.toLowerCase();

      switch (status) {
        case "safe":
          counts.safe += 1;
          break;
        case "evacuated":
          counts.evacuated += 1;
          break;
        case "affected":
          counts.affected += 1;
          break;
        case "missing":
          counts.missing += 1;
          break;
        default:
          break;
      }
      return counts;
    },
    {
      safe: 0,
      evacuated: 0,
      affected: 0,
      missing: 0,
    }
  );

  // carousel data preparation
  const usersData = statusData.map((item: StatusTemplateProps) => ({
    firstName: item.firstName,
    lastName: item.lastName,
    profileImage: item.picture,
  }));

  // Convert statusData to CarouselItem format
  const mostNeededItem = mostNeedItem.map((item: CarouselItem) => ({
    id: item.id,
    category: item.category,
    current_item: item.current_item,
    target_item: item.target_item,
  }));

  return (
    <Body gap={50}>
      <View>
        <Text size="3xl" bold>
          Community
        </Text>
      </View>

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
  );
};

export default community;
