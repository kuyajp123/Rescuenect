# Database Schema Design - RescueNect System

## Overview

RescueNect uses a dual-database architecture to optimize for both real-time updates and persistent data storage:

- **Firestore**: Real-time data synchronization and live updates
- **MongoDB**: Persistent data storage and complex querying

## Database Architecture Strategy

### Firestore (Real-time Database)
- **Purpose**: Real-time synchronization, live updates, push notifications
- **Characteristics**: Document-based, real-time listeners, offline support
- **Use Cases**: Live alerts, status updates, announcements, real-time chat

### MongoDB (Primary Database)
- **Purpose**: Persistent data storage, complex queries, historical data
- **Characteristics**: Document-based, rich querying, aggregation framework
- **Use Cases**: User profiles, status history, analytics, system configurations

## Firestore Schema Design

### 1. Alerts Collection
```javascript
// Collection: alerts
// Document ID: Auto-generated
{
  id: "alert_12345",
  type: "weather" | "earthquake" | "announcement" | "emergency",
  title: "Heavy Rain Warning",
  message: "Heavy rainfall expected in Naic, Cavite. Please prepare for possible flooding.",
  severity: "low" | "medium" | "high" | "critical",
  location: {
    municipality: "Naic",
    province: "Cavite",
    region: "CALABARZON",
    coordinates: {
      lat: 14.3169,
      lng: 120.7598
    }
  },
  data: {
    // Weather alert data
    temperature: 28.5,
    humidity: 85,
    windSpeed: 45,
    rainIntensity: 12.5,
    // Or earthquake data
    magnitude: 5.2,
    depth: 10,
    distance: 25
  },
  targetAudience: "all" | "naic_residents" | "admin_only",
  createdBy: "system" | "admin_user_id",
  timestamp: "2024-01-15T08:30:00Z",
  expiresAt: "2024-01-15T20:30:00Z",
  isActive: true,
  readBy: ["user_id_1", "user_id_2"], // Track who read the alert
  metadata: {
    source: "tomorrow.io" | "usgs" | "manual",
    version: 1,
    tags: ["weather", "flooding", "preparation"]
  }
}
```

### 2. Live Status Reports Collection
```javascript
// Collection: liveStatus
// Document ID: Auto-generated
{
  id: "status_12345",
  userId: "user_abc123",
  userInfo: {
    firstName: "Juan",
    lastName: "Dela Cruz",
    avatar: "https://example.com/avatar.jpg"
  },
  status: "safe" | "evacuated" | "affected" | "missing",
  location: {
    coordinates: {
      lat: 14.3169,
      lng: 120.7598
    },
    address: "Barangay Poblacion, Naic, Cavite",
    barangay: "Poblacion",
    municipality: "Naic",
    province: "Cavite"
  },
  description: "We are safe but our house is partially flooded.",
  contactInfo: "+63 912 345 6789",
  numberOfPeople: 4,
  needsHelp: true,
  helpType: ["food", "water", "shelter", "medical"],
  images: ["https://example.com/image1.jpg"],
  timestamp: "2024-01-15T09:15:00Z",
  lastUpdated: "2024-01-15T09:30:00Z",
  isActive: true,
  isVerified: false,
  verifiedBy: null,
  priority: "normal" | "high" | "urgent",
  metadata: {
    source: "mobile_app",
    version: 1,
    reportMethod: "map_pin" | "gps" | "manual"
  }
}
```

