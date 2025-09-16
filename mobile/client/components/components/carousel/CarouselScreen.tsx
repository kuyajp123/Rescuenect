import { Button } from "@/components/components/button/Button";
import { Card } from "@/components/components/card/Card";
import { EmptyState } from "@/components/components/empty-state/EmptyState";
import type { CarouselItem, UserData } from "@/types/components";
import {
  Avatar,
  AvatarFallbackText,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { ColorCombinations, Colors } from "@/constants/Colors";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import Carousel from "react-native-reanimated-carousel";

// Get screen width for responsive carousel
const { width: screenWidth } = Dimensions.get("window");

interface CarouselScreenProps {
  data: CarouselItem[];
  usersData?: UserData[]; // Array of user data
}

export const CarouselScreen = ({
  data,
  usersData = [],
}: CarouselScreenProps) => {
  const { isDark } = useTheme();
  const router = useRouter();

  // Helper function to format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: CarouselItem;
    index: number;
  }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark
            ? ColorCombinations.card_dark.background
            : ColorCombinations.card.Background,
          borderColor: isDark ? Colors.border.dark : Colors.border.light,
        },
      ]}
    >
      <View>
        <Text size="sm" bold>
          {item.category}
        </Text>
      </View>
      <View style={styles.current_item_container}>
        <Text size="lg" bold>
          {formatNumber(item.target_item - item.current_item)}
        </Text>
        <Text size="2xs" emphasis="light">
          need more items
        </Text>
      </View>
      <View>
        <Text
          size="2xs"
          bold
          style={{ color: isDark ? Colors.brand.dark : Colors.brand.light }}
        >
          {Math.round((item.current_item / item.target_item) * 100)}%
        </Text>
        <Progress
          value={(item.current_item / item.target_item) * 100}
          size="xs"
          orientation="horizontal"
        >
          <ProgressFilledTrack
            style={{
              backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light,
            }}
          />
        </Progress>
      </View>
      <View style={styles.current_target_item_container}>
        <Text size="2xs">Current: {formatNumber(item.current_item)}</Text>
        <Text size="2xs">Target: {formatNumber(item.target_item)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.title_container}>
        <Text size="sm" bold>
          Donation Drives
        </Text>
        <Text
          emphasis="medium"
          style={{
            color: isDark ? Colors.text.dark : Colors.text.light,
            opacity: 0.8,
            marginTop: 4,
          }}
        >
          Your contribution can save lives
        </Text>
      </View>

      <View>
        <EmptyState
          title="Support Our Cause"
          subtitle="Join us in making a difference"
          animationSource={require("@/assets/animations/Muslim gives alms of zakat in Ramadan 2021.json")}
          animationSize={180}
          autoPlay={false}
        />
      </View>

      <View>
        <Text>
          Help us reach our goal of providing essential items to those in need.
          Every donation counts, no matter how small.
        </Text>
      </View>

      {data.length > 0 &&
        data.some((item) => item.target_item - item.current_item > 0) && (
          <View style={{ marginBottom: 0, marginTop: 10 }}>
            <Text
              size="sm"
              bold
              style={{
                color: isDark ? Colors.text.dark : Colors.text.light,
                opacity: 0.9,
              }}
            >
              📦 Most needed items:
            </Text>
            <Carousel
              loop={false}
              width={screenWidth * 0.75} // Further reduced to show more of next item (25% peek)
              height={180} // Increased height to accommodate dynamic content
              data={data}
              scrollAnimationDuration={200}
              renderItem={renderItem}
              style={styles.carousel}
            />
          </View>
        )}

      <Button
        action="primary"
        variant="solid"
        style={{ marginTop: 20, alignSelf: "center" }}
        onPress={() => alert("Donate Now")}
      >
        <Text style={{ color: "#ffffff" }} bold>
          Donate Now
        </Text>
      </Button>

      {usersData.length > 0 && (
        <TouchableOpacity
          onPress={() => router.push("/post/donation")}
          activeOpacity={1}
        >
          <Card style={{ marginTop: 20 }}>
            <HStack>
              <Text size="sm" bold style={{ marginBottom: 20 }}>
                👥 Recent Contributors
              </Text>
            </HStack>
            <HStack style={{ gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <AvatarGroup>
                {usersData.slice(0, 5).map((user, index) => (
                  <Avatar key={index} size="sm">
                    <AvatarFallbackText>
                      {user.firstName} {user.lastName}
                    </AvatarFallbackText>
                    <AvatarImage
                      source={{
                        uri: user.profileImage,
                      }}
                    />
                  </Avatar>
                ))}
              </AvatarGroup>
              {usersData.length - 5 <= 0 ? (
                <Text></Text>
              ) : usersData.length - 5 < 99 ? (
                <Text size="2xs" emphasis="light">
                  and other {usersData.length - 5} donators
                </Text>
              ) : (
                <Text size="2xs" emphasis="light">
                  and other 99+ donators
                </Text>
              )}
              <View style={{ flex: 1, alignItems: "flex-end", padding: 0 }}>
                <ChevronRight
                  size={24}
                  style={{ opacity: 0.8 }}
                  color={
                    isDark
                      ? ColorCombinations.statusTemplate.light
                      : ColorCombinations.statusTemplate.dark
                  }
                />
              </View>
            </HStack>
          </Card>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingVertical: 40,
  },
  title_container: {
    gap: 5,
  },
  carousel: {
    overflow: "visible", // Allow items to show beyond carousel bounds
  },
  card: {
    flex: 1,
    padding: 20,
    borderWidth: 1,
    marginHorizontal: 10,
    borderRadius: 20,
    gap: 5,
  },
  current_item_container: {
    marginVertical: 8, // Reduced margin for better spacing
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    flexWrap: "wrap", // Allow wrapping if text is too long
  },
  current_target_item_container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8, // Reduced padding
    flexWrap: "wrap", // Allow wrapping for smaller screens
  },
});

// This component can be used in your main app file or wherever you need to display the carousel
// Usage example:

// import { CarouselScreen } from '@/components/ui/carousel/CarouselScreen';
// import type { StatusTemplateProps } from '@/components/ui/post-template/StatusTemplate';
// import type { CarouselItem } from '@/components/ui/carousel/CarouselScreen';
// import statusData from '../../data/statusData.json';
// import mostNeedItem from '../../data/mostNeedItem.json';

// export default function HomeScreen () {
//   // Extract user data from statusData for the carousel
//   const usersData = statusData.map((item: StatusTemplateProps) => ({
//     firstName: item.firstName,
//     lastName: item.lastName,
//     profileImage: item.profileImage,
//   }));

//   // Convert statusData to CarouselItem format
//   const mostNeededItem = mostNeedItem.map((item: CarouselItem) => ({
//     id: item.id,
//     category: item.category,
//     current_item: item.current_item,
//     target_item: item.target_item,
//   }));

//   return (
//    <Body gap={10} >
//       <CarouselScreen
//         data={mostNeededItem as CarouselItem[]}
//         usersData={usersData}
//       />
//     </Body>
//   )
// }
