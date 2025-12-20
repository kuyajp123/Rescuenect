import { Image } from 'expo-image';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window');

// Sample data - you can replace this with your dynamic data
const carouselData = [
  {
    id: 1,
    title: 'Emergency Alert System',
    subtitle: 'Stay informed with real-time alerts',
    image:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
    description: 'Get instant notifications about emergencies in your area and stay prepared.',
    action: '/notification',
  },
  {
    id: 2,
    title: 'Community Support',
    subtitle: 'Connect with your neighbors',
    image:
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80',
    description: 'Join the community network and help each other during emergencies.',
    action: '/community',
  },
  {
    id: 3,
    title: 'Resource Center',
    subtitle: 'Find help and resources',
    image:
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    description: 'Access emergency resources, shelters, and important contact information.',
    action: '/details',
  },
];

export const AdvancedCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isDark } = useTheme();
  const router = useRouter();

  const handlePress = (item: (typeof carouselData)[0]) => {
    // Navigate to different screens based on the item's action
    router.push(item.action as any);
  };

  const renderCarouselItem = ({ item, index }: { item: (typeof carouselData)[0]; index: number }) => (
    <TouchableOpacity
      onPress={() => handlePress(item)}
      style={[styles.carouselItem, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}
      activeOpacity={0.8}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.carouselImage} alt={item.title} />

        {/* Overlay gradient effect */}
        <View style={styles.imageOverlay} />

        {/* Text overlay on image */}
        <View style={styles.imageTextOverlay}>
          <Text size="xl" style={styles.overlayTitle}>
            {item.title}
          </Text>
          <Text style={styles.overlaySubtitle}>{item.subtitle}</Text>
        </View>
      </View>

      {/* Content below image */}
      <View style={styles.contentContainer}>
        <Text style={[styles.itemDescription, { color: isDark ? '#FFFFFF' : '#333333' }]}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {carouselData.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.paginationDot,
            {
              backgroundColor:
                index === currentIndex ? (isDark ? '#FFFFFF' : '#007AFF') : isDark ? '#555555' : '#CCCCCC',
              width: index === currentIndex ? 20 : 8,
            },
          ]}
          //   onPress={() => {
          //     // Optional: Allow users to tap dots to navigate
          //     setCurrentIndex(index);
          //   }}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Main Carousel */}
      <View style={styles.carouselWrapper}>
        <Carousel
          data={carouselData}
          width={width * 1} // Full width for better display
          height={280}
          loop
          pagingEnabled
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 0.9,
            parallaxScrollingOffset: 50,
          }}
          onSnapToItem={index => {
            // Use onSnapToItem for more stable index tracking
            setCurrentIndex(index);
          }}
          renderItem={renderCarouselItem}
          style={styles.carousel}
          //   enableSnap={true}
          snapEnabled
          autoFillData={false}
          // Prevent vertical scroll interference
          scrollAnimationDuration={100}
        />
      </View>

      {/* Pagination Dots */}
      {renderPaginationDots()}

      {/* Current Item Text (follows carousel) */}
      <View style={styles.currentItemInfo}>
        <Text size="md" style={[styles.currentItemTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>
          {carouselData[currentIndex]?.title || carouselData[0]?.title}
        </Text>
        <Text style={[styles.currentItemSubtitle, { color: isDark ? '#CCCCCC' : '#666666' }]}>
          {carouselData[currentIndex]?.subtitle || carouselData[0]?.subtitle}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'visible', // Ensure shadows and effects are visible
  },
  carousel: {
    alignSelf: 'center',
    overflow: 'visible', // Ensure the carousel items are fully visible
  },
  carouselWrapper: {
    overflow: 'visible',
    paddingHorizontal: 0,
  },
  carouselItem: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: 5,
    flex: 1, // Ensure the item takes full available space
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    width: '100%', // Ensure full width
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // This ensures the image fills the space properly
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  imageTextOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  overlayTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  overlaySubtitle: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  contentContainer: {
    padding: 16,
  },
  itemDescription: {
    lineHeight: 20,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  currentItemInfo: {
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  currentItemTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  currentItemSubtitle: {
    textAlign: 'center',
  },
});