### 3. Announcements Collection
```javascript
// Collection: announcements
// Document ID: Auto-generated
{
  id: "announcement_12345",
  title: "Evacuation Center Update",
  content: "New evacuation center opened at Naic Elementary School. Capacity: 200 families.",
  type: "info" | "warning" | "update" | "emergency",
  priority: 1, // 1 = highest, 5 = lowest
  targetAudience: {
    userType: "all" | "residents" | "officials",
    location: {
      municipality: "Naic",
      barangays: ["Poblacion", "Bucana"]
    }
  },
  author: {
    userId: "admin_12345",
    name: "Emergency Operations Center",
    role: "admin"
  },
  media: {
    images: ["https://example.com/evacuation.jpg"],
    videos: [],
    documents: ["https://example.com/evacuation_guide.pdf"]
  },
  timestamp: "2024-01-15T10:00:00Z",
  expiresAt: "2024-01-20T10:00:00Z",
  isActive: true,
  isPinned: false,
  readBy: ["user_id_1", "user_id_2"],
  reactions: {
    helpful: 15,
    important: 8,
    thanks: 22
  },
  metadata: {
    version: 1,
    language: "en",
    tags: ["evacuation", "shelter", "emergency"]
  }
}
```

### 4. Real-time Chat Collection
```javascript
// Collection: emergencyChat
// Document ID: Auto-generated
{
  id: "chat_12345",
  roomId: "emergency_room_1",
  senderId: "user_abc123",
  senderInfo: {
    name: "Juan Dela Cruz",
    avatar: "https://example.com/avatar.jpg",
    role: "resident" | "responder" | "admin"
  },
  message: "Need medical assistance at Barangay Poblacion",
  type: "text" | "image" | "location" | "emergency",
  attachments: [],
  location: {
    lat: 14.3169,
    lng: 120.7598,
    address: "Barangay Poblacion, Naic, Cavite"
  },
  timestamp: "2024-01-15T11:00:00Z",
  isEmergency: true,
  priority: "high",
  status: "new" | "acknowledged" | "responding" | "resolved",
  assignedTo: "responder_id_123",
  metadata: {
    version: 1,
    edited: false,
    editedAt: null
  }
}
```

## MongoDB Schema Design

### 1. Users Collection
```javascript
// Collection: users
{
  _id: ObjectId("64a1b2c3d4e5f6789012345"),
  email: "juan.delacruz@email.com",
  password: "$2b$12$...", // Hashed password
  emailVerified: true,
  profile: {
    firstName: "Juan",
    lastName: "Dela Cruz",
    middleName: "Santos",
    birthDate: "1990-01-15",
    gender: "male",
    phoneNumber: "+63 912 345 6789",
    avatar: "https://example.com/avatar.jpg",
    address: {
      houseNumber: "123",
      street: "Rizal Street",
      barangay: "Poblacion",
      municipality: "Naic",
      province: "Cavite",
      region: "CALABARZON",
      zipCode: "4110",
      coordinates: {
        lat: 14.3169,
        lng: 120.7598
      }
    },
    emergencyContact: {
      name: "Maria Dela Cruz",
      relationship: "wife",
      phoneNumber: "+63 912 345 6780"
    }
  },
  preferences: {
    notifications: {
      weather: true,
      earthquake: true,
      announcements: true,
      statusUpdates: true,
      pushNotifications: true,
      emailNotifications: false
    },
    language: "en",
    theme: "light" | "dark" | "system",
    fontSize: "small" | "medium" | "large",
    highContrast: false,
    mapType: "standard" | "satellite" | "hybrid"
  },
  deviceInfo: {
    fcmToken: "device_token_123",
    platform: "android" | "ios",
    appVersion: "1.0.0",
    lastSeenAt: "2024-01-15T12:00:00Z"
  },
  role: "resident" | "responder" | "admin" | "super_admin",
  permissions: ["read_alerts", "create_status", "join_chat"],
  status: "active" | "inactive" | "suspended",
  verificationStatus: {
    identity: "verified" | "pending" | "rejected",
    location: "verified" | "pending" | "rejected",
    documents: ["valid_id.jpg", "proof_of_residence.pdf"]
  },
  statistics: {
    statusReportsCreated: 5,
    alertsReceived: 23,
    helpRequestsReceived: 2,
    helpRequestsProvided: 1,
    lastActiveAt: "2024-01-15T11:30:00Z"
  },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
  deletedAt: null
}
```

