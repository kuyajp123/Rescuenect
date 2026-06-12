import { Text } from '@/components/ui/text';
import { API_ROUTES } from '@/config/endpoints';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserData } from '@/store/useBackendResponse';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import axios from 'axios';

const { width } = Dimensions.get('window');

// Static fallback shown when the API returns < 2 slides or fails
const STATIC_FALLBACK = [
  // {
  //   id: 'fallback-1',
  //   title: 'Barangay Leadership & Unity',
  //   subtitle: 'Serving the community together',
  //   imageUrl: require('@/assets/images/bancaan/officials_group_blue.jpg'),
  //   description:
  //     'Dedicated barangay officials working together to strengthen community resilience, coordination, and public service for everyone.',
  //   isLocal: true,
  // },
  {
    id: 'fallback-2',
    title: 'Clean & Safe Community',
    subtitle: 'Work together for a better barangay',
    imageUrl: require('@/assets/images/bancaan/covered_court.jpg'),
    description:
      'Join community efforts to maintain cleanliness and create a safer, healthier environment for everyone in the barangay.',
    isLocal: true,
  },
  // {
  //   id: 'fallback-3',
  //   title: 'Disaster Preparedness',
  //   subtitle: 'Practice today, stay safe tomorrow',
  //   imageUrl: require('@/assets/images/bancaan/drill.jpg'),
  //   description:
  //     'Participate in emergency drills and learn life-saving actions to protect yourself and your community during disasters.',
  //   isLocal: true,
  // },
  // {
  //   id: 'fallback-4',
  //   title: 'Officials & Community Unity',
  //   subtitle: 'Create a stronger barangay together',
  //   imageUrl: require('@/assets/images/bancaan/officials_group_white.jpg'),
  //   description:
  //     'Bringing together barangay officials and residents to foster unity, collaboration, and a stronger sense of community for everyone.',
  //   isLocal: true,
  // },
];

interface SlideItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: any; // string URI or local require()
  isLocal?: boolean;
}

const normalizeIndex = (index: number, length: number) => {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
};

export const AdvancedCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<SlideItem[]>(STATIC_FALLBACK);
  const { isDark } = useTheme();
  const clientId = useUserData(state => state.userData.clientId);

  const activeIndex = normalizeIndex(currentIndex, slides.length);
  const activeSlide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    setCurrentIndex(0);
  }, [clientId, slides.length]);

  useEffect(() => {
    if (!clientId) return;

    const fetchSlides = async () => {
      try {
        const response = await axios.get(API_ROUTES.CAROUSEL.GET_SLIDES, {
          params: { clientId },
        });
        const fetched: SlideItem[] = response.data?.slides ?? [];
        // Use dynamic slides only if we have at least 2
        if (fetched.length >= 2) {
          setSlides(fetched);
        }
      } catch {
        // Silently fall back to static data on error
      }
    };

    fetchSlides();
  }, [clientId]);

  const renderCarouselItem = ({ item }: { item: SlideItem }) => (
    <View style={[styles.carouselItem, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={item.isLocal ? item.imageUrl : { uri: item.imageUrl }}
          style={styles.carouselImage}
          alt={item.title}
          contentFit="cover"
        />

        {/* Overlay gradient effect */}
        <View style={styles.imageOverlay} />

        {/* Text overlay on image */}
        <View style={styles.imageTextOverlay}>
          <Text size="xl" style={styles.overlayTitle}>
            {item.title}
          </Text>
          {item.subtitle ? <Text style={styles.overlaySubtitle}>{item.subtitle}</Text> : null}
        </View>
      </View>

      {/* Content below image */}
      {item.description ? (
        <View style={styles.contentContainer}>
          <Text style={[styles.itemDescription, { color: isDark ? '#FFFFFF' : '#333333' }]}>
            {item.description}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            {
              backgroundColor:
                index === activeIndex ? (isDark ? '#FFFFFF' : '#007AFF') : isDark ? '#555555' : '#CCCCCC',
              width: index === activeIndex ? 20 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Main Carousel */}
      <View style={styles.carouselWrapper}>
        <Carousel
          data={slides}
          width={width}
          height={280}
          loop
          pagingEnabled
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 0.9,
            parallaxScrollingOffset: 50,
          }}
          onProgressChange={(_, absoluteProgress) => {
            const nextIndex = normalizeIndex(Math.round(absoluteProgress), slides.length);
            setCurrentIndex(prev => {
              return prev === nextIndex ? prev : nextIndex;
            });
          }}
          renderItem={renderCarouselItem}
          style={styles.carousel}
          snapEnabled
        />
      </View>

      {/* Pagination Dots */}
      {renderPaginationDots()}

      {/* Current Item Info */}
      <View style={styles.currentItemInfo}>
        <Text size="md" style={[styles.currentItemTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>
          {activeSlide?.title}
        </Text>
        {activeSlide?.subtitle ? (
          <Text style={[styles.currentItemSubtitle, { color: isDark ? '#CCCCCC' : '#666666' }]}>
            {activeSlide.subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
  },
  carousel: {
    alignSelf: 'center',
    overflow: 'visible',
  },
  carouselWrapper: {
    overflow: 'visible',
    paddingHorizontal: 0,
  },
  carouselItem: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: 5,
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
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
