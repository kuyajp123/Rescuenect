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

type CarouselScreenProps = {
  data: CarouselItem[];
}

export const CarouselScreen = ({ data }: CarouselScreenProps) => {
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
        <Text size='xs' emphasis='light'>need more items</Text>
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
        <Text bold >Donation Drives</Text>
        <Text>Your contribution can save lives</Text>
      </View>
      <View style={[styles.title_container, { marginBottom: 0,}]}>
        <Text>Most needed items:</Text>
      </View>
      <Carousel
        loop={false}
        width={screenWidth * 0.75} // Further reduced to show more of next item (25% peek)
        height={150}
        data={data}
        scrollAnimationDuration={200}
        renderItem={renderItem}
        style={styles.carousel}
      />
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
    paddingHorizontal: 20,
  },
  carousel: {
    overflow: 'visible', // Allow items to show beyond carousel bounds
  },
  card: {
    flex: 1,
    padding: 20,
    borderWidth: 1,
    marginHorizontal: 10, // Reduced margin to allow more space for peeking
    borderRadius: 20,
  },
  current_item_container: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  current_target_item_container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  }
});
