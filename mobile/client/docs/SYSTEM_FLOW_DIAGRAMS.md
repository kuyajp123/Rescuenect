# RescueNect System Flow Diagrams

## Overview
This document contains visual representations of the RescueNect system flows, including data movement, user interactions, and system processes.

## 1. Overall System Architecture Flow

```mermaid
graph TB
    subgraph "External APIs"
        A[Tomorrow.io Weather API]
        B[USGS Earthquake API]
        C[EMSC Earthquake API]
        D[Mapbox API]
        E[LocationIQ API]
        F[Philippine Geographic API]
    end

    subgraph "Admin System"
        G[React.js Admin Dashboard]
        H[Node.js API Server]
        I[Background Jobs]
    end

    subgraph "Database Layer"
        J[(MongoDB)]
        K[(Firestore)]
    end

    subgraph "Client System"
        L[React Native Mobile App]
        M[Expo Runtime]
    end

    subgraph "Services"
        N[Push Notifications]
        O[Authentication]
        P[File Storage]
    end

    A --> H
    B --> H
    C --> H
    D --> H
    D --> L
    E --> H
    F --> H
    F --> L

    G <--> H
    H <--> I
    H <--> J
    H <--> K
    H <--> N
    H <--> O
    H <--> P

    L <--> H
    L <--> K
    L <--> M
    L <--> N
    L <--> O

    style A fill:#e1f5fe
    style B fill:#e1f5fe
    style C fill:#e1f5fe
    style D fill:#e1f5fe
    style E fill:#e1f5fe
    style F fill:#e1f5fe
    style G fill:#e8f5e8
    style H fill:#fff3e0
    style I fill:#fff3e0
    style J fill:#f3e5f5
    style K fill:#f3e5f5
    style L fill:#e8f5e8
    style M fill:#e8f5e8
```

## 2. Weather Data Flow

```mermaid
sequenceDiagram
    participant T as Tomorrow.io API
    participant A as Admin Backend
    participant M as MongoDB
    participant F as Firestore
    participant C as Client App
    participant U as User

    Note over A: Scheduled Job (15 min intervals)
    A->>T: Fetch Weather Data
    T-->>A: Weather Response
    A->>A: Process & Analyze Data
    A->>M: Store Historical Data
    
    alt Weather Alert Detected
        A->>F: Store Real-time Alert
        F-->>C: Real-time Update
        C->>U: Push Notification
    end

    U->>C: Open Weather Screen
    C->>A: Request Latest Weather
    A->>M: Query Weather Data
    M-->>A: Weather History
    A-->>C: Weather Data
    C->>U: Display Weather Info
```

## 3. Earthquake Monitoring Flow

```mermaid
flowchart TD
    A[Earthquake Monitoring Service] --> B{Try USGS API}
    B -->|Success| C[Process USGS Data]
    B -->|Fail| D[Try EMSC API]
    D -->|Success| E[Process EMSC Data]
    D -->|Fail| F[Log Error & Retry Later]
    
    C --> G[Filter by Location]
    E --> G
    G --> H{Earthquake Near Naic?}
    H -->|Yes| I[Analyze Magnitude]
    H -->|No| J[Discard Event]
    
    I --> K{Magnitude >= 4.0?}
    K -->|Yes| L[Store in MongoDB]
    K -->|No| M[Store for Analysis Only]
    
    L --> N[Create Firestore Alert]
    N --> O[Send Push Notification]
    O --> P[Update Admin Dashboard]
    
    style A fill:#ff9800
    style B fill:#2196f3
    style D fill:#2196f3
    style G fill:#4caf50
    style H fill:#ff5722
    style I fill:#9c27b0
    style K fill:#ff5722
    style L fill:#795548
    style N fill:#f44336
    style O fill:#e91e63
    style P fill:#607d8b
```

