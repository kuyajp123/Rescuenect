import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts/ThemeContext';
import LottieView from 'lottie-react-native';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

export interface EmptyStateProps {
  /**
   * Lottie animation source - can be a local require() or remote URL
   * Example: require('@/assets/animations/empty-calendar.json')
   * Example: { uri: 'https://assets10.lottiefiles.com/packages/lf20_zyquagfl.json' }
   */
  animationSource?: any;
  
  /**
   * Main title text
   */
  title?: string;
  
  /**
   * Subtitle/description text
   */
  subtitle?: string;
  
  /**
   * Animation size (width and height)
   */
  animationSize?: number;
  
  /**
   * Custom container styles
   */
  containerStyle?: ViewStyle;
  
  /**
   * Whether the animation should loop
   */
  loop?: boolean;
  
  /**
   * Whether the animation should autoplay
   */
  autoPlay?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  animationSource,
  title = "No data available",
  subtitle = "Check back later for updates",
  animationSize = 150,
  containerStyle,
  loop = true,
  autoPlay = true,
}) => {
  const { isDark } = useTheme();
  
  // Default animation - using a reliable empty state animation

  // Dynamic styles based on theme
  const dynamicStyles = {
    title: {
      color: isDark ? '#ffffff' : '#000000',
    },
    subtitle: {
      color: isDark ? '#a6a6a6' : '#666666',
    },
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.animationContainer}>
        <LottieView
          source={animationSource}
          style={{
            width: animationSize,
            height: animationSize,
          }}
          autoPlay={autoPlay}
          loop={loop}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text size="lg" bold style={[styles.title, dynamicStyles.title]}>
          {title}
        </Text>
        {subtitle && (
          <Text size="sm" style={[styles.subtitle, dynamicStyles.subtitle]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  animationContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
  },
});

/*
===========================================
EMPTY STATE COMPONENT USAGE GUIDE
===========================================

BASIC USAGE:
-----------
import { EmptyState } from '@/components/ui/empty-state/EmptyState';

// Simple usage with default animation
<EmptyState 
  title="No events found"
  subtitle="Check back later for new volunteer opportunities!"
/>

ADVANCED USAGE:
--------------
// With custom local animation
<EmptyState 
  animationSource={require('@/assets/animations/empty-calendar.json')}
  title="No events scheduled"
  subtitle="Be the first to organize an event in your community!"
  animationSize={200}
  loop={true}
  autoPlay={true}
/>

// With remote animation
<EmptyState 
  animationSource={{ uri: 'https://assets10.lottiefiles.com/packages/lf20_zyquagfl.json' }}
  title="Nothing here yet"
  subtitle="Your content will appear here soon"
  containerStyle={{ backgroundColor: '#f5f5f5', borderRadius: 10 }}
/>

PROPS:
------
- animationSource?: any - Lottie animation (local require() or {uri: string})
- title?: string - Main title text
- subtitle?: string - Description text  
- animationSize?: number - Animation width/height (default: 150)
- containerStyle?: ViewStyle - Custom container styles
- loop?: boolean - Whether animation loops (default: true)
- autoPlay?: boolean - Whether animation autoplays (default: true)

RECOMMENDED LOTTIE ANIMATIONS:
-----------------------------
For volunteer events:
- Calendar/Schedule: https://assets10.lottiefiles.com/packages/lf20_zyquagfl.json
- Empty box: https://assets7.lottiefiles.com/packages/lf20_ls6uxdas.json
- Search/Not found: https://assets4.lottiefiles.com/packages/lf20_tl52xzvn.json

To use local animations:
1. Download .json file from LottieFiles
2. Place in assets/animations/
3. Use: require('@/assets/animations/filename.json')
*/
