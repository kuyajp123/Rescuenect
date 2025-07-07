# Advanced Carousel Integration Guide

## Overview
The `AdvancedCarousel` component has been successfully integrated into your home screen (`app/(tabs)/index.tsx`). This carousel is built using `react-native-reanimated-carousel` and includes all the features you requested.

## Features Implemented ✅

### 1. **Image and Text in Carousel**
- Each carousel item displays a beautiful image with overlay text
- Title and subtitle are displayed over the image with a gradient overlay
- Additional description text appears below the image

### 2. **Indicator Dots**
- Pagination dots at the bottom show current position
- Active dot is highlighted with different color and size
- Dots are clickable (optional navigation)

### 3. **Dynamic Data**
- Easy to customize with your own data
- Currently shows 3 sample items: Emergency Alert, Community Support, Resource Center
- Each item has: id, title, subtitle, image, description, and action route

### 4. **Clickable Items**
- Entire carousel item is clickable
- Navigates to different screens based on the item's action property
- Uses expo-router navigation

### 5. **Peeking Next Item**
- Configured with `width={width * 0.85}` to show edges of adjacent items
- Parallax effect with scaling for smooth transitions
- Mode set to "parallax" for enhanced visual appeal

### 6. **Text Below Carousel**
- Current item's title and subtitle are displayed below the carousel
- Text updates automatically as user swipes through items
- Follows theme colors (dark/light mode)

## Current Integration

The carousel is now visible on your home screen at `app/(tabs)/index.tsx`:

```tsx
<AdvancedCarousel />
```

## Sample Data Structure

```typescript
{
  id: 1,
  title: 'Emergency Alert System',
  subtitle: 'Stay informed with real-time alerts',
  image: 'https://example.com/image.jpg',
  description: 'Get instant notifications about emergencies in your area.',
  action: '/notification'
}
```

## Customization Options

### 1. **Update Data**
Replace the `carouselData` array in `AdvancedCarousel.tsx` with your own data:

```typescript
const carouselData = [
  {
    id: 1,
    title: 'Your Title',
    subtitle: 'Your Subtitle',
    image: 'your-image-url',
    description: 'Your description',
    action: '/your-route'
  },
  // ... more items
];
```

### 2. **Styling Customization**
- Colors automatically adapt to dark/light theme
- Modify styles in the `StyleSheet` at the bottom of the component
- Adjust dimensions, spacing, colors, etc.

### 3. **Navigation Actions**
- Currently navigates to: `/notification`, `/community`, `/details`
- Modify the `action` property for each item to change navigation behavior

### 4. **Carousel Behavior**
- Loop: `loop={true}` - endless scrolling
- Auto-play: Add `autoPlay={true}` and `autoPlayInterval={3000}` props
- Pagination: Currently enabled with custom dots

## Usage Example

```tsx
// In your screen component
import { AdvancedCarousel } from '@/components/ui/carousel/AdvancedCarousel';

export default function YourScreen() {
  return (
    <View>
      <AdvancedCarousel />
    </View>
  );
}
```

## Next Steps

1. **Test the carousel** by running your app
2. **Customize data** with your actual content
3. **Adjust styling** to match your brand
4. **Add auto-play** if desired
5. **Test navigation** to ensure all routes work correctly

The carousel is now fully functional and integrated into your home screen!
