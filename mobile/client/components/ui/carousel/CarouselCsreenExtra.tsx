import { Avatar, AvatarFallbackText, AvatarGroup, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card/Card';
import { HStack } from '@/components/ui/hstack';
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Text } from '@/components/ui/text';
import { ColorCombinations, Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH * 0.75;
const CAROUSEL_HEIGHT = 160;
const MAX_VISIBLE_AVATARS = 5;
const MAX_ADDITIONAL_USERS_DISPLAY = 99;

// Type Definitions
export type CarouselItem = {
  id: number;
  category: string;
  current_item: number;
  target_item: number;
}

export type UserData = {
  firstName: string;
  lastName: string;
  profileImage: string;
}

interface CarouselScreenProps {
  data: CarouselItem[];
  usersData?: UserData[];
}

// Utility Functions
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const calculateProgress = (current: number, target: number): number => {
  return Math.round((current / target) * 100);
};

const getAdditionalUsersText = (additionalCount: number): string => {
  if (additionalCount <= 0) return '';
  if (additionalCount < MAX_ADDITIONAL_USERS_DISPLAY) {
    return `and other ${additionalCount} donators`;
  }
  return `and other ${MAX_ADDITIONAL_USERS_DISPLAY}+ donators`;
};

// Sub Components
const DonationCard = ({ item, isDark }: { item: CarouselItem; isDark: boolean }) => {
  const cardStyles = [
    styles.card,
    {
      backgroundColor: isDark 
        ? ColorCombinations.card_dark.background 
        : ColorCombinations.card.Background,
      borderColor: isDark 
        ? Colors.border.dark 
        : Colors.border.light
    }
  ];

  const brandColor = isDark ? Colors.brand.dark : Colors.brand.light;
  const progress = calculateProgress(item.current_item, item.target_item);

  return (
    <View style={cardStyles}>
      {/* Category Header */}
      <View>
        <Text size="sm" bold>
          {item.category}
        </Text>
      </View>

      {/* Items Needed Display */}
      <View style={styles.itemsNeededContainer}>
        <Text size="lg" bold>
          {formatNumber(item.target_item - item.current_item)}
        </Text>
        <Text size="2xs" emphasis="light">
          need more items
        </Text>
      </View>

      {/* Progress Section */}
      <View>
        <Text size="2xs" bold style={[styles.progressText, { color: brandColor }]}>
          {progress}%
        </Text>
        <Progress value={progress} size="xs" orientation="horizontal">
          <ProgressFilledTrack style={{ backgroundColor: brandColor }} />
        </Progress>
      </View>

      {/* Current/Target Display */}
      <View style={styles.currentTargetContainer}>
        <Text size="2xs">
          Current: {formatNumber(item.current_item)}
        </Text>
        <Text size="2xs">
          Target: {formatNumber(item.target_item)}
        </Text>
      </View>
    </View>
  );
};

const SectionHeader = ({ isDark }: { isDark: boolean }) => {
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const brandColor = isDark ? Colors.brand.dark : Colors.brand.light;

  return (
    <>
      {/* Main Header */}
      <View style={styles.headerContainer}>
        <Text size="lg" bold style={[styles.headerTitle, { color: brandColor }]}>
          Donation Drives
        </Text>
        <Text 
          emphasis="medium" 
          style={[styles.headerSubtitle, { color: textColor }]}
        >
          Your contribution can save lives
        </Text>
      </View>

      {/* Sub Header */}
      <View style={styles.subHeaderContainer}>
        <Text 
          size="sm" 
          bold 
          style={[styles.subHeaderText, { color: textColor }]}
        >
          📦 Most needed items:
        </Text>
      </View>
    </>
  );
};

const UserAvatar = ({ user, index }: { user: UserData; index: number }) => (
  <Avatar key={index} size="sm">
    <AvatarFallbackText>
      {user.firstName} {user.lastName}
    </AvatarFallbackText>
    <AvatarImage source={{ uri: user.profileImage }} />
  </Avatar>
);

const ContributorsSection = ({ usersData }: { usersData: UserData[] }) => {
  if (usersData.length === 0) return null;

  const visibleUsers = usersData.slice(0, MAX_VISIBLE_AVATARS);
  const additionalUsersCount = usersData.length - MAX_VISIBLE_AVATARS;
  const additionalUsersText = getAdditionalUsersText(additionalUsersCount);

  return (
    <Card style={styles.contributorsCard}>
      {/* Section Title */}
      <HStack>
        <Text size="sm" bold style={styles.contributorsTitle}>
          👥 Recent Contributors
        </Text>
      </HStack>

      {/* Avatars and Additional Users Text */}
      <HStack style={styles.contributorsContent}>
        <AvatarGroup>
          {visibleUsers.map((user, index) => (
            <UserAvatar key={index} user={user} index={index} />
          ))}
        </AvatarGroup>
        
        {additionalUsersText && (
          <Text size="2xs" emphasis="light">
            {additionalUsersText}
          </Text>
        )}
      </HStack>
    </Card>
  );
};

const DonateButton = () => (
  <Button
    action="primary"
    variant="solid"
    style={styles.donateButton}
    onPress={() => alert('Donate Now')}
  >
    <Text style={styles.donateButtonText} bold>
      Donate Now
    </Text>
  </Button>
);

// Main Component
export const CarouselScreen = ({ data, usersData = [] }: CarouselScreenProps) => {
  const { isDark } = useTheme();

  const renderCarouselItem = ({ item }: { item: CarouselItem }) => (
    <DonationCard item={item} isDark={isDark} />
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <SectionHeader isDark={isDark} />

      {/* Carousel */}
      <Carousel
        loop={false}
        width={CAROUSEL_ITEM_WIDTH}
        height={CAROUSEL_HEIGHT}
        data={data}
        scrollAnimationDuration={200}
        renderItem={renderCarouselItem}
        style={styles.carousel}
      />

      {/* Donate Button */}
      <DonateButton />

      {/* Contributors Section */}
      <ContributorsSection usersData={usersData} />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    paddingVertical: 40,
  },

  // Header Styles
  headerContainer: {
    marginBottom: 20,
    gap: 5,
    paddingHorizontal: 10,
  },
  headerTitle: {
    // Color applied inline based on theme
  },
  headerSubtitle: {
    opacity: 0.8,
    marginTop: 4,
  },

  // Sub Header Styles
  subHeaderContainer: {
    marginBottom: 0,
    marginTop: 10,
    gap: 5,
    paddingHorizontal: 10,
  },
  subHeaderText: {
    opacity: 0.9,
  },

  // Carousel Styles
  carousel: {
    overflow: 'visible',
  },

  // Card Styles
  card: {
    flex: 1,
    padding: 20,
    borderWidth: 1,
    marginHorizontal: 10,
    borderRadius: 20,
    gap: 5,
  },
  itemsNeededContainer: {
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    flexWrap: 'wrap',
  },
  progressText: {
    // Color applied inline based on theme
  },
  currentTargetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    flexWrap: 'wrap',
  },

  // Button Styles
  donateButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  donateButtonText: {
    color: '#ffffff',
  },

  // Contributors Styles
  contributorsCard: {
    marginTop: 20,
  },
  contributorsTitle: {
    marginBottom: 10,
  },
  contributorsContent: {
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});

// This component can be used in your main app file or wherever you need to display the carousel
// Usage example:

// import { CarouselScreen } from '@/components/ui/carousel/CarouselScreen';
// import type { StatusTemplateProps } from '@/components/ui/post-template/StatusTemplate';
// import statusData from '../../data/statusData.json';

// export default function HomeScreen () {
//   // Extract user data from statusData for the carousel
//   const usersData = statusData.map((item: StatusTemplateProps) => ({
//     firstName: item.firstName,
//     lastName: item.lastName,
//     profileImage: item.profileImage,
//   }));

//   return (
//    <Body gap={10} >
//     <View>
//       <CarouselScreen 
//         data={mostNeededItem as CarouselItem[]} 
//         usersData={usersData}
//       />
//     </Body>
//   )
// }