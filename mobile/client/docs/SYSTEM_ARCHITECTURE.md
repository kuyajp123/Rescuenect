# RescueNect: Disaster Risk Management System Architecture

## System Overview

RescueNect is a comprehensive disaster risk management system designed for community resilience in Naic, Cavite. The system consists of two main applications: an Admin Web App for data management and control, and a Client Mobile App for community engagement and status reporting.

## Architecture Components

### 1. Admin Side (Web Application)
- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Purpose**: Central command center for disaster management

### 2. Client Side (Mobile Application)
- **Frontend**: React Native with Expo
- **Backend**: Node.js (shared with admin)
- **Purpose**: Community engagement and status reporting

### 3. Database Layer
- **MongoDB**: Non-real-time data storage
- **Firestore**: Real-time data synchronization

### 4. External APIs
- **Tomorrow.io**: Weather data
- **USGS/EMSC**: Earthquake data
- **Mapbox**: Interactive mapping
- **LocationIQ**: Geocoding services
- **Philippine Standard Geographic Code API**: Location services

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           RESCUENECT SYSTEM ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────────┘

                              EXTERNAL APIs
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ Tomorrow.io │  │ USGS/EMSC   │  │ Mapbox API  │  │ LocationIQ  │
    │  Weather    │  │ Earthquake  │  │   Mapping   │  │ Geocoding   │
    └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
           │                 │                 │                 │
           │                 │                 │                 │
           └─────────────────┼─────────────────┼─────────────────┘
                             │                 │
                             ▼                 ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                         ADMIN WEB APP                                       │
    │  ┌─────────────┐                                        ┌─────────────┐    │
    │  │ React.js    │                                        │ Node.js     │    │
    │  │ Frontend    │◄──────────────────────────────────────►│ Backend     │    │
    │  │             │                                        │             │    │
    │  │ - Dashboard │                                        │ - API Mgmt  │    │
    │  │ - Alerts    │                                        │ - Data Proc │    │
    │  │ - Map View  │                                        │ - Auth      │    │
    │  └─────────────┘                                        └─────────────┘    │
    └─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                        DATABASE LAYER                                       │
    │                                                                             │
    │  ┌─────────────────────────┐            ┌─────────────────────────┐         │
    │  │      FIRESTORE          │            │       MONGODB           │         │
    │  │   (Real-time Data)      │            │   (Non-real-time Data)  │         │
    │  │                         │            │                         │         │
    │  │ - Weather Alerts        │            │ - User Profiles         │         │
    │  │ - Earthquake Data       │            │ - Status History        │         │
    │  │ - Live Announcements    │            │ - System Settings       │         │
    │  │ - Status Reports        │            │ - Analytics Data        │         │
    │  └─────────────────────────┘            └─────────────────────────┘         │
    └─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                       CLIENT MOBILE APP                                     │
    │  ┌─────────────┐                                        ┌─────────────┐    │
    │  │ React Native│                                        │ Node.js     │    │
    │  │ + Expo      │◄──────────────────────────────────────►│ Backend     │    │
    │  │             │                                        │ (Shared)    │    │
    │  │ - Weather   │                                        │             │    │
    │  │ - Alerts    │                                        │ - Data Sync │    │
    │  │ - Status    │                                        │ - Auth      │    │
    │  │ - Map View  │                                        │ - Offline   │    │
    │  └─────────────┘                                        └─────────────┘    │
    └─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### 1. Weather Data Flow
```
Tomorrow.io API → Admin Backend → Database Storage → Client App
```

**Process:**
1. Admin backend fetches weather data from Tomorrow.io (scheduled)
2. Data is processed and stored in both MongoDB and Firestore
3. Client app reads weather data from database only
4. Real-time weather alerts pushed via Firestore

### 2. Earthquake Data Flow
```
USGS/EMSC API → Admin Backend → Firestore → Client Notifications
```

**Process:**
1. Admin backend monitors earthquake APIs
2. Filters earthquakes near Naic, Cavite
3. Stores relevant data in Firestore
4. Triggers real-time notifications to clients

### 3. Status Reporting Flow
```
Client App → Mapbox (Pin Drop) → LocationIQ (Geocoding) → Database → Admin Dashboard
```

