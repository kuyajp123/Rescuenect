# 🚀 Notification System Quick Reference

## 📦 Import

```typescript
import { NotificationService } from './notification-service.ts';
import { initializeFirebase } from './firestore-client.ts';

const db = initializeFirebase();
const notificationService = new NotificationService(db);
```

---

## ✨ Create Notifications

### Weather

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
});
```

### Earthquake

```typescript
await notificationService.createEarthquakeNotification({
  title: '🚨 Earthquake Alert',
  message: 'Magnitude 6.5 detected',
  location: 'central_naic',
  audience: 'both',
  sentTo: 500,
  earthquakeData: {
    earthquakeId: 'us7000k9h2',
    magnitude: 6.5,
    place: '25km SE of Naic',
    coordinates: { latitude: 14.3167, longitude: 120.7667, depth: 15.2 },
    severity: 'strong',
    tsunamiWarning: false,
    priority: 'critical',
    source: 'usgs',
  },
});
```

### Announcement

```typescript
await notificationService.createAnnouncementNotification({
  title: '📢 Community Event',
  message: 'Health screening this Saturday',
  location: 'central_naic',
  audience: 'users',
  sentTo: 300,
  announcementData: {
    category: 'event',
    priority: 'medium',
    expiresAt: '2024-12-10T00:00:00.000Z',
    source: 'admin',
  },
});
```

---

## 🔍 Query Notifications

### Basic Query

```typescript
const notifications = await notificationService.queryNotifications({
  type: 'weather',
  limit: 50,
});
```

### By Location

```typescript
const notifications = await notificationService.queryNotifications({
  location: 'coastal_west',
  startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
});
```

### Unread for User

```typescript
const notifications = await notificationService.queryNotifications({
  userId: 'user123',
  onlyUnread: true,
  excludeHidden: true,
});
```

### Critical Alerts

```typescript
const notifications = await notificationService.queryNotifications({
  severity: ['CRITICAL', 'WARNING'],
  startTime: Date.now() - 24 * 60 * 60 * 1000,
});
```

### Multiple Types & Locations

```typescript
const notifications = await notificationService.queryNotifications({
  type: ['weather', 'earthquake'],
  location: ['central_naic', 'coastal_west'],
  limit: 100,
});
```

### By Barangay

```typescript
const notifications = await notificationService.getNotificationsForBarangay('labac', 30);
```

---

## 👤 User Actions

### Mark as Read

```typescript
await notificationService.markAsRead(notificationId, userId);
```

### Mark as Hidden

```typescript
await notificationService.markAsHidden(notificationId, userId);
```

### Mark as Unread

```typescript
await notificationService.markAsUnread(notificationId, userId);
```

### Unhide

```typescript
await notificationService.unhideNotification(notificationId, userId);
```

### Bulk Mark as Read

```typescript
const ids = ['id1', 'id2', 'id3'];
await notificationService.bulkMarkAsRead(ids, userId);
```

---

## 📊 Statistics

### Get Stats

```typescript
const stats = await notificationService.getStats({
  startTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
  userId: 'user123',
});

console.log(stats.total); // 247
console.log(stats.unreadCount); // 12
console.log(stats.byType); // { weather: 180, earthquake: 15, ... }
console.log(stats.byLocation); // { central_naic: 100, ... }
console.log(stats.bySeverity); // { CRITICAL: 5, WARNING: 45, ... }
```

### Unread Count

```typescript
const count = await notificationService.getUnreadCount('user123');
```

### Recent Critical

```typescript
const critical = await notificationService.getRecentCriticalNotifications(24, 10);
```

---

## 🗑️ Maintenance

### Cleanup Old

```typescript
const deleted = await notificationService.cleanupOldNotifications(30);
```

### Delete Single

```typescript
await notificationService.deleteNotification(notificationId);
```

### Bulk Delete

```typescript
const ids = ['id1', 'id2', 'id3'];
await notificationService.bulkDeleteNotifications(ids);
```

---

## 🎯 Weather Zones → Barangays

```
coastal_west    → labac, mabolo, bancaan, balsahan, bagong karsada, sapa, ...
coastal_east    → bucana malaki, ibayo estacion, ibayo silangan, latoria, ...
central_naic    → muzon, malainem bago, santulan, calubcob, makina, san roque
sabang          → sabang
farm_area       → molino, halang, palangue 1
naic_boundary   → malainem luma, palangue 2 & 3
```

---

## 📋 Notification Schema

```typescript
{
  id: string;                      // weather_central_naic_1701513600000
  type: NotificationType;          // "weather" | "earthquake" | "announcement"
  title: string;
  message: string;
  timestamp: number;               // Unix timestamp
  createdAt: string;               // ISO string
  location: string;
  barangays?: string[];
  audience: "admin" | "users" | "both";
  readBy?: string[];
  hiddenBy?: string[];
  sentTo: number;
  deliveryStatus?: {
    success: number;
    failure: number;
    errors?: string[];
  };
  data?: TypeSpecificData;
}
```

---

## 🔧 Filter Options

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

---

## 🎨 React Example

```typescript
// Zustand Store
const useNotificationStore = create(set => ({
  notifications: [],
  unreadCount: 0,

  fetch: async userId => {
    const data = await notificationService.queryNotifications({
      userId,
      excludeHidden: true,
      limit: 50,
    });
    const count = await notificationService.getUnreadCount(userId);
    set({ notifications: data, unreadCount: count });
  },

  markAsRead: async (id, userId) => {
    await notificationService.markAsRead(id, userId);
    set(state => ({
      notifications: state.notifications.map(n => (n.id === id ? { ...n, readBy: [...(n.readBy || []), userId] } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },
}));

// Component
function NotificationList() {
  const { notifications, fetch, markAsRead } = useNotificationStore();
  const userId = useAuthStore(state => state.user.id);

  useEffect(() => {
    fetch(userId);
  }, [userId]);

  return (
    <div>
      {notifications.map(n => (
        <NotificationCard key={n.id} notification={n} onMarkAsRead={() => markAsRead(n.id, userId)} />
      ))}
    </div>
  );
}
```

---

## 🔐 Firestore Indexes

```
Collection: notifications

1. type (Ascending) + timestamp (Descending)
2. location (Ascending) + timestamp (Descending)
3. type (Ascending) + location (Ascending) + timestamp (Descending)
4. audience (Ascending) + timestamp (Descending)
```

---

## 💡 Pro Tips

✅ **Use type guards** when accessing notification data
✅ **Include deliveryStatus** when creating notifications
✅ **Set appropriate audience** to avoid spam
✅ **Run cleanup monthly** to remove old notifications
✅ **Monitor unread counts** for better UX
✅ **Use barangay queries** for location-specific views
✅ **Implement real-time listeners** for active notifications

---

## 📚 Full Documentation

- [README](./README_NOTIFICATIONS.md) - Complete guide
- [Migration Guide](./NOTIFICATION_MIGRATION_GUIDE.md) - Upgrade steps
- [Architecture](./NOTIFICATION_ARCHITECTURE.md) - System design
- [Examples](./notification-examples.ts) - Code samples
