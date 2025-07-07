import Body from '@/components/ui/Body';
import { Card } from '@/components/ui/Card';
import { AdvancedCarousel } from '@/components/ui/carousel/AdvancedCarousel';
import { CarouselScreen } from '@/components/ui/carousel/CarouselScreen';
import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

export default function HomeScreen () {
  return (
    <View>
      <Body gap={10} >
      <Card>
        <Text size="lg" emphasis="bold" style={{ textAlign: 'center' }}>
          Welcome to Rescuenect!
        </Text>
        <Text size="md" style={{ textAlign: 'center', marginTop: 10 }}>
          This is the home screen. Navigate to the tabs below to explore more.
        </Text>
      </Card>

      {/* Featured Carousel */}
      <AdvancedCarousel />

      <CarouselScreen />
    </Body>

    </View>
    
  )
}