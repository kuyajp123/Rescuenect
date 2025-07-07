import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

// Get screen width for responsive carousel
const { width: screenWidth } = Dimensions.get('window');

const data = ['Slide 1', 'Slide 2', 'Slide 3', 'Slide 4'];

export const CarouselScreen = () => {
  return (
    <View style={styles.container}>
      <Carousel
        loop
        width={screenWidth * 0.9}
        height={200}
        data={data}
        scrollAnimationDuration={1000}
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <Text style={styles.text}>{item}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    borderWidth: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // padding: 20,
    marginHorizontal: 10,
  },
  text: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
