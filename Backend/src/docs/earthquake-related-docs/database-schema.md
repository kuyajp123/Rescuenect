# Firestore Database Schema for Earthquake System

## Overview

The earthquake monitoring system uses two main Firestore collections to store earthquake data and notification records separately. This separation allows for efficient querying and management of both datasets.

## Collections Structure

```
Firestore Database
├── earthquakes/          # Main earthquake data
│   ├── {earthquake_id}    # Document per earthquake
│   └── ...
└── notifications/         # Notification records
    ├── {notification_id}  # Document per notification
    └── ...
```

## Earthquakes Collection

### Collection Path

```
/earthquakes
```

### Document Structure

```typescript
interface EarthquakeDocument {
  // Primary identification
  id: string; // USGS earthquake ID (e.g., "us6000rnq9")

  // Basic earthquake data
  magnitude: number; // Earthquake magnitude (e.g., 4.6)
  place: string; // Location description
  time: number; // Occurrence timestamp (milliseconds)
  updated: number; // Last update from USGS (milliseconds)

  // Geographic data
  coordinates: {
    longitude: number; // Longitude coordinate
    latitude: number; // Latitude coordinate
    depth: number; // Depth in kilometers
  };

  // USGS Properties (preserved for completeness)
  properties: {
    mag: number; // Magnitude
    place: string; // Location description
    time: number; // Occurrence time
    updated: number; // Last update time
    tz: number | null; // Timezone offset
    url: string; // USGS event page URL
    detail: string; // Detailed API endpoint
    felt: number | null; // "Did You Feel It?" responses
    cdi: number | null; // Community Determined Intensity
    mmi: number | null; // Modified Mercalli Intensity
    alert: string | null; // Alert level (green/yellow/orange/red)
    status: string; // Review status
    tsunami: number; // Tsunami warning (0 or 1)
    sig: number; // Significance score
    net: string; // Data source network
    code: string; // Event code
    ids: string; // Event IDs (comma-separated)
    sources: string; // Data sources
    types: string; // Available data types
    nst: number; // Number of seismic stations
    dmin: number; // Minimum distance to stations
    rms: number; // RMS travel time residual
    gap: number; // Largest azimuthal gap
    magType: string; // Magnitude type (mb, ml, mw)
    type: string; // Event type ("earthquake")
    title: string; // Event title
  };

  // System metadata
  created_at: number; // When added to our system
  updated_at: number; // Last system update
  processed_at: number; // When notifications were sent

  // Classification fields
  severity_level: 'micro' | 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';
  notification_sent: boolean; // Whether notification was sent
  notification_count: number; // Number of notifications sent
}
```

### Sample Document

```json
{
  "id": "us6000rnq9",
  "magnitude": 4.6,
  "place": "6 km NW of Bagalangit, Philippines",
  "time": 1763373268186,
  "updated": 1763387967040,
  "coordinates": {
    "longitude": 120.8377,
    "latitude": 13.7424,
    "depth": 146.927
  },
  "properties": {
    "mag": 4.6,
    "place": "6 km NW of Bagalangit, Philippines",
    "time": 1763373268186,
    "updated": 1763387967040,
    "tz": null,
    "url": "https://earthquake.usgs.gov/earthquakes/eventpage/us6000rnq9",
    "detail": "https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us6000rnq9&format=geojson",
    "felt": null,
    "cdi": null,
    "mmi": null,
    "alert": null,
    "status": "reviewed",
    "tsunami": 0,
    "sig": 326,
    "net": "us",
    "code": "6000rnq9",
    "ids": ",us6000rnq9,",
    "sources": ",us,",
    "types": ",origin,phase-data,",
    "nst": 37,
    "dmin": 14.088,
    "rms": 0.91,
    "gap": 89,
    "magType": "mb",
    "type": "earthquake",
    "title": "M 4.6 - 6 km NW of Bagalangit, Philippines"
  },
  "created_at": 1763512396000,
  "updated_at": 1763512396000,
  "processed_at": 1763512396123,
  "severity_level": "light",
  "notification_sent": true,
  "notification_count": 1
}
```

## Notifications Collection

