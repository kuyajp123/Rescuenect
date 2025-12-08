# Notification System Architecture

## 📐 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION SYSTEM                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   Single Unified Collection             │
        │   notifications/                        │
        │   - All notification types              │
        │   - Strongly typed                      │
        │   - Location-based organization         │
        └─────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
    │   Weather   │  │  Earthquake  │  │ Announcement │
    │   Alerts    │  │    Alerts    │  │   & Others   │
    └─────────────┘  └──────────────┘  └──────────────┘
```

---

## 🗂️ Collection Structure

```
Firestore Database
│
└── notifications/  (Single Collection)
    │
    ├── weather_central_naic_1701513600000
    │   ├── id: "weather_central_naic_1701513600000"
    │   ├── type: "weather"
    │   ├── title: "🔥 Extreme Heat Warning"
    │   ├── message: "Heat index has reached 42°C..."
    │   ├── timestamp: 1701513600000
    │   ├── createdAt: "2023-12-02T12:00:00.000Z"
    │   ├── location: "central_naic"
    │   ├── barangays: ["muzon", "santulan", "calubcob", ...]
    │   ├── audience: "both"
    │   ├── readBy: ["user123", "user456"]
    │   ├── hiddenBy: ["user789"]
    │   ├── sentTo: 150
    │   ├── deliveryStatus: { success: 148, failure: 2 }
    │   └── data: {
    │       ├── weatherType: "current"
    │       ├── severity: "CRITICAL"
    │       ├── category: "Heat"
    │       ├── temperature: 38
    │       ├── temperatureApparent: 42
    │       ├── humidity: 75
    │       └── priority: 1
    │       }
    │
    ├── earthquake_coastal_west_1701513700000
    │   ├── id: "earthquake_coastal_west_1701513700000"
    │   ├── type: "earthquake"
    │   ├── location: "coastal_west"
    │   ├── barangays: ["labac", "mabolo", "bancaan", ...]
    │   └── data: {
    │       ├── earthquakeId: "us7000k9h2"
    │       ├── magnitude: 6.5
    │       ├── coordinates: { lat, lng, depth }
    │       ├── severity: "strong"
    │       ├── tsunamiWarning: false
    │       └── priority: "critical"
    │       }
    │
    └── announcement_sabang_1701513800000
        ├── type: "announcement"
        ├── location: "sabang"
        └── data: {
            ├── category: "event"
            ├── priority: "medium"
            ├── expiresAt: "2024-12-10T00:00:00.000Z"
            ├── imageUrl: "https://..."
            └── actionUrl: "https://..."
            }
```

---

## 🌍 Location & Barangay Mapping

```
Weather Zones                    Barangays
─────────────                    ─────────

coastal_west      ───────────►   labac
                                 mabolo
                                 bancaan
                                 balsahan
                                 bagong karsada
                                 sapa
                                 bucana sasahan
                                 capt c. nazareno
                                 gomez-zamora
                                 kanluran
                                 humbac

coastal_east      ───────────►   bucana malaki
                                 ibayo estacion
                                 ibayo silangan
                                 latoria
                                 munting mapino
                                 timalan balsahan
                                 timalan concepcion

central_naic      ───────────►   muzon
                                 malainem bago
                                 santulan
                                 calubcob
                                 makina
                                 san roque

sabang            ───────────►   sabang

farm_area         ───────────►   molino
                                 halang
                                 palangue 1

naic_boundary     ───────────►   malainem luma
                                 palangue 2 & 3
