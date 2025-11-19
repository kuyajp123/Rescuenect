# Earthquake Monitoring System Documentation

## Overview

This comprehensive earthquake monitoring system integrates multiple services to provide real-time earthquake alerts and data management for the Rescuenect application. The system automatically fetches earthquake data from USGS, processes it through Supabase Edge Functions, stores relevant data in Firestore, and sends push notifications via Firebase Cloud Messaging.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   USGS API      │────│ Supabase Edge   │────│   Firestore     │
│ (Every 5 mins)  │    │   Function      │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Firebase Cloud  │
                       │   Messaging     │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Mobile Apps    │
                       │ (Push Notifications)│
                       └─────────────────┘
```

## Key Components

1. **USGS Earthquake API Integration**
2. **Supabase Edge Function Scheduler**
3. **Firestore Data Management**
4. **Firebase Cloud Messaging**
5. **Mobile App Notification System**

## Data Flow

1. **Data Fetching**: Supabase Edge Function runs every 5 minutes
2. **Data Comparison**: Compare fetched data with existing Firestore records
3. **Notification Processing**: Send FCM notifications for new earthquakes
4. **Data Storage**: Store new earthquake data in Firestore
5. **User Notification**: Display notifications in mobile apps

## Documentation Structure

- [`api-integration.md`](./api-integration.md) - USGS API integration details
- [`supabase-functions.md`](./supabase-functions.md) - Edge function implementation
- [`database-schema.md`](./database-schema.md) - Firestore collections and data structure
- [`notification-system.md`](./notification-system.md) - FCM and notification logic
- [`implementation-guide.md`](./implementation-guide.md) - Step-by-step implementation
- [`testing-guide.md`](./testing-guide.md) - Testing procedures and scenarios
- [`troubleshooting.md`](./troubleshooting.md) - Common issues and solutions

## Quick Start

1. Set up Supabase Edge Function with cron scheduling
2. Configure Firebase Cloud Messaging
3. Implement Firestore collections
4. Deploy the earthquake monitoring function
5. Test with mock data

## Key Features

- ✅ Automated earthquake data fetching every 5 minutes
- ✅ Intelligent data comparison to prevent duplicates
- ✅ Real-time push notifications for new earthquakes
- ✅ Separate collections for earthquakes and notifications
- ✅ User-friendly earthquake severity notifications
- ✅ 30-day earthquake history tracking
- ✅ Geographic filtering (150km radius from coordinates)

## Technology Stack

- **API Source**: USGS Earthquake Hazards Program
- **Scheduler**: Supabase Edge Functions with Cron
- **Database**: Google Firestore (reuses existing setup)
- **Notifications**: Firebase Cloud Messaging (reuses existing `_shared/fcm-client.ts`)
- **Runtime**: Deno (Supabase Edge Functions)
- **Infrastructure**: Leverages existing `_shared/` folder for Firebase clients

## Getting Started

Refer to the [`implementation-guide.md`](./implementation-guide.md) for detailed setup instructions.