### 2. Status Reports Collection
```javascript
// Collection: statusReports
{
  _id: ObjectId("64a1b2c3d4e5f6789012346"),
  userId: ObjectId("64a1b2c3d4e5f6789012345"),
  reportId: "status_12345", // Reference to Firestore document
  status: "safe" | "evacuated" | "affected" | "missing",
  location: {
    coordinates: {
      lat: 14.3169,
      lng: 120.7598
    },
    address: "Barangay Poblacion, Naic, Cavite",
    barangay: "Poblacion",
    municipality: "Naic",
    province: "Cavite",
    region: "CALABARZON",
    accuracy: 10.5 // GPS accuracy in meters
  },
  description: "We are safe but our house is partially flooded.",
  contactInfo: "+63 912 345 6789",
  numberOfPeople: 4,
  peopleDetails: [
    {
      name: "Juan Dela Cruz",
      age: 34,
      gender: "male",
      healthStatus: "good",
      specialNeeds: null
    },
    {
      name: "Maria Dela Cruz",
      age: 32,
      gender: "female",
      healthStatus: "good",
      specialNeeds: null
    }
  ],
  needsHelp: true,
  helpType: ["food", "water", "shelter", "medical"],
  urgencyLevel: "medium" | "high" | "critical",
  images: [
    {
      url: "https://example.com/image1.jpg",
      caption: "Flood level in our area",
      uploadedAt: "2024-01-15T09:20:00Z"
    }
  ],
  updates: [
    {
      timestamp: "2024-01-15T09:30:00Z",
      update: "Water level is rising",
      updatedBy: ObjectId("64a1b2c3d4e5f6789012345")
    }
  ],
  responses: [
    {
      responderId: ObjectId("64a1b2c3d4e5f6789012347"),
      responderInfo: {
        name: "Barangay Captain",
        role: "barangay_official"
      },
      message: "Help is on the way. Please stay safe.",
      timestamp: "2024-01-15T09:45:00Z",
      actionTaken: "dispatched_rescue_team"
    }
  ],
  verification: {
    isVerified: true,
    verifiedBy: ObjectId("64a1b2c3d4e5f6789012348"),
    verifiedAt: "2024-01-15T10:00:00Z",
    verificationMethod: "field_visit" | "video_call" | "photo_verification"
  },
  resolution: {
    isResolved: false,
    resolvedAt: null,
    resolvedBy: null,
    resolutionNotes: null
  },
  metadata: {
    source: "mobile_app",
    version: 1,
    reportMethod: "map_pin" | "gps" | "manual",
    weather: {
      temperature: 28.5,
      humidity: 85,
      windSpeed: 15,
      conditions: "rainy"
    }
  },
  createdAt: "2024-01-15T09:15:00Z",
  updatedAt: "2024-01-15T09:30:00Z",
  isActive: true,
  expiresAt: "2024-01-20T09:15:00Z" // Auto-expire after 5 days
}
```

### 3. Weather History Collection
```javascript
// Collection: weatherHistory
{
  _id: ObjectId("64a1b2c3d4e5f6789012347"),
  location: {
    name: "Naic, Cavite",
    coordinates: {
      lat: 14.3169,
      lng: 120.7598
    },
    municipality: "Naic",
    province: "Cavite"
  },
  data: {
    temperature: 28.5,
    temperatureApparent: 32.1,
    humidity: 85,
    windSpeed: 15.2,
    windGust: 25.8,
    windDirection: 180,
    precipitationProbability: 80,
    rainAccumulation: 12.5,
    rainIntensity: 8.2,
    uvIndex: 3,
    cloudCover: 90,
    visibility: 5.2,
    weatherCode: 1001 // Cloudy
  },
  alerts: [
    {
      type: "heavy_rain",
      severity: "medium",
      message: "Heavy rain expected",
      startTime: "2024-01-15T08:00:00Z",
      endTime: "2024-01-15T18:00:00Z"
    }
  ],
  forecast: {
    next6Hours: {
      temperature: 26.2,
      precipitationProbability: 90,
      rainIntensity: 15.5
    },
    next12Hours: {
      temperature: 24.8,
      precipitationProbability: 70,
      rainIntensity: 8.2
    },
    next24Hours: {
      temperature: 27.1,
      precipitationProbability: 40,
      rainIntensity: 2.1
    }
  },
  source: "tomorrow.io",
  timestamp: "2024-01-15T08:30:00Z",
  processedAt: "2024-01-15T08:31:00Z",
  metadata: {
    version: 1,
    apiVersion: "v4",
    processingTime: 1.2 // seconds
  }
}
```