## 4. Status Reporting Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client App
    participant M as Mapbox
    participant L as LocationIQ
    participant A as Admin API
    participant DB as MongoDB
    participant F as Firestore
    participant AD as Admin Dashboard

    U->>C: Open Status Report
    C->>M: Load Map
    M-->>C: Display Map
    
    U->>C: Drop Pin on Map
    C->>L: Reverse Geocode Coordinates
    L-->>C: Return Address
    
    U->>C: Fill Status Form
    U->>C: Submit Status Report
    
    C->>A: POST Status Report
    A->>DB: Store Persistent Data
    A->>F: Store Real-time Data
    
    F-->>AD: Real-time Update
    F-->>C: Broadcast to Other Users
    
    AD->>AD: Update Map Markers
    C->>C: Update Community Feed
```

## 5. User Registration Flow

```mermaid
flowchart TD
    A[User Opens Registration] --> B[Load Philippine Geographic Data]
    B --> C[Display Location Dropdowns]
    C --> D[User Selects Region]
    D --> E[Load Provinces for Region]
    E --> F[User Selects Province]
    F --> G[Load Cities for Province]
    G --> H[User Selects City]
    H --> I[Load Barangays for City]
    I --> J[User Selects Barangay]
    J --> K[Fill Other Details]
    K --> L[Submit Registration]
    
    L --> M{Validation}
    M -->|Valid| N[Create User Account]
    M -->|Invalid| O[Show Errors]
    
    N --> P[Store in MongoDB]
    P --> Q[Send Welcome Email]
    Q --> R[Auto Login]
    
    O --> K
    
    style A fill:#4caf50
    style B fill:#2196f3
    style L fill:#ff9800
    style M fill:#ff5722
    style N fill:#9c27b0
    style P fill:#795548
    style Q fill:#607d8b
    style R fill:#4caf50
```

## 6. Admin Dashboard Data Flow

```mermaid
graph LR
    subgraph "Real-time Data Sources"
        A[Firestore Alerts]
        B[Firestore Status Reports]
        C[Firestore Announcements]
    end

    subgraph "Historical Data Sources"
        D[MongoDB Weather History]
        E[MongoDB Earthquake History]
        F[MongoDB User Data]
        G[MongoDB Status History]
    end

    subgraph "Admin Dashboard Components"
        H[Alert Management]
        I[Status Map Viewer]
        J[Analytics Dashboard]
        K[User Management]
        L[System Configuration]
    end

    A --> H
    B --> I
    C --> H
    D --> J
    E --> J
    F --> K
    G --> J

    H --> M[Send Notifications]
    I --> N[Update Map Markers]
    J --> O[Generate Reports]
    K --> P[User Operations]
    L --> Q[System Updates]

    style A fill:#f44336
    style B fill:#ff9800
    style C fill:#2196f3
    style D fill:#4caf50
    style E fill:#9c27b0
    style F fill:#795548
    style G fill:#607d8b
```

## 7. Mobile App State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Authenticated: Login Success
    Loading --> Unauthenticated: No Auth Token
    
    Unauthenticated --> Loading: Login Attempt
    Authenticated --> Dashboard: Load Home
    
    Dashboard --> WeatherView: View Weather
    Dashboard --> StatusReport: Create Status
    Dashboard --> CommunityFeed: View Community
    Dashboard --> AlertCenter: View Alerts
    
    WeatherView --> Dashboard: Back
    StatusReport --> MapSelect: Select Location
    MapSelect --> StatusForm: Location Selected
    StatusForm --> StatusSubmit: Form Complete
    StatusSubmit --> Dashboard: Submit Success
    
    CommunityFeed --> Dashboard: Back
    AlertCenter --> Dashboard: Back
    
    state Dashboard {
        [*] --> DataSync
        DataSync --> DataReady: Sync Complete
        DataReady --> [*]
    }
    
    state StatusReport {
        [*] --> MapLoading
        MapLoading --> MapReady: Map Loaded
        MapReady --> LocationSelected: Pin Dropped
        LocationSelected --> FormReady: Address Retrieved
    }
```