**Process:**
1. User drops pin on Mapbox in client app
2. LocationIQ converts coordinates to readable address
3. Status data stored in MongoDB (persistent) and Firestore (real-time)
4. Admin sees real-time updates on dashboard map

## Component Interactions

### Admin Application Components
- **Dashboard**: Overview of system status and alerts
- **Weather Management**: Tomorrow.io integration and data processing
- **Earthquake Monitoring**: USGS/EMSC integration and filtering
- **Alert System**: Real-time notification management
- **Map Viewer**: Mapbox integration for status visualization
- **User Management**: Admin controls and permissions

### Client Application Components
- **Weather Display**: Real-time weather information
- **Alert Center**: Earthquake and weather notifications
- **Status Reporter**: Interactive map for status submission
- **Community Feed**: Status reports from other users
- **Profile Management**: User settings and preferences

### Database Schema Design

#### MongoDB Collections
```javascript
// Users Collection
{
  _id: ObjectId,
  email: String,
  profile: {
    firstName: String,
    lastName: String,
    address: {
      municipality: String,
      barangay: String,
      coordinates: { lat: Number, lng: Number }
    }
  },
  settings: {
    notifications: Boolean,
    darkMode: Boolean,
    fontSize: String
  },
  createdAt: Date,
  updatedAt: Date
}

// Status Reports Collection
{
  _id: ObjectId,
  userId: ObjectId,
  status: String, // 'safe', 'evacuated', 'affected', 'missing'
  location: {
    coordinates: { lat: Number, lng: Number },
    address: String,
    municipality: String,
    barangay: String
  },
  description: String,
  contactInfo: String,
  numberOfPeople: Number,
  images: [String],
  createdAt: Date,
  isActive: Boolean
}

// Weather History Collection
{
  _id: ObjectId,
  location: String,
  data: {
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    // ... other weather fields
  },
  timestamp: Date,
  source: String
}
```

#### Firestore Collections
```javascript
// Real-time Alerts
/alerts/{alertId}
{
  type: 'weather' | 'earthquake' | 'announcement',
  title: String,
  message: String,
  severity: 'low' | 'medium' | 'high' | 'critical',
  location: String,
  timestamp: Timestamp,
  isActive: Boolean
}

// Live Status Reports
/liveStatus/{statusId}
{
  userId: String,
  status: String,
  location: GeoPoint,
  timestamp: Timestamp,
  isActive: Boolean
}

// System Announcements
/announcements/{announcementId}
{
  title: String,
  content: String,
  priority: Number,
  targetAudience: String,
  createdBy: String,
  timestamp: Timestamp,
  isActive: Boolean
}
```

## API Integration Strategies

### 1. Tomorrow.io Weather API
**Rate Limiting Strategy:**
- Admin-only integration to preserve free tier limits
- Scheduled data fetching every 15 minutes
- Data caching in database for client consumption
- Batch processing for multiple locations

**Implementation:**
```javascript
// Weather Service (Admin Backend)
class WeatherService {
  async fetchWeatherData() {
    const response = await fetch(`${TOMORROW_IO_API}/weather`, {
      headers: { 'apikey': API_KEY }
    });
    
    const data = await response.json();
    await this.processAndStore(data);
  }
  
  async processAndStore(weatherData) {
    // Process weather data
    const processedData = this.analyzeWeatherRisk(weatherData);
    
    // Store in MongoDB for history
    await WeatherHistory.create(processedData);
    
    // Store in Firestore for real-time updates
    if (processedData.alertLevel > 2) {
      await firestore.collection('alerts').add({
        type: 'weather',
        data: processedData,
        timestamp: new Date()
      });
    }
  }
}
```

### 2. Earthquake API Integration
**Dual API Strategy:**
- Primary: USGS Earthquake API
- Fallback: EMSC Earthquake API
- Geographic filtering for Naic, Cavite area

