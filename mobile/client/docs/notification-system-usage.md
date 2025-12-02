# Notification System Usage Guide

## Overview

The notification system uses real-time Firestore listeners to automatically receive earthquake and weather notifications. It filters weather notifications based on user location while always including earthquake notifications.

## Architecture

### 1. **Notification Store** (`useNotificationStore.ts`)

Central store for managing notification state using Zustand.

```typescript
const notifications = useNotificationStore(state => state.notifications);
const unreadCount = useNotificationStore(state => state.getUnreadCount(userId));
```

### 2. **Notification Subscriber Hook** (`useNotificationSubscriber.tsx`)

Real-time listener that filters notifications based on user preferences.

```typescript
useNotificationSubscriber({
  userLocation: 'barangay_name', // Filters weather notifications
  userId: 'user_id', // Tracks read/hidden status
  maxNotifications: 50, // Limit number of notifications
});
```

### 3. **Notification Types** (`types/notification.ts`)

TypeScript interfaces matching the backend schema.

## How It Works

### Automatic Filtering Rules

1. **Earthquake Notifications** 🔴

   - **Always included** regardless of user location
   - Critical for safety across all areas

2. **Weather Notifications** 🌤️

   - Filtered by user's barangay location
   - Includes notifications for:
     - User's specific barangay
     - `central_naic` location (affects everyone)
     - Any notification that lists user's barangay in `barangays[]` array

3. **Other Notifications** (announcement, emergency, etc.)
   - Always included

### Real-Time Updates

The system uses Firestore's `onSnapshot` for live updates:

- New notifications appear instantly
- No polling or refresh needed
- Automatic reconnection on network changes

## Implementation

### In Layout (app/\_layout.tsx)

```typescript
import { useNotificationSubscriber } from '@/hooks/useNotificationSubscriber';
import { useAuth } from '@/components/store/useAuth';
import { useUserData } from '@/components/store/useBackendResponse';

export default function RootLayout() {
  const authUser = useAuth(state => state.authUser);
  const userData = useUserData(state => state.userData);

  // Subscribe to notifications with user location
  useNotificationSubscriber({
    userLocation: userData?.barangay || undefined,
    userId: authUser?.uid || undefined,
    maxNotifications: 50,
  });

  return <YourApp />;
}
```

### In Notification Screen (app/notification/index.tsx)

```typescript
import { useNotificationStore } from '@/components/store/useNotificationStore';
import { useAuth } from '@/components/store/useAuth';

const NotificationScreen = () => {
  const notifications = useNotificationStore(state => state.notifications);
  const authUser = useAuth(state => state.authUser);

  return (
    <ScrollView>
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          isRead={notification.readBy?.includes(authUser?.uid)}
        />
      ))}
    </ScrollView>
  );
};
```

### Accessing Specific Notification Types

```typescript
// Get only earthquake notifications
const earthquakeNotifs = useNotificationStore(state => state.getEarthquakeNotifications());

// Get only weather notifications
const weatherNotifs = useNotificationStore(state => state.getWeatherNotifications());

// Get unread count
const unreadCount = useNotificationStore(state => state.getUnreadCount(userId));
```

## Notification Data Structure

### Base Notification

```typescript
interface BaseNotification {
  id: string;
  type: 'weather' | 'earthquake' | 'announcement' | 'emergency';
  title: string;
  message: string;
  timestamp: number;
  location: string;
  barangays?: string[];
  audience: 'admin' | 'users' | 'both';
  readBy?: string[];
  hiddenBy?: string[];
  data?: WeatherNotificationData | EarthquakeNotificationData;
}
```

### Earthquake Data

```typescript
interface EarthquakeNotificationData {
  earthquakeId: string;
  magnitude: number;
  place: string;
  coordinates: { latitude: number; longitude: number; depth: number };
  severity: 'micro' | 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';
  tsunamiWarning: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  distanceFromNaic?: number;
}
```

### Weather Data

```typescript
interface WeatherNotificationData {
  weatherType: 'current' | 'forecast_3h' | 'forecast_tomorrow';
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';
  category: 'Heat' | 'Rain' | 'Wind' | 'Storm' | 'Flood' | etc.;
  temperature?: number;
  rainIntensity?: number;
  windSpeed?: number;
  // ... other weather metrics
}
```

## Store Actions

### Mark as Read

```typescript
const markAsRead = useNotificationStore(state => state.markAsRead);
markAsRead(notificationId, userId);
```

### Mark as Hidden

```typescript
const markAsHidden = useNotificationStore(state => state.markAsHidden);
markAsHidden(notificationId, userId);
```

### Remove Notification

```typescript
const removeNotification = useNotificationStore(state => state.removeNotification);
removeNotification(notificationId);
```

## Backend Integration

Notifications are created by Supabase Edge Functions:

- `earthquake-monitor` - Creates earthquake notifications
- `unified-weather-notification` - Creates weather notifications

Both functions use `NotificationService` to save to Firestore collection `notifications`.

## Testing

### Test Earthquake Notifications

Trigger the earthquake monitor function manually to test.

### Test Weather Notifications

1. Set your user's barangay in user profile
2. Trigger weather notification function
3. Verify only relevant weather notifications appear

### Test Location Filtering

1. Change user's barangay
2. Observe weather notifications update
3. Verify earthquake notifications always appear

## Performance

- **Real-time**: Uses Firestore listeners for instant updates
- **Efficient**: Only fetches last 50 notifications by default
- **Filtered**: Client-side filtering reduces unnecessary renders
- **Cached**: Firestore caches data for offline access

## Troubleshooting

### Notifications Not Appearing

1. Check Firebase connection
2. Verify user location is set in userData
3. Check console for listener errors
4. Verify Firestore rules allow read access

### Wrong Notifications Showing

1. Verify `userLocation` is correct barangay name
2. Check notification's `location` field in Firestore
3. Verify notification's `barangays` array if present

### Duplicate Notifications

1. Ensure only one `useNotificationSubscriber` instance in app
2. Check for multiple layout components mounting
3. Verify cleanup function is called on unmount