### 4. Earthquake History Collection
```javascript
// Collection: earthquakeHistory
{
  _id: ObjectId("64a1b2c3d4e5f6789012348"),
  eventId: "us2024abcd",
  magnitude: 5.2,
  depth: 10.5,
  location: {
    coordinates: {
      lat: 14.2500,
      lng: 120.8000
    },
    description: "15km SW of Naic, Cavite",
    region: "Luzon",
    country: "Philippines"
  },
  distance: 25.8, // Distance from Naic in km
  time: "2024-01-15T07:45:32Z",
  impact: {
    intensity: "IV", // MMI Scale
    shaking: "Light",
    damage: "None to Very Light",
    casualties: 0
  },
  alerts: [
    {
      severity: "medium",
      message: "Earthquake detected near Naic, Cavite",
      sentAt: "2024-01-15T07:46:00Z",
      recipients: 1250
    }
  ],
  aftershocks: [
    {
      time: "2024-01-15T08:15:22Z",
      magnitude: 3.1,
      depth: 8.2
    }
  ],
  source: "USGS",
  processed: {
    at: "2024-01-15T07:46:00Z",
    by: "earthquake_monitoring_service",
    version: 1
  },
  metadata: {
    originalData: {
      // Original API response stored for debugging
    },
    tsunami: {
      warning: false,
      advisory: false
    }
  }
}
```

### 5. System Configurations Collection
```javascript
// Collection: systemConfigurations
{
  _id: ObjectId("64a1b2c3d4e5f6789012349"),
  category: "api_settings",
  key: "weather_monitoring",
  value: {
    enabled: true,
    interval: 900000, // 15 minutes in milliseconds
    alertThresholds: {
      temperature: {
        high: 35,
        low: 15
      },
      windSpeed: {
        high: 25,
        critical: 50
      },
      rainIntensity: {
        medium: 5,
        high: 10,
        critical: 20
      }
    }
  },
  description: "Weather monitoring system configuration",
  updatedBy: ObjectId("64a1b2c3d4e5f6789012345"),
  updatedAt: "2024-01-15T12:00:00Z",
  isActive: true,
  version: 2,
  history: [
    {
      version: 1,
      changes: ["Updated rain intensity thresholds"],
      updatedBy: ObjectId("64a1b2c3d4e5f6789012345"),
      updatedAt: "2024-01-10T10:00:00Z"
    }
  ]
}
```

## Database Relationships

### User-Status Relationship
```javascript
// One-to-Many: User can have multiple status reports
User._id -> StatusReport.userId
```

### Status-Response Relationship
```javascript
// One-to-Many: Status report can have multiple responses
StatusReport._id -> StatusResponse.statusReportId
```

### Cross-Database References
```javascript
// MongoDB StatusReport references Firestore LiveStatus
StatusReport.reportId -> Firestore.liveStatus.id
```

## Database Indexes

