# 📢 Unified Notification System

A comprehensive, strongly-typed notification system for managing weather alerts, earthquake notifications, announcements, and more in Firestore.

---

## 🌟 Features

✅ **Single Unified Collection** - All notification types in one place  
✅ **Strongly Typed** - Full TypeScript support with discriminated unions  
✅ **Location-Based** - Automatic barangay mapping from weather zones  
✅ **User Interaction Tracking** - Read/hidden status per user  
✅ **Advanced Querying** - Filter by type, location, severity, time, etc.  
✅ **Delivery Tracking** - Monitor FCM success/failure rates  
✅ **Statistics & Analytics** - Built-in stats aggregation  
✅ **Automatic Cleanup** - Remove old notifications

---

## 📦 Files Overview

```
Backend/supabase/functions/_shared/
├── notification-schema.ts           # Type definitions and interfaces
├── notification-service.ts          # CRUD operations and business logic
├── notification-examples.ts         # Usage examples
├── NOTIFICATION_MIGRATION_GUIDE.md  # Migration documentation
└── firestore-client.ts              # Updated with new schema support
```

---

## 🚀 Quick Start

### 1. Import the Service

```typescript
import { NotificationService } from './notification-service.ts';
import { initializeFirebase } from './firestore-client.ts';

const db = initializeFirebase();
const notificationService = new NotificationService(db);
```

### 2. Create a Weather Notification

```typescript
const notificationId = await notificationService.createWeatherNotification({
  title: '🔥 Extreme Heat Warning',
  message: 'Heat index has reached 42°C. Stay indoors and keep hydrated.',
  location: 'central_naic',
  audience: 'both',
  sentTo: 150,
  weatherData: {
    weatherType: 'current',
    severity: 'CRITICAL',
    category: 'Heat',
    temperature: 38,
    temperatureApparent: 42,
    humidity: 75,
    priority: 1,
    source: 'weather_api',
  },
});
```

### 3. Query Notifications

```typescript
// Get unread notifications for a user
const notifications = await notificationService.queryNotifications({
  userId: 'user123',
  onlyUnread: true,
  excludeHidden: true,
  limit: 20,
});

// Get critical weather alerts from last 24 hours
const criticalAlerts = await notificationService.queryNotifications({
  type: 'weather',
  severity: ['CRITICAL', 'WARNING'],
  startTime: Date.now() - 24 * 60 * 60 * 1000,
});
```

### 4. Mark as Read

```typescript
await notificationService.markAsRead(notificationId, userId);
```

---

## 📊 Notification Schema

### Base Structure

All notifications share this base structure:

```typescript
{
  id: string;                    // Generated: weather_central_naic_1701513600000
  type: NotificationType;        // "weather" | "earthquake" | "announcement" | etc.
  title: string;
  message: string;
  timestamp: number;             // Unix timestamp in milliseconds
  createdAt: string;             // ISO string

  location: string;              // weather zone or barangay
  barangays?: string[];          // Affected barangays
  audience: "admin" | "users" | "both";

  readBy?: string[];             // User IDs who read this
  hiddenBy?: string[];           // User IDs who hidden this

  sentTo: number;
  deliveryStatus?: {
    success: number;
    failure: number;
    errors?: string[];
  };

  data?: TypeSpecificData;       // Varies by notification type
}
```

### Weather Notification Data

```typescript
{
  weatherType: "current" | "forecast_3h" | "forecast_tomorrow";
  severity: "CRITICAL" | "WARNING" | "ADVISORY" | "INFO";
  category: "Heat" | "Rain" | "Wind" | "UV" | "Storm" | "Flood" | etc.;
  temperature?: number;
  rainIntensity?: number;
  windSpeed?: number;
  priority: number;              // 1-5 (1 = highest)
  source: "weather_api" | "manual";
  // ... more weather metrics
}
```

### Earthquake Notification Data

```typescript
{
  earthquakeId: string;
  magnitude: number;
  place: string;
  coordinates: {
    latitude: number;
    longitude: number;
    depth: number;
  };
  severity: "micro" | "minor" | "light" | "moderate" | "strong" | "major" | "great";
  tsunamiWarning: boolean;
  priority: "critical" | "high" | "medium" | "low";
  usgsUrl?: string;
  source: "usgs" | "phivolcs" | "manual";
}
```

### Announcement Notification Data

```typescript
{
  category: "general" | "event" | "update" | "maintenance" | "alert";
  priority: "high" | "medium" | "low";
  expiresAt?: string;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  source: "admin" | "system";
}
```

---

## 🎯 Location & Barangay Mapping

The system automatically maps weather zones to barangays:

```typescript
// Weather Zones → Barangays
coastal_west    → labac, mabolo, bancaan, balsahan, bagong karsada, sapa, etc.
coastal_east    → bucana malaki, ibayo estacion, ibayo silangan, latoria, etc.
central_naic    → muzon, malainem bago, santulan, calubcob, makina, san roque
sabang          → sabang
farm_area       → molino, halang, palangue 1
naic_boundary   → malainem luma, palangue 2 & 3
```