```

---

## 🔄 Data Flow

### Creating a Notification

```
┌──────────────────┐
│  Weather Data    │
│  from API        │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ Weather Notification Core    │
│ - Check conditions           │
│ - Determine severity         │
│ - Generate notification      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Unified Weather Processor    │
│ - Process all locations      │
│ - Filter notifications       │
│ - Get user tokens            │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ FCM Client                   │
│ - Send to devices            │
│ - Track delivery status      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Notification Service         │
│ - Create notification doc    │
│ - Save to Firestore          │
│ - Include delivery status    │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Firestore                    │
│ notifications/               │
│ weather_location_timestamp   │
└──────────────────────────────┘
```

### Querying Notifications

```
┌──────────────────┐
│  Frontend App    │
│  (React/Mobile)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ Notification Service         │
│ queryNotifications({         │
│   userId: "user123",         │
│   onlyUnread: true,          │
│   limit: 20                  │
│ })                           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Firestore Query              │
│ - Filter by criteria         │
│ - Order by timestamp         │
│ - Apply limit                │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Client-side Filtering        │
│ - Filter by readBy           │
│ - Filter by hiddenBy         │
│ - Filter by barangay         │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Return Results               │
│ - Strongly typed             │
│ - Ready for display          │
└──────────────────────────────┘
```

---

## 📊 Type Hierarchy

```
BaseNotification
├── id: string
├── type: NotificationType
├── title: string
├── message: string
├── timestamp: number
├── createdAt: string
├── location: string
├── barangays?: string[]
├── audience: "admin" | "users" | "both"
├── readBy?: string[]
├── hiddenBy?: string[]
├── sentTo: number
├── deliveryStatus?: { success, failure, errors }
└── data?: TypeSpecificData

TypeSpecificData (Discriminated Union)
│
├── WeatherNotificationData
│   ├── weatherType: "current" | "forecast_3h" | "forecast_tomorrow"
│   ├── severity: "CRITICAL" | "WARNING" | "ADVISORY" | "INFO"
│   ├── category: "Heat" | "Rain" | "Wind" | "UV" | "Storm" | "Flood" | ...
│   ├── temperature?: number
│   ├── rainIntensity?: number
│   ├── windSpeed?: number
│   └── priority: number
│
├── EarthquakeNotificationData
│   ├── earthquakeId: string
│   ├── magnitude: number
│   ├── place: string
│   ├── coordinates: { latitude, longitude, depth }
│   ├── severity: "micro" | "minor" | "light" | "moderate" | "strong" | "major" | "great"
│   ├── tsunamiWarning: boolean
│   └── priority: "critical" | "high" | "medium" | "low"
│
└── AnnouncementNotificationData
    ├── category: "general" | "event" | "update" | "maintenance" | "alert"
    ├── priority: "high" | "medium" | "low"
    ├── expiresAt?: string
    ├── imageUrl?: string
    └── actionUrl?: string
```

---

## 🔍 Query Patterns

### Pattern 1: User-Centric Query

```
User opens app
    │
    ▼
Query: Get my unread notifications
    - userId: "user123"
    - onlyUnread: true
    - excludeHidden: true
    - limit: 50
    │
    ▼
Result: Unread notifications for user
```

### Pattern 2: Location-Based Query

```
User selects location filter
    │
    ▼
Query: Get notifications for location
    - location: "coastal_west"
    - startTime: last 7 days
    - limit: 100
    │
    ▼
Result: All notifications for coastal west
```

### Pattern 3: Critical Alerts Query

```
Display critical alerts dashboard
    │
    ▼
Query: Get recent critical notifications
    - severity: ["CRITICAL", "WARNING"]
    - startTime: last 24 hours
    - limit: 20
    │
    ▼
Result: Urgent notifications requiring attention
```

### Pattern 4: Barangay-Specific Query

```
User views barangay page
    │
    ▼
Query: Get notifications for barangay
    - barangay: "labac"
    - limit: 30
    │
    ▼
Filter: notifications.barangays includes "labac"
    │
    ▼
Result: Notifications affecting this barangay
```

---

## 🎯 User Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     User Journey                            │
└─────────────────────────────────────────────────────────────┘

1. Notification Created
   notifications/weather_central_naic_1701513600000
   readBy: []
   hiddenBy: []

2. User receives push notification (FCM)
   User opens app

3. User views notification list
   Query: { userId: "user123", onlyUnread: true }
   Shows: All unread notifications

4. User taps notification
   Action: markAsRead("weather_central_naic_1701513600000", "user123")
   Result: readBy: ["user123"]

5. User swipes to hide
   Action: markAsHidden("weather_central_naic_1701513600000", "user123")
   Result: hiddenBy: ["user123"]

6. Next query excludes hidden
   Query: { userId: "user123", excludeHidden: true }
   Shows: All notifications except hidden ones
```