### MongoDB Indexes
```javascript
// Users Collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ "profile.phoneNumber": 1 })
db.users.createIndex({ role: 1, status: 1 })
db.users.createIndex({ "profile.address.municipality": 1 })

// Status Reports Collection
db.statusReports.createIndex({ userId: 1, createdAt: -1 })
db.statusReports.createIndex({ status: 1, isActive: 1 })
db.statusReports.createIndex({ "location.coordinates": "2dsphere" })
db.statusReports.createIndex({ createdAt: -1 })
db.statusReports.createIndex({ needsHelp: 1, urgencyLevel: 1 })

// Weather History Collection
db.weatherHistory.createIndex({ timestamp: -1 })
db.weatherHistory.createIndex({ "location.coordinates": "2dsphere" })
db.weatherHistory.createIndex({ "location.municipality": 1, timestamp: -1 })

// Earthquake History Collection
db.earthquakeHistory.createIndex({ time: -1 })
db.earthquakeHistory.createIndex({ magnitude: -1 })
db.earthquakeHistory.createIndex({ "location.coordinates": "2dsphere" })
```

### Firestore Indexes
```javascript
// Alerts Collection
- type, timestamp (desc)
- severity, isActive, timestamp (desc)
- location.municipality, isActive, timestamp (desc)

// Live Status Collection
- userId, timestamp (desc)
- status, isActive, timestamp (desc)
- location (geo), isActive

// Announcements Collection
- priority, isActive, timestamp (desc)
- targetAudience.location.municipality, isActive, timestamp (desc)
```

## Data Validation Rules

### User Data Validation
```javascript
const userSchema = {
  email: {
    required: true,
    type: 'email',
    unique: true
  },
  profile: {
    firstName: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 50
    },
    phoneNumber: {
      required: true,
      type: 'string',
      pattern: /^\+63\s?[0-9]{3}\s?[0-9]{3}\s?[0-9]{4}$/
    },
    address: {
      municipality: {
        required: true,
        enum: ['Naic'] // Restrict to Naic only
      },
      coordinates: {
        required: true,
        type: 'object',
        properties: {
          lat: { type: 'number', min: -90, max: 90 },
          lng: { type: 'number', min: -180, max: 180 }
        }
      }
    }
  }
}
```

### Status Report Validation
```javascript
const statusReportSchema = {
  status: {
    required: true,
    enum: ['safe', 'evacuated', 'affected', 'missing']
  },
  location: {
    required: true,
    type: 'object',
    properties: {
      coordinates: {
        required: true,
        type: 'object',
        properties: {
          lat: { type: 'number', min: 14.0, max: 15.0 }, // Cavite bounds
          lng: { type: 'number', min: 120.0, max: 121.0 }
        }
      }
    }
  },
  numberOfPeople: {
    required: true,
    type: 'number',
    min: 1,
    max: 100
  }
}
```

## Performance Optimization

### Database Query Optimization
```javascript
// Efficient pagination for status reports
const getStatusReports = async (page = 1, limit = 20) => {
  return await StatusReport.find({ isActive: true })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'profile.firstName profile.lastName')
    .lean(); // Return plain objects for better performance
}

// Geospatial queries for nearby status reports
const getNearbyStatusReports = async (lat, lng, radiusKm = 5) => {
  return await StatusReport.find({
    isActive: true,
    'location.coordinates': {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000 // Convert km to meters
      }
    }
  }).limit(50);
}
```

### Caching Strategy
```javascript
// Redis caching for frequently accessed data
const cacheKeys = {
  WEATHER_DATA: 'weather:latest',
  ACTIVE_ALERTS: 'alerts:active',
  USER_PROFILE: 'user:profile:',
  STATUS_REPORTS: 'status:recent'
}

const cacheExpiry = {
  WEATHER_DATA: 900, // 15 minutes
  ACTIVE_ALERTS: 300, // 5 minutes
  USER_PROFILE: 3600, // 1 hour
  STATUS_REPORTS: 600 // 10 minutes
}
```

This comprehensive database schema provides a robust foundation for the RescueNect system, ensuring data integrity, performance, and scalability while supporting both real-time and persistent data requirements.