**Implementation:**
```javascript
// Earthquake Service (Admin Backend)
class EarthquakeService {
  async monitorEarthquakes() {
    try {
      const data = await this.fetchFromUSGS();
      await this.processEarthquakeData(data);
    } catch (error) {
      console.log('USGS failed, trying EMSC...');
      const fallbackData = await this.fetchFromEMSC();
      await this.processEarthquakeData(fallbackData);
    }
  }
  
  async processEarthquakeData(earthquakeData) {
    const relevantQuakes = this.filterByLocation(earthquakeData, {
      lat: 14.3169, // Naic, Cavite coordinates
      lng: 120.7598,
      radius: 50 // km
    });
    
    if (relevantQuakes.length > 0) {
      await this.sendEarthquakeAlert(relevantQuakes);
    }
  }
}
```

### 3. Mapbox Integration
**Dual-Purpose Usage:**
- Client: Status reporting with pin dropping
- Admin: Viewing status reports on map

**Implementation:**
```javascript
// Map Service (Shared)
class MapService {
  // Client-side status reporting
  async createStatusReport(coordinates, statusData) {
    const address = await this.geocodeWithLocationIQ(coordinates);
    
    const statusReport = {
      ...statusData,
      location: {
        coordinates,
        address
      },
      timestamp: new Date()
    };
    
    // Store in MongoDB for persistence
    await StatusReport.create(statusReport);
    
    // Store in Firestore for real-time updates
    await firestore.collection('liveStatus').add({
      ...statusReport,
      location: new GeoPoint(coordinates.lat, coordinates.lng)
    });
  }
  
  // Admin-side map viewer
  async getStatusReports() {
    const liveReports = await firestore
      .collection('liveStatus')
      .where('isActive', '==', true)
      .orderBy('timestamp', 'desc')
      .get();
    
    return liveReports.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}
```

## Security and Performance Considerations

### 1. API Key Management
- Environment variables for all API keys
- Separate keys for development and production
- Rate limiting middleware for internal APIs
- API key rotation strategy

### 2. Data Synchronization
- Offline-first approach for mobile app
- Conflict resolution for concurrent updates
- Data validation and sanitization
- Batch operations for efficiency

### 3. Real-time Updates
- Firestore listeners for critical updates
- WebSocket connections for admin dashboard
- Push notifications for mobile alerts
- Optimistic updates for better UX

## Deployment Architecture

### Production Environment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Web     │    │   Node.js API   │    │   Databases     │
│   (Vercel)      │◄──►│   (Railway)     │◄──►│   (Cloud)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Mobile App     │
                    │  (Expo/App      │
                    │   Stores)       │
                    └─────────────────┘
```

### Development Environment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local Web     │    │   Local API     │    │   Local DBs     │
│   (React Dev)   │◄──►│   (Node.js)     │◄──►│   (Docker)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Expo Dev       │
                    │  (Metro)        │
                    └─────────────────┘
```

## Technology Stack Summary

### Frontend Technologies
- **Admin**: React.js, Material-UI, Mapbox GL JS
- **Client**: React Native, Expo, React Navigation, Mapbox SDK

### Backend Technologies
- **API Server**: Node.js, Express.js, Socket.io
- **Authentication**: JWT, Firebase Auth
- **File Storage**: Firebase Storage
- **Caching**: Redis

### Database Technologies
- **Real-time**: Firestore (NoSQL)
- **Persistent**: MongoDB with Mongoose ODM
- **Caching**: Redis for session management

### External Services
- **Weather**: Tomorrow.io API
- **Earthquake**: USGS + EMSC APIs
- **Mapping**: Mapbox API
- **Geocoding**: LocationIQ API
- **Location**: Philippine Standard Geographic Code API

## Implementation Timeline

### Phase 1: Core Infrastructure (Weeks 1-2)
- Database setup and schema design
- Basic API server with authentication
- Admin dashboard framework
- Mobile app navigation structure

### Phase 2: Data Integration (Weeks 3-4)
- Weather API integration
- Earthquake monitoring system
- Basic alert system
- Database synchronization

### Phase 3: User Features (Weeks 5-6)
- Status reporting system
- Interactive maps
- Real-time notifications
- Community features

### Phase 4: Testing and Optimization (Weeks 7-8)
- Performance optimization
- Security testing
- User acceptance testing
- Deployment preparation

This architecture provides a robust foundation for your RescueNect disaster management system, ensuring scalability, reliability, and efficient resource utilization while maintaining the free tier limitations of external APIs.