---

## 🔐 Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Firestore Rules                          │
└─────────────────────────────────────────────────────────────┘

READ Access
│
├── Admin Users (role: "admin")
│   └── Can read ALL notifications
│
└── Regular Users
    ├── Can read notifications where audience == "users" or "both"
    └── Cannot read notifications where audience == "admin"

WRITE Access
│
├── CREATE
│   ├── Admins ✓
│   └── System (from Edge Functions) ✓
│
├── UPDATE
│   ├── Users can update ONLY readBy/hiddenBy for themselves ✓
│   └── Admins can update anything ✓
│
└── DELETE
    └── Admins only ✓
```

---

## 📈 Analytics Dashboard Example

```
┌─────────────────────────────────────────────────────────────┐
│                 Notification Statistics                     │
│                    (Last 30 Days)                           │
└─────────────────────────────────────────────────────────────┘

Total Notifications: 1,247
Unread: 89

By Type:
├── Weather:      843 (67.6%)
├── Earthquake:    52 (4.2%)
├── Announcement: 298 (23.9%)
└── Other:         54 (4.3%)

By Location:
├── central_naic:  487 (39.1%)
├── coastal_west:  356 (28.5%)
├── coastal_east:  289 (23.2%)
├── sabang:         78 (6.3%)
└── other:          37 (2.9%)

By Severity (Weather):
├── CRITICAL:   23 (2.7%)
├── WARNING:   187 (22.2%)
├── ADVISORY:  445 (52.8%)
└── INFO:      188 (22.3%)

Delivery Success Rate: 98.3%
├── Success:  1,226
└── Failure:     21
```

---

## 🔄 Cleanup Process

```
┌─────────────────────────────────────────────────────────────┐
│              Automated Cleanup (Monthly)                    │
└─────────────────────────────────────────────────────────────┘

Cron Job (1st of every month)
    │
    ▼
cleanupOldNotifications(30)
    │
    ├── Query: timestamp < (now - 30 days)
    │
    ├── Found: 1,234 old notifications
    │
    ├── Delete in batches (500 at a time)
    │   ├── Batch 1: 500 deleted
    │   ├── Batch 2: 500 deleted
    │   └── Batch 3: 234 deleted
    │
    └── Result: 1,234 notifications cleaned up
```

---

## 🚀 Scalability Considerations

### Current Design

- ✅ Single collection for all notification types
- ✅ Indexed queries for fast retrieval
- ✅ Automatic barangay mapping
- ✅ Efficient filtering at query level
- ✅ User interaction tracking with arrays

### Future Optimizations (if needed)

- 📊 Add sharding by month (notifications_2024_12/)
- 📊 Implement read/hidden as subcollections for large user bases
- 📊 Cache critical notifications in Redis
- 📊 Archive old notifications to Cloud Storage
- 📊 Implement real-time listeners for active notifications

---

## 📱 Mobile/Web Integration

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend Integration                       │
└─────────────────────────────────────────────────────────────┘

React/React Native
    │
    ├── State Management (Zustand)
    │   ├── notifications: Notification[]
    │   ├── unreadCount: number
    │   └── actions: { fetch, markAsRead, hide }
    │
    ├── Components
    │   ├── NotificationList
    │   ├── NotificationCard
    │   ├── NotificationBadge
    │   └── NotificationFilter
    │
    └── Hooks
        ├── useNotifications()
        ├── useUnreadCount()
        └── useNotificationActions()

Firebase SDK
    │
    └── NotificationService
        ├── queryNotifications()
        ├── markAsRead()
        ├── markAsHidden()
        └── getStats()
```

---

This architecture provides a scalable, maintainable, and type-safe notification system ready for current needs and future expansion!
