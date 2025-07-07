import { AdvancedCarousel } from '@/components/ui/carousel/AdvancedCarousel';
import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Test screen for the Advanced Carousel component
 * This can be used to test the carousel in isolation
 */
export default function CarouselTestScreen() {
  return (
    <View style={styles.container}>
      <AdvancedCarousel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#f5f5f5',
  },
});
