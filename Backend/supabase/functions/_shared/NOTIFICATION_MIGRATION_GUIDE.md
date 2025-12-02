# Notification System Migration Guide

## Overview

This guide explains the new unified notification schema and how to migrate from the old structure to the new one.

---

## 🎯 Key Changes

### Old Schema (Before)

```typescript
// notifications collection - unstructured
{
  title: string;
  body: string;
  type: string;
  level?: string;
  category?: string;
  metadata: {
    location?: string;
    audience?: string;
    weatherZone?: string;
    // ... many optional fields
  };
  sentTo: number;
  timestamp: Date;
  createdAt: string;
  data?: any;
}
```

### New Schema (Now)

```typescript
// notifications collection - strongly typed
{
  id: string;                  // Generated: weather_central_naic_1701513600000
  type: NotificationType;      // "weather" | "earthquake" | "announcement" | etc.
  title: string;
  message: string;
  timestamp: number;           // Unix timestamp
  createdAt: string;           // ISO string

  // Location & targeting
  location: string;            // weather zone
  barangays?: string[];        // List of affected barangays
  audience: "admin" | "users" | "both";

  // User interaction
  readBy?: string[];           // User IDs who read this
  hiddenBy?: string[];         // User IDs who hidden this

  // Delivery tracking
  sentTo: number;
  deliveryStatus?: {
    success: number;
    failure: number;
    errors?: string[];
  };

  // Type-specific data (strongly typed)
  data?: WeatherNotificationData | EarthquakeNotificationData | AnnouncementNotificationData;
}
```

---

## 📦 Benefits of New Schema

### 1. **Better Organization by Location**

- Each notification knows exactly which barangays it affects
- Easy to query notifications for specific locations
- Weather zones automatically map to barangays

### 2. **User Interaction Tracking**

```typescript
// Mark as read
await notificationService.markAsRead(notificationId, userId);

// Hide notification
await notificationService.markAsHidden(notificationId, userId);

// Query only unread
await notificationService.queryNotifications({
  userId: 'user123',
  onlyUnread: true,
  excludeHidden: true,
});
```

### 3. **Strongly Typed Data**

```typescript
// Weather notification - IntelliSense knows the structure
if (notification.type === 'weather') {
  const weatherData = notification.data as WeatherNotificationData;
  console.log(weatherData.severity); // "CRITICAL" | "WARNING" | "ADVISORY" | "INFO"
  console.log(weatherData.temperature); // number
  console.log(weatherData.category); // "Heat" | "Rain" | "Wind" | etc.
}

// Earthquake notification - different structure
if (notification.type === 'earthquake') {
  const earthquakeData = notification.data as EarthquakeNotificationData;
  console.log(earthquakeData.magnitude); // number
  console.log(earthquakeData.tsunamiWarning); // boolean
  console.log(earthquakeData.coordinates); // { lat, lng, depth }
}
```

### 4. **Easier Querying**

```typescript
// Old way: Complex filtering after fetching
const allNotifications = await db.collection('notifications').get();
const filtered = allNotifications.filter(n => /* complex logic */);

// New way: Query directly
const notifications = await notificationService.queryNotifications({
  type: ['weather', 'earthquake'],
  location: ['central_naic', 'coastal_west'],
  severity: ['CRITICAL', 'WARNING'],
  startTime: Date.now() - 24 * 60 * 60 * 1000,
  userId: 'user123',
  onlyUnread: true,
  limit: 50
});
```

### 5. **Automatic Barangay Mapping**

```typescript
// When you create a notification for 'coastal_west'
await notificationService.createWeatherNotification({
  location: 'coastal_west',
  // ... other params
});

// It automatically sets:
// barangays: ['labac', 'mabolo', 'bancaan', 'balsahan', ...]

// So users can query by their specific barangay:
const myNotifications = await notificationService.getNotificationsForBarangay('labac');
```

---

## 🚀 Migration Steps

### Step 1: Import New Services

```typescript
import { NotificationService } from './notification-service.ts';
import { WeatherNotificationData, EarthquakeNotificationData, generateNotificationId } from './notification-schema.ts';
```

### Step 2: Initialize Service

```typescript
const db = initializeFirebase();
const notificationService = new NotificationService(db);
```

### Step 3: Update Weather Notification Creation