Query notifications by barangay:

```typescript
const notifications = await notificationService.getNotificationsForBarangay('labac', 30);
```

---

## 🔍 Querying Notifications

### Filter Options

```typescript
interface NotificationQueryFilter {
  type?: NotificationType | NotificationType[];
  location?: string | string[];
  barangay?: string;
  audience?: 'admin' | 'users' | 'both';
  severity?: WeatherSeverity | WeatherSeverity[];
  startTime?: number;
  endTime?: number;
  limit?: number;
  userId?: string;
  onlyUnread?: boolean;
  excludeHidden?: boolean;
}
```

### Common Queries

**Get all weather notifications:**

```typescript
const weather = await notificationService.queryNotifications({
  type: 'weather',
  limit: 50,
});
```

**Get notifications for specific location:**

```typescript
const coastal = await notificationService.queryNotifications({
  location: 'coastal_west',
  startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
});
```

**Get unread notifications for user:**

```typescript
const unread = await notificationService.queryNotifications({
  userId: 'user123',
  onlyUnread: true,
  excludeHidden: true,
});
```

**Get critical alerts:**

```typescript
const critical = await notificationService.queryNotifications({
  severity: ['CRITICAL', 'WARNING'],
  startTime: Date.now() - 24 * 60 * 60 * 1000,
});
```

**Multiple types and locations:**

```typescript
const alerts = await notificationService.queryNotifications({
  type: ['weather', 'earthquake'],
  location: ['central_naic', 'coastal_west', 'coastal_east'],
  limit: 100,
});
```

---

## 👤 User Interaction Tracking

### Mark as Read

```typescript
// Single notification
await notificationService.markAsRead(notificationId, userId);

// Bulk operation
const ids = ['id1', 'id2', 'id3'];
await notificationService.bulkMarkAsRead(ids, userId);
```

### Mark as Hidden

```typescript
await notificationService.markAsHidden(notificationId, userId);
```

### Unhide/Mark as Unread

```typescript
await notificationService.unhideNotification(notificationId, userId);
await notificationService.markAsUnread(notificationId, userId);
```

### Get Unread Count

```typescript
const count = await notificationService.getUnreadCount('user123');
console.log(`User has ${count} unread notifications`);
```

---

## 📈 Statistics & Analytics

```typescript
const stats = await notificationService.getStats({
  startTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
  userId: 'user123',
});

console.log(`Total: ${stats.total}`);
console.log(`Unread: ${stats.unreadCount}`);
console.log('By Type:', stats.byType);
console.log('By Location:', stats.byLocation);
console.log('By Severity:', stats.bySeverity);

// Output:
// Total: 247
// Unread: 12
// By Type: { weather: 180, earthquake: 15, announcement: 52 }
// By Location: { central_naic: 100, coastal_west: 80, coastal_east: 67 }
// By Severity: { CRITICAL: 5, WARNING: 45, ADVISORY: 80, INFO: 50 }
```

---

## 🧹 Maintenance

### Cleanup Old Notifications

```typescript
// Delete notifications older than 30 days
const deleted = await notificationService.cleanupOldNotifications(30);
console.log(`Cleaned up ${deleted} old notifications`);
```

### Delete Specific Notifications (Admin)

```typescript
// Single delete
await notificationService.deleteNotification('notification_id');

// Bulk delete
const idsToDelete = ['id1', 'id2', 'id3'];
await notificationService.bulkDeleteNotifications(idsToDelete);
```

---

## 🔧 API Reference

### NotificationService Methods

#### Creation Methods

- `createWeatherNotification(params)` - Create weather notification
- `createEarthquakeNotification(params)` - Create earthquake notification
- `createAnnouncementNotification(params)` - Create announcement notification
- `createNotification(params)` - Create generic notification

#### Query Methods

- `queryNotifications(filter)` - Query with advanced filters
- `getNotification(id)` - Get single notification
- `getNotificationsForBarangay(barangay, limit)` - Get barangay-specific notifications
- `getRecentCriticalNotifications(hours, limit)` - Get recent critical alerts
- `getUnreadCount(userId, filter?)` - Get unread count for user

#### User Interaction Methods

- `markAsRead(notificationId, userId)` - Mark as read
- `markAsHidden(notificationId, userId)` - Hide notification
- `markAsUnread(notificationId, userId)` - Mark as unread
- `unhideNotification(notificationId, userId)` - Unhide notification
- `bulkMarkAsRead(notificationIds, userId)` - Bulk mark as read

#### Analytics Methods

- `getStats(filter)` - Get notification statistics

#### Maintenance Methods

- `deleteNotification(notificationId)` - Delete single notification
- `bulkDeleteNotifications(notificationIds)` - Bulk delete
- `cleanupOldNotifications(daysOld)` - Remove old notifications