### Collection Path

```
/notifications
```

### Document Structure

```typescript
interface NotificationDocument {
  // Primary identification
  id: string; // Unique notification ID
  earthquake_id: string; // Reference to earthquake document

  // Notification content
  type: 'earthquake_alert'; // Notification type
  title: string; // Notification title
  body: string; // Notification body text
  priority: 'low' | 'medium' | 'high' | 'critical' | 'emergency';

  // Earthquake context
  magnitude: number; // Earthquake magnitude
  location: string; // Location description
  coordinates: {
    longitude: number;
    latitude: number;
    depth: number;
  };

  // Timing information
  earthquake_time: number; // When earthquake occurred
  sent_at: number; // When notification was sent
  created_at: number; // When record was created

  // Delivery tracking
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed';
  delivery_attempts: number; // Number of send attempts
  fcm_response: {
    success: boolean;
    message_id?: string;
    error?: string;
  };

  // Audience targeting
  target_audience: 'all' | 'admin' | 'specific';
  recipient_count: number; // Number of recipients

  // Additional metadata
  severity_level: string; // Earthquake severity
  alert_level: string | null; // USGS alert level
  tsunami_warning: boolean; // Tsunami warning flag
}
```

### Sample Document

```json
{
  "id": "notif_us6000rnq9_1763512396123",
  "earthquake_id": "us6000rnq9",
  "type": "earthquake_alert",
  "title": "🚨 Earthquake Alert - Magnitude 4.6",
  "body": "A magnitude 4.6 earthquake occurred 6 km NW of Bagalangit, Philippines at 7:21 PM. Stay alert and follow safety protocols.",
  "priority": "medium",
  "magnitude": 4.6,
  "location": "6 km NW of Bagalangit, Philippines",
  "coordinates": {
    "longitude": 120.8377,
    "latitude": 13.7424,
    "depth": 146.927
  },
  "earthquake_time": 1763373268186,
  "sent_at": 1763512396123,
  "created_at": 1763512396120,
  "delivery_status": "sent",
  "delivery_attempts": 1,
  "fcm_response": {
    "success": true,
    "message_id": "projects/rescuenect/messages/0:1763512396123456%abcd1234"
  },
  "target_audience": "all",
  "recipient_count": 1250,
  "severity_level": "light",
  "alert_level": null,
  "tsunami_warning": false
}
```

## Indexes and Queries

### Required Indexes

#### Earthquakes Collection

```javascript
// Composite indexes for efficient queries

// 1. Time-based queries
{
  collection: 'earthquakes',
  fields: [
    { field: 'time', order: 'DESCENDING' },
    { field: 'magnitude', order: 'DESCENDING' }
  ]
}

// 2. Magnitude filtering
{
  collection: 'earthquakes',
  fields: [
    { field: 'magnitude', order: 'DESCENDING' },
    { field: 'time', order: 'DESCENDING' }
  ]
}

// 3. Geographic queries
{
  collection: 'earthquakes',
  fields: [
    { field: 'coordinates.latitude', order: 'ASCENDING' },
    { field: 'coordinates.longitude', order: 'ASCENDING' },
    { field: 'time', order: 'DESCENDING' }
  ]
}
```

#### Notifications Collection

```javascript
// Composite indexes for notifications

// 1. Time-based notification queries
{
  collection: 'notifications',
  fields: [
    { field: 'sent_at', order: 'DESCENDING' },
    { field: 'priority', order: 'DESCENDING' }
  ]
}

// 2. Earthquake-specific notifications
{
  collection: 'notifications',
  fields: [
    { field: 'earthquake_id', order: 'ASCENDING' },
    { field: 'sent_at', order: 'DESCENDING' }
  ]
}
```

## Common Queries

### Earthquakes Collection Queries