**Before:**

```typescript
await saveNotificationHistory(
  {
    title: 'Heat Warning',
    body: 'High temperature detected',
    type: 'weather',
    level: 'warning',
    category: 'heat',
    data: { temperature: 38 },
  },
  {
    location: 'central_naic',
    audience: 'both',
    weatherZone: 'central_naic',
  },
  150,
  []
);
```

**After:**

```typescript
await notificationService.createWeatherNotification({
  title: '🔥 Heat Warning',
  message: 'High temperature detected',
  location: 'central_naic',
  audience: 'both',
  sentTo: 150,
  weatherData: {
    weatherType: 'current',
    severity: 'WARNING',
    category: 'Heat',
    temperature: 38,
    priority: 2,
    source: 'weather_api',
  },
  deliveryStatus: {
    success: 148,
    failure: 2,
  },
});
```

### Step 4: Update Queries

**Before:**

```typescript
const snapshot = await db
  .collection('notifications')
  .where('type', '==', 'weather')
  .where('metadata.location', '==', 'central_naic')
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get();

const notifications = snapshot.docs.map(doc => doc.data());
```

**After:**

```typescript
const notifications = await notificationService.queryNotifications({
  type: 'weather',
  location: 'central_naic',
  limit: 50,
});
```

---

## 📊 Firestore Collection Structure

### Single Collection: `notifications`

```
notifications/
  ├── weather_central_naic_1701513600000/
  │   ├── id: "weather_central_naic_1701513600000"
  │   ├── type: "weather"
  │   ├── location: "central_naic"
  │   ├── barangays: ["muzon", "malainem bago", "santulan", ...]
  │   ├── data: { WeatherNotificationData }
  │   └── ...
  │
  ├── earthquake_coastal_west_1701513700000/
  │   ├── id: "earthquake_coastal_west_1701513700000"
  │   ├── type: "earthquake"
  │   ├── location: "coastal_west"
  │   ├── barangays: ["labac", "mabolo", "bancaan", ...]
  │   ├── data: { EarthquakeNotificationData }
  │   └── ...
  │
  └── announcement_sabang_1701513800000/
      ├── id: "announcement_sabang_1701513800000"
      ├── type: "announcement"
      ├── location: "sabang"
      ├── barangays: ["sabang"]
      ├── data: { AnnouncementNotificationData }
      └── ...
```

### Indexes Required

Create these composite indexes in Firebase Console:

```
Collection: notifications
1. type (Ascending) + timestamp (Descending)
2. location (Ascending) + timestamp (Descending)
3. type (Ascending) + location (Ascending) + timestamp (Descending)
4. audience (Ascending) + timestamp (Descending)
```

---

## 🔍 Query Examples

### 1. Get All Weather Notifications for Central Naic

```typescript
const notifications = await notificationService.queryNotifications({
  type: 'weather',
  location: 'central_naic',
  limit: 50,
});
```

### 2. Get Critical Weather Alerts (Last 24 Hours)

```typescript
const criticalAlerts = await notificationService.queryNotifications({
  type: 'weather',
  severity: ['CRITICAL', 'WARNING'],
  startTime: Date.now() - 24 * 60 * 60 * 1000,
});
```

### 3. Get Notifications for Specific Barangay

```typescript
const barangayNotifications = await notificationService.getNotificationsForBarangay('labac', 30);
```

### 4. Get Unread Notifications for User

```typescript
const unreadNotifications = await notificationService.queryNotifications({
  userId: 'user123',
  onlyUnread: true,
  excludeHidden: true,
  limit: 20,
});

// Or get just the count
const unreadCount = await notificationService.getUnreadCount('user123');
```

### 5. Get All Recent Critical Notifications

```typescript
const criticalNotifications = await notificationService.getRecentCriticalNotifications(24, 10);
```

---

## 🔧 Common Operations

### Create Weather Notification

```typescript
const notificationId = await notificationService.createWeatherNotification({
  title: '🌧️ Heavy Rain Warning',
  message: 'Heavy rainfall expected. Risk of flooding in low-lying areas.',
  location: 'coastal_east',
  audience: 'both',
  sentTo: 200,
  weatherData: {
    weatherType: 'current',
    severity: 'WARNING',
    category: 'Rain',
    rainIntensity: 8.5,
    rainAccumulation: 35,
    priority: 2,
    source: 'weather_api',
  },
});
```