## 8. API Rate Limiting Flow

```mermaid
flowchart TD
    A[API Request] --> B{Check Rate Limit}
    B -->|Within Limit| C[Process Request]
    B -->|Exceeded Limit| D[Return 429 Error]
    
    C --> E[Increment Counter]
    E --> F[Store in Redis]
    F --> G[Execute API Call]
    
    G --> H{API Success?}
    H -->|Success| I[Return Data]
    H -->|Error| J[Handle API Error]
    
    I --> K[Update Cache]
    K --> L[Return to Client]
    
    J --> M{Retry Allowed?}
    M -->|Yes| N[Queue for Retry]
    M -->|No| O[Return Error]
    
    N --> P[Wait & Retry]
    P --> G
    
    D --> Q[Log Rate Limit Hit]
    Q --> R[Queue Request]
    R --> S[Process When Limit Resets]
    
    style A fill:#4caf50
    style B fill:#ff9800
    style C fill:#2196f3
    style D fill:#f44336
    style G fill:#9c27b0
    style I fill:#4caf50
    style J fill:#ff5722
    style Q fill:#795548
```

## 9. Push Notification Flow

```mermaid
sequenceDiagram
    participant AS as Admin System
    participant NS as Notification Service
    participant FCM as Firebase Cloud Messaging
    participant CA as Client App
    participant U as User

    Note over AS: Alert Triggered
    AS->>NS: Send Notification Request
    NS->>NS: Format Message
    NS->>FCM: Send to FCM
    
    FCM->>CA: Deliver Push Notification
    CA->>U: Show Notification
    
    U->>CA: Tap Notification
    CA->>CA: Open Relevant Screen
    
    alt Background App State
        FCM->>CA: Background Notification
        CA->>CA: Update Badge Count
        CA->>CA: Store for Later Display
    end
    
    alt App Not Installed
        FCM->>FCM: Queue for Delivery
        Note over FCM: Retry Later
    end
```

## 10. Data Synchronization Flow

```mermaid
graph TD
    subgraph "Client App"
        A[Local Storage]
        B[Firestore Listeners]
        C[Background Sync]
    end

    subgraph "Databases"
        D[Firestore Real-time]
        E[MongoDB Persistent]
    end

    subgraph "Admin System"
        F[Admin Dashboard]
        G[Background Jobs]
    end

    B --> D
    D --> B
    C --> E
    E --> C
    
    F --> D
    F --> E
    G --> D
    G --> E
    
    A --> B
    B --> A
    A --> C
    C --> A

    style A fill:#e8f5e8
    style B fill:#e1f5fe
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#f3e5f5
    style F fill:#e8f5e8
    style G fill:#fff3e0
```

## Color Legend

- 🔵 **Blue**: External APIs and Services
- 🟢 **Green**: Client-side Components  
- 🟠 **Orange**: Admin/Backend Components
- 🟣 **Purple**: Database Systems
- 🔴 **Red**: Alerts and Critical Processes
- 🟤 **Brown**: Data Storage and Persistence
- 🔘 **Gray**: System Operations and Background Jobs

## System Performance Metrics

### Expected Response Times
- **Weather Data Fetch**: < 2 seconds
- **Earthquake Alert**: < 5 seconds
- **Status Report Submission**: < 3 seconds
- **Map Loading**: < 4 seconds
- **Push Notification Delivery**: < 10 seconds

### Database Performance
- **Firestore Read/Write**: < 100ms
- **MongoDB Query**: < 200ms
- **Cache Hit Rate**: > 90%
- **API Rate Limit Usage**: < 80%

### Scalability Targets
- **Concurrent Users**: 1,000+
- **Status Reports/Day**: 10,000+
- **Push Notifications/Day**: 50,000+
- **Map Interactions/Day**: 25,000+

This visual documentation provides a comprehensive understanding of how data flows through the RescueNect system, helping developers and stakeholders understand the system architecture and implementation details.
