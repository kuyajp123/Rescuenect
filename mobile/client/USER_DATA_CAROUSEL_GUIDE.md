# User Data Integration in Carousel Component

## Overview
This guide explains how to display user data from `statusData.json` in the CarouselScreen component, specifically in the avatar group section.

## Implementation

### 1. Data Structure
The `statusData.json` contains user information with the following structure:
```json
{
  "profileImage": "https://randomuser.me/api/portraits/men/11.jpg",
  "firstName": "John",
  "lastName": "Doe",
  "status": "evacuated",
  // ... other properties
}
```

### 2. Updated CarouselScreen Component

#### Props Interface
```tsx
export type UserData = {
  firstName: string;
  lastName: string;
  profileImage: string;
}

interface CarouselScreenProps {
  data: CarouselItem[];
  usersData?: UserData[]; // Array of user data
}
```

#### Component Usage
```tsx
// In your screen component (e.g., index.tsx)
export default function HomeScreen() {
  // Extract user data from statusData for the carousel
  const usersData = statusData.map((item: StatusTemplateProps) => ({
    firstName: item.firstName,
    lastName: item.lastName,
    profileImage: item.profileImage,
  }));

  return (
    <CarouselScreen 
      data={mostNeededItem as CarouselItem[]} 
      usersData={usersData}
    />
  );
}
```

### 3. Avatar Group Rendering

The component now dynamically renders user avatars:

```tsx
{usersData.length > 0 && (
  <Card>
    <HStack>
      <Text size="sm" bold style={{ marginBottom: 10 }}>
        👥 Recent Contributors
      </Text>
    </HStack>
    <HStack>
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
    </HStack>
  </Card>
)}
```

## Features

### 1. Dynamic User Display
- Shows up to 5 recent contributors
- Displays user profile images from `statusData.json`
- Fallback text uses first and last names
- Conditional rendering (only shows if users exist)

### 2. Data Transformation
- Extracts only necessary user data (firstName, lastName, profileImage)
- Maps from the full `statusData` structure to a simplified format
- Type-safe with TypeScript interfaces

### 3. Error Handling
- Safe array slicing with `.slice(0, 5)`
- Conditional rendering prevents errors with empty data
- Fallback text for broken images

## Benefits

1. **Real User Data**: Shows actual users from your disaster response system
2. **Dynamic Content**: Updates automatically when `statusData.json` changes
3. **Performance**: Only displays first 5 users to maintain UI performance
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Responsive**: Adapts to available data without breaking

## Usage Examples

### Basic Usage
```tsx
<CarouselScreen 
  data={donationData} 
  usersData={extractedUserData}
/>
```

### With Empty Data
```tsx
<CarouselScreen 
  data={donationData} 
  usersData={[]} // Component handles empty arrays gracefully
/>
```

### Without User Data
```tsx
<CarouselScreen 
  data={donationData} 
  // usersData is optional - avatar section won't render
/>
```

This implementation creates a more engaging and personalized experience by showing real users who are part of your disaster response community!
