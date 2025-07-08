import { Avatar, AvatarFallbackText, AvatarGroup, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button/Button';
import { Card } from '@/components/ui/Card';
import { HStack } from '@/components/ui/hstack';
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Text } from '@/components/ui/text';
import { ColorCombinations, Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

// Get screen width for responsive carousel
const { width: screenWidth } = Dimensions.get('window');

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
  usersData?: UserData[]; // Array of user data
}

export const CarouselScreen = ({ data, usersData = [] }: CarouselScreenProps) => {
  const { isDark } = useTheme();
  
  // Helper function to format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  const renderItem = ({ item, index }: {item: CarouselItem, index: number}) => (
    <View style={
      [
        styles.card, 
        { 
          backgroundColor: isDark ? ColorCombinations.card_dark.background : ColorCombinations.card.Background, borderColor: isDark ? Colors.border.dark : Colors.border.light 
        }
      ]
    }>
      <View>
        <Text size='sm' bold>{item.category}</Text>
      </View>
      <View style={styles.current_item_container}>
        <Text size='lg' bold>{formatNumber(item.target_item - item.current_item)}</Text>
        <Text size="2xs" emphasis='light'>need more items</Text>
      </View>
      <View>
        <Text size='2xs' bold style={{ color: isDark ? Colors.brand.dark : Colors.brand.light }}>
          {Math.round((item.current_item / item.target_item) * 100)}%
        </Text>
        <Progress value={(item.current_item / item.target_item) * 100} size="xs" orientation="horizontal">
          <ProgressFilledTrack style={{ backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light }} />
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
        <Text size="lg" bold style={{ color: isDark ? Colors.brand.dark : Colors.brand.light }}>
          Donation Drives
        </Text>
        <Text emphasis="medium" style={{ 
          color: isDark ? Colors.text.dark : Colors.text.light,
          opacity: 0.8,
          marginTop: 4
        }}>
          Your contribution can save lives
        </Text>
      </View>
      <View style={[styles.title_container, { marginBottom: 0, marginTop: 10 }]}>
        <Text size="sm" bold style={{ 
          color: isDark ? Colors.text.dark : Colors.text.light,
          opacity: 0.9
        }}>
          📦 Most needed items:
        </Text>
      </View>
      <Carousel
        loop={false}
        width={screenWidth * 0.75} // Further reduced to show more of next item (25% peek)
        height={160} // Increased height to accommodate dynamic content
        data={data}
        scrollAnimationDuration={200}
        renderItem={renderItem}
        style={styles.carousel}
      />

      <Button
        action="primary"
        variant="solid"
        style={{ marginTop: 20, alignSelf: 'center' }}
        onPress={() => alert('Donate Now')}
      >
        <Text style={{ color: '#ffffff' }} bold>Donate Now</Text>
      </Button>

      {usersData.length > 0 && (
        <Card style={{ marginTop: 20 }}>
          <HStack>
            <Text size="sm" bold style={{ marginBottom: 10 }}>
              👥 Recent Contributors
            </Text>
          </HStack>
          <HStack style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <AvatarGroup>
              {usersData.slice(0, 5).map((user, index) => (
                <Avatar key={index} size="sm">
                  <AvatarFallbackText>{user.firstName} {user.lastName}</AvatarFallbackText>
                  <AvatarImage
                    source={{
                      uri: user.profileImage,
                    }}
                  />
                </Avatar>
              ))}
            </AvatarGroup>
            {
            usersData.length - 5 <= 0 ? (<Text></Text>)
            : usersData.length - 5 < 99 ? (<Text size='2xs' emphasis='light'>and other {usersData.length - 5} donators</Text>) 
            : (<Text size='2xs' emphasis='light'>and other 99+ donators</Text>)
            }
            
          </HStack>
        </Card>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 40,
  },
  title_container: {
    marginBottom: 20,
    gap: 5,
    paddingHorizontal: 10,
  },
  carousel: {
    overflow: 'visible', // Allow items to show beyond carousel bounds
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    flexWrap: 'wrap', // Allow wrapping if text is too long
  },
  current_target_item_container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8, // Reduced padding
    flexWrap: 'wrap', // Allow wrapping for smaller screens
  }
});