### Mark as Read

```typescript
await notificationService.markAsRead(notificationId, userId);
```

### Bulk Mark as Read

```typescript
const notificationIds = ['id1', 'id2', 'id3'];
await notificationService.bulkMarkAsRead(notificationIds, userId);
```

### Get Statistics

```typescript
const stats = await notificationService.getStats({
  startTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
  userId: 'user123',
});

console.log(`Total: ${stats.total}`);
console.log(`Unread: ${stats.unreadCount}`);
console.log(`By Type:`, stats.byType);
console.log(`By Location:`, stats.byLocation);
```

### Cleanup Old Notifications

```typescript
// Delete notifications older than 30 days
const deletedCount = await notificationService.cleanupOldNotifications(30);
```

---

## 🎨 Frontend Integration

### React Example

```typescript
import { NotificationService } from '@/lib/notification-service';

function NotificationsList() {
  const [notifications, setNotifications] = useState([]);
  const userId = useAuthStore(state => state.user.id);

  useEffect(() => {
    const fetchNotifications = async () => {
      const notificationService = new NotificationService(db);

      const data = await notificationService.queryNotifications({
        userId: userId,
        onlyUnread: true,
        excludeHidden: true,
        limit: 50,
      });

      setNotifications(data);
    };

    fetchNotifications();
  }, [userId]);

  const handleMarkAsRead = async (notificationId: string) => {
    const notificationService = new NotificationService(db);
    await notificationService.markAsRead(notificationId, userId);

    // Update local state
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, readBy: [...(n.readBy || []), userId] } : n))
    );
  };

  return (
    <div>
      {notifications.map(notification => (
        <NotificationCard key={notification.id} notification={notification} onMarkAsRead={handleMarkAsRead} />
      ))}
    </div>
  );
}
```

---

## ⚠️ Breaking Changes

1. **`body` renamed to `message`**

   - Old: `notification.body`
   - New: `notification.message`

2. **`metadata` is now split into specific fields**

   - Old: `metadata.location`
   - New: `location` (top-level)

3. **`timestamp` is now Unix timestamp (number)**

   - Old: `timestamp: Date`
   - New: `timestamp: number` (use `createdAt` for ISO string)

4. **Type-specific data structure**
   - Old: Generic `data?: any`
   - New: Strongly typed unions based on `type`

---

## 📝 Best Practices

1. **Always use NotificationService** instead of direct Firestore operations
2. **Use type guards** when accessing notification data
3. **Include deliveryStatus** for tracking FCM results
4. **Set appropriate audience** to avoid unnecessary notifications
5. **Use barangay-specific queries** for better performance
6. **Implement read/hidden tracking** for better UX
7. **Run cleanup regularly** (e.g., monthly cron job)

---

## 🐛 Troubleshooting

### Issue: "Cannot read property 'severity' of undefined"

**Solution:** Use type guards:

```typescript
if (notification.type === 'weather' && notification.data) {
  const weatherData = notification.data as WeatherNotificationData;
  console.log(weatherData.severity);
}
```

### Issue: "Index not found" error when querying

**Solution:** Create composite indexes in Firebase Console (see "Indexes Required" section)

### Issue: Notifications not showing for specific barangay

**Solution:** Check if barangay name matches exactly (lowercase, correct spelling):

```typescript
const notifications = await notificationService.getNotificationsForBarangay('labac'); // ✓
const notifications = await notificationService.getNotificationsForBarangay('Labac'); // ✗
```

---

## 📚 Additional Resources

- **Schema Definition**: `notification-schema.ts`
- **Service Implementation**: `notification-service.ts`
- **Usage Examples**: `notification-examples.ts`
- **Firestore Client**: `firestore-client.ts` (updated `saveNotificationHistory`)

---

## ✅ Checklist

- [ ] Import new notification service
- [ ] Update all notification creation calls
- [ ] Update all notification queries
- [ ] Create required Firestore indexes
- [ ] Update frontend components
- [ ] Test read/hidden functionality
- [ ] Set up cleanup cron job
- [ ] Migrate existing notifications (optional)
- [ ] Update API documentation
- [ ] Train team on new system