---

## 🎨 Frontend Integration Example

### React with Zustand

```typescript
// stores/notificationStore.ts
import { create } from 'zustand';
import { NotificationService } from '@/lib/notification-service';
import { Notification } from '@/types/notification-schema';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;

  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string, userId: string) => Promise<void>;
  markAsHidden: (notificationId: string, userId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (userId: string) => {
    set({ loading: true });

    const notificationService = new NotificationService(db);
    const notifications = await notificationService.queryNotifications({
      userId,
      excludeHidden: true,
      limit: 50,
    });

    const unreadCount = await notificationService.getUnreadCount(userId);

    set({ notifications, unreadCount, loading: false });
  },

  markAsRead: async (notificationId: string, userId: string) => {
    const notificationService = new NotificationService(db);
    await notificationService.markAsRead(notificationId, userId);

    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, readBy: [...(n.readBy || []), userId] } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAsHidden: async (notificationId: string, userId: string) => {
    const notificationService = new NotificationService(db);
    await notificationService.markAsHidden(notificationId, userId);

    set(state => ({
      notifications: state.notifications.filter(n => n.id !== notificationId),
    }));
  },
}));
```

---

## 📋 Required Firestore Indexes

Create these composite indexes in Firebase Console:

```
Collection: notifications

Index 1:
- type (Ascending)
- timestamp (Descending)

Index 2:
- location (Ascending)
- timestamp (Descending)

Index 3:
- type (Ascending)
- location (Ascending)
- timestamp (Descending)

Index 4:
- audience (Ascending)
- timestamp (Descending)
```

---

## 🔐 Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notifications/{notificationId} {
      // Read: Users can read notifications targeted to them
      allow read: if request.auth != null && (
        resource.data.audience == 'both' ||
        (resource.data.audience == 'users' && !isAdmin()) ||
        (resource.data.audience == 'admin' && isAdmin())
      );

      // Write: Only admins and system can create notifications
      allow create: if isAdmin() || isSystem();

      // Update: Users can update readBy and hiddenBy for themselves
      allow update: if request.auth != null && (
        onlyUpdating(['readBy', 'hiddenBy']) ||
        isAdmin()
      );

      // Delete: Only admins
      allow delete: if isAdmin();
    }

    function isAdmin() {
      return request.auth.token.role == 'admin';
    }

    function isSystem() {
      return request.auth.token.system == true;
    }

    function onlyUpdating(fields) {
      return request.resource.data.diff(resource.data).affectedKeys().hasOnly(fields);
    }
  }
}
```

---

## 📚 Additional Documentation

- **[Migration Guide](./NOTIFICATION_MIGRATION_GUIDE.md)** - Step-by-step migration from old schema
- **[Usage Examples](./notification-examples.ts)** - Comprehensive code examples
- **[Schema Definition](./notification-schema.ts)** - Full TypeScript types
- **[Service Implementation](./notification-service.ts)** - Complete service code

---

## 💡 Best Practices

1. **Always use NotificationService** - Don't access Firestore directly
2. **Include deliveryStatus** - Track FCM success/failure rates
3. **Set appropriate audience** - Avoid sending to unnecessary users
4. **Use type guards** - Safely access type-specific data
5. **Implement read tracking** - Better UX with read/unread states
6. **Run cleanup regularly** - Schedule monthly cleanup of old notifications
7. **Monitor statistics** - Track notification patterns and effectiveness

---

## 🐛 Common Issues

**Q: TypeScript error "Type 'X' is not assignable to type 'Y'"**  
A: Use type guards when accessing notification data:

```typescript
if (notification.type === 'weather' && notification.data) {
  const weatherData = notification.data as WeatherNotificationData;
  console.log(weatherData.severity);
}
```

**Q: "Index not found" error when querying**  
A: Create the required composite indexes in Firebase Console (see "Required Firestore Indexes" section)

**Q: Notifications not showing for specific barangay**  
A: Ensure barangay name is lowercase and matches exactly (e.g., 'labac' not 'Labac')

---

## 📞 Support

For questions or issues:

1. Check the [Migration Guide](./NOTIFICATION_MIGRATION_GUIDE.md)
2. Review [Usage Examples](./notification-examples.ts)
3. Consult the TypeScript types in [notification-schema.ts](./notification-schema.ts)

---

## ✨ Summary

This unified notification system provides:

- ✅ Single source of truth for all notifications
- ✅ Strong typing and IntelliSense support
- ✅ Location-based organization with automatic barangay mapping
- ✅ User interaction tracking (read/hidden status)
- ✅ Advanced filtering and querying
- ✅ Built-in analytics and statistics
- ✅ Easy maintenance and cleanup
- ✅ Scalable architecture for future notification types

**Ready to use!** Start by importing `NotificationService` and creating your first notification.