```typescript
// Get recent earthquakes (last 7 days)
const recentEarthquakes = await db
  .collection('earthquakes')
  .where('time', '>=', Date.now() - 7 * 24 * 60 * 60 * 1000)
  .orderBy('time', 'desc')
  .limit(50)
  .get();

// Get significant earthquakes (magnitude >= 4.0)
const significantEarthquakes = await db
  .collection('earthquakes')
  .where('magnitude', '>=', 4.0)
  .orderBy('magnitude', 'desc')
  .orderBy('time', 'desc')
  .get();

// Check if earthquake already exists
const existingEarthquake = await db.collection('earthquakes').doc(earthquakeId).get();

// Get earthquakes by severity level
const strongEarthquakes = await db
  .collection('earthquakes')
  .where('severity_level', '==', 'strong')
  .orderBy('time', 'desc')
  .get();
```

### Notifications Collection Queries

```typescript
// Get recent notifications
const recentNotifications = await db.collection('notifications').orderBy('sent_at', 'desc').limit(20).get();

// Get notifications for specific earthquake
const earthquakeNotifications = await db
  .collection('notifications')
  .where('earthquake_id', '==', earthquakeId)
  .orderBy('sent_at', 'desc')
  .get();

// Get high priority notifications
const criticalNotifications = await db
  .collection('notifications')
  .where('priority', 'in', ['critical', 'emergency'])
  .orderBy('sent_at', 'desc')
  .get();

// Get delivery statistics
const deliveryStats = await db
  .collection('notifications')
  .where('delivery_status', '==', 'delivered')
  .where('sent_at', '>=', startDate)
  .where('sent_at', '<=', endDate)
  .get();
```

## Data Validation Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Earthquakes collection - read-only for clients
    match /earthquakes/{earthquakeId} {
      allow read: if true; // Public earthquake data
      allow write: if false; // Only server can write
    }

    // Notifications collection - read-only for clients
    match /notifications/{notificationId} {
      allow read: if request.auth != null; // Authenticated users only
      allow write: if false; // Only server can write
    }

    // Admin access (for dashboard/management)
    match /{document=**} {
      allow read, write: if request.auth != null &&
        request.auth.token.admin == true;
    }
  }
}
```

## Data Lifecycle Management

### Automatic Cleanup

```typescript
// Clean up old earthquake data (older than 90 days)
const cleanupOldEarthquakes = async () => {
  const cutoffDate = Date.now() - 90 * 24 * 60 * 60 * 1000;

  const oldEarthquakes = await db.collection('earthquakes').where('time', '<', cutoffDate).get();

  const batch = db.batch();
  oldEarthquakes.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};

// Clean up old notifications (older than 30 days)
const cleanupOldNotifications = async () => {
  const cutoffDate = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const oldNotifications = await db.collection('notifications').where('sent_at', '<', cutoffDate).get();

  const batch = db.batch();
  oldNotifications.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};
```

## Backup and Recovery

### Backup Strategy

1. **Automatic Firestore Backups**: Enable daily backups
2. **Export to Cloud Storage**: Weekly exports for long-term storage
3. **Critical Data Replication**: Real-time sync to backup database

### Backup Configuration

```bash
# Enable automatic backups
gcloud firestore backups schedules create \
  --database="(default)" \
  --recurrence=daily \
  --retention=30d

# Export collections to Cloud Storage
gcloud firestore export gs://rescuenect-backups/firestore/$(date +%Y%m%d) \
  --collection-ids=earthquakes,notifications
```

## Performance Optimization

### Best Practices

1. **Use composite indexes** for complex queries
2. **Limit query results** to reasonable sizes
3. **Cache frequently accessed data** in application layer
4. **Use pagination** for large result sets
5. **Batch writes** for multiple operations
6. **Monitor query performance** using Firebase console

### Query Optimization Examples

```typescript
// Good: Use indexes and limits
db.collection('earthquakes').orderBy('time', 'desc').limit(10).get();

// Good: Specific field queries
db.collection('earthquakes').where('magnitude', '>=', 5.0).orderBy('magnitude', 'desc').limit(20).get();

// Avoid: Large result sets without limits
// db.collection('earthquakes').get(); // Bad

// Avoid: Complex queries without proper indexes
// db.collection('earthquakes')
//   .where('magnitude', '>=', 4.0)
//   .where('coordinates.latitude', '>', 13.0)
//   .orderBy('time', 'desc')
//   .get(); // Requires composite index
```
