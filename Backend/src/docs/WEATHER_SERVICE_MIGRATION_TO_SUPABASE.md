# Weather Service Migration to Supabase Edge Functions

## 📋 Overview

This document outlines the migration strategy for converting the current weather service from a manual timestamp-based scheduling system to Supabase Edge Functions with built-in cron job scheduling. **Important: We will continue using Firestore as our main database** - this migration only replaces the scheduling mechanism while keeping all data storage in Firestore. This migration addresses reliability issues in production and optimizes API usage to stay within free tier limits.

## 🎯 Migration Goals

### Current Issues

- **Manual Scheduling**: Unreliable timestamp-based scheduling in production
- **Resource Consumption**: Continuous polling consumes free tier limits quickly
- **Maintenance Overhead**: Manual timestamp management and error handling
- **Scalability Limitations**: Single server dependency for scheduling

### Target Benefits

- **Automated Scheduling**: Built-in cron job scheduling via Supabase
- **Cost Optimization**: Reduce API calls through precise scheduling
- **Reliability**: Server-independent scheduled execution
- **Simplified Architecture**: Remove manual timestamp management

## 📊 Current Architecture Analysis

### Current Weather Service Structure

```typescript
// Current scheduling logic
const now = new Date();
const oneHour = 60 * 60 * 1000;
const thirtyMinutes = 30 * 60 * 1000;
const twelveHours = 12 * 60 * 60 * 1000;

// Manual timestamp checks
if (!hourlyLastFetch || now.getTime() - hourlyLastFetch.getTime() > oneHour) {
  // Fetch hourly data
}
```

### Weather Data Types & Current Schedules

| Data Type | Current Interval | API Calls per Day | Target Schedule              |
| --------- | ---------------- | ----------------- | ---------------------------- |
| Hourly    | Every 1 hour     | 24 calls          | `0 0 * * * *` (hourly)       |
| Daily     | Every 12 hours   | 2 calls           | `0 0 */12 * * *` (every 12h) |
| Realtime  | Every 30 minutes | 48 calls          | `0 */30 * * * *` (every 30m) |

**Total Current API Calls**: ~74 calls/day per location × 6 locations = **444 calls/day**

## 🏗️ Migration Architecture

### New Supabase Edge Function Structure

```
supabase/
├── functions/
│   ├── weather-hourly/
│   │   ├── index.ts
│   │   └── cron.yaml
│   ├── weather-daily/
│   │   ├── index.ts
│   │   └── cron.yaml
│   └── weather-realtime/
│       ├── index.ts
│       └── cron.yaml
├── config.toml
└── migrations/
    └── 001_weather_functions.sql
```

### Edge Function Components

#### 1. Shared Weather Utilities

```typescript
// supabase/functions/_shared/weather-utils.ts
export interface WeatherLocation {
  key: string;
  coordinates: string;
  name: string;
}

export const WEATHER_LOCATIONS: WeatherLocation[] = [
  { key: 'coastal_west', coordinates: '14.311667, 120.751944', name: 'Coastal West' },
  { key: 'coastal_east', coordinates: '14.333333, 120.771389', name: 'Coastal East' },
  { key: 'central_naic', coordinates: '14.302222, 120.771944', name: 'Central Naic' },
  { key: 'sabang', coordinates: '14.320000, 120.805833', name: 'Sabang' },
  { key: 'farm_area', coordinates: '14.289444, 120.793889', name: 'Farm Area' },
  { key: 'naic_boundary', coordinates: '14.260278, 120.820278', name: 'Naic Boundary' },
];

export const getWeatherAPIUrl = (coordinates: string, type: 'forecast' | 'realtime'): string => {
  const API_KEY = Deno.env.get('WEATHER_API_KEY')!;

  if (type === 'forecast') {
    return `https://api.tomorrow.io/v4/weather/forecast?location=${coordinates}&timesteps=1h&timesteps=1d&apikey=${API_KEY}`;
  }

  return `https://api.tomorrow.io/v4/weather/realtime?location=${coordinates}&apikey=${API_KEY}`;
};

export const convertToManilaTime = (utcTime: string): string => {
  const date = new Date(utcTime);
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
```

#### 2. Firestore Database Client

```typescript
// supabase/functions/_shared/firestore-client.ts
import { initializeApp, cert } from 'https://esm.sh/firebase-admin@11.8.0/app';
import { getFirestore } from 'https://esm.sh/firebase-admin@11.8.0/firestore';

// Initialize Firebase Admin SDK in Edge Function
const initializeFirebase = () => {
  const serviceAccountKey = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')!);

  const app = initializeApp({
    credential: cert(serviceAccountKey),
  });

  return getFirestore(app);
};

export const insertWeatherData = async (
  collection: string,
  document: string,
  subcollection: string,
  docId: string,
  data: any
) => {
  try {
    const db = initializeFirebase();

    // Store in Firestore using the existing structure
    const docRef = db.collection(collection).doc(document);

    await docRef.collection(subcollection).doc(docId).set(data);

    console.log(`✅ Data inserted to Firestore: ${collection}/${document}/${subcollection}/${docId}`);
  } catch (error) {
    console.error('Firestore insert error:', error);
    throw error;
  }
};
```

#### 3. Hourly Weather Function

```typescript
// supabase/functions/weather-hourly/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { WEATHER_LOCATIONS, getWeatherAPIUrl, convertToManilaTime, delay } from '../_shared/weather-utils.ts';
import { insertWeatherData } from '../_shared/firestore-client.ts';

interface HourlyWeatherData {
  timelines: {
    hourly: Array<{
      time: string;
      values: Record<string, any>;
    }>;
  };
}

const processHourlyWeather = async (location: (typeof WEATHER_LOCATIONS)[0]) => {
  try {
    console.log(`🔄 Fetching hourly data for ${location.name}`);

    const forecastUrl = getWeatherAPIUrl(location.coordinates, 'forecast');
    const response = await fetch(forecastUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: HourlyWeatherData = await response.json();
    const hourlyData = data.timelines.hourly;

    // Process first 24 hours
    const promises = [];
    for (let i = 0; i < 24 && i < hourlyData.length; i++) {
      const hour = hourlyData[i];
      const localTime = convertToManilaTime(hour.time);
      const paddedId = i.toString().padStart(3, '0');

      promises.push(
        insertWeatherData('weather', location.key, 'hourly', paddedId, {
          time: localTime,
          ...hour.values,
        })
      );
    }

    await Promise.all(promises);
    console.log(`✅ Hourly data processed for ${location.name}`);
  } catch (error) {
    console.error(`❌ Error processing hourly data for ${location.name}:`, error);
    throw error;
  }
};

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('🌤️ Starting hourly weather data collection...');

    // Process all locations with delay to avoid rate limits
    for (const location of WEATHER_LOCATIONS) {
      await processHourlyWeather(location);
      await delay(1500); // Rate limiting delay
    }

    console.log('✅ All hourly weather data processed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Hourly weather data collected successfully',
        processedLocations: WEATHER_LOCATIONS.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Hourly weather collection failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

#### 4. Daily Weather Function

```typescript
// supabase/functions/weather-daily/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { WEATHER_LOCATIONS, getWeatherAPIUrl, convertToManilaTime, delay } from '../_shared/weather-utils.ts';
import { insertWeatherData } from '../_shared/firestore-client.ts';

interface DailyWeatherData {
  timelines: {
    daily: Array<{
      time: string;
      values: Record<string, any>;
    }>;
  };
}

const processDailyWeather = async (location: (typeof WEATHER_LOCATIONS)[0]) => {
  try {
    console.log(`🔄 Fetching daily data for ${location.name}`);

    const forecastUrl = getWeatherAPIUrl(location.coordinates, 'forecast');
    const response = await fetch(forecastUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: DailyWeatherData = await response.json();
    const dailyData = data.timelines.daily;

    // Process daily forecasts
    const promises = dailyData.map((day, index) => {
      const localTime = convertToManilaTime(day.time);
      const paddedId = index.toString().padStart(3, '0');

      return insertWeatherData('weather', location.key, 'daily', paddedId, {
        time: localTime,
        ...day.values,
      });
    });

    await Promise.all(promises);
    console.log(`✅ Daily data processed for ${location.name}`);
  } catch (error) {
    console.error(`❌ Error processing daily data for ${location.name}:`, error);
    throw error;
  }
};

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('📅 Starting daily weather data collection...');

    for (const location of WEATHER_LOCATIONS) {
      await processDailyWeather(location);
      await delay(1500);
    }

    console.log('✅ All daily weather data processed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily weather data collected successfully',
        processedLocations: WEATHER_LOCATIONS.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Daily weather collection failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

#### 5. Realtime Weather Function

```typescript
// supabase/functions/weather-realtime/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { WEATHER_LOCATIONS, getWeatherAPIUrl, convertToManilaTime, delay } from '../_shared/weather-utils.ts';
import { insertWeatherData } from '../_shared/firestore-client.ts';

const processRealtimeWeather = async (location: (typeof WEATHER_LOCATIONS)[0]) => {
  try {
    console.log(`🔄 Fetching realtime data for ${location.name}`);

    const realtimeUrl = getWeatherAPIUrl(location.coordinates, 'realtime');
    const response = await fetch(realtimeUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const localTime = convertToManilaTime(data.data.time);

    await insertWeatherData('weather', location.key, 'realtime', 'data', {
      localTime,
      ...data,
    });

    console.log(`✅ Realtime data processed for ${location.name}`);
  } catch (error) {
    console.error(`❌ Error processing realtime data for ${location.name}:`, error);
    throw error;
  }
};

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('⚡ Starting realtime weather data collection...');

    for (const location of WEATHER_LOCATIONS) {
      await processRealtimeWeather(location);
      await delay(1500);
    }

    console.log('✅ All realtime weather data processed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Realtime weather data collected successfully',
        processedLocations: WEATHER_LOCATIONS.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Realtime weather collection failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

## 🕰️ Cron Job Configuration

### Supabase Cron Setup

#### 1. Enable pg_cron Extension

```sql
-- supabase/migrations/001_enable_cron.sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

#### 2. Hourly Weather Cron Job

```sql
-- supabase/migrations/002_weather_hourly_cron.sql
SELECT cron.schedule(
  'weather-hourly-collection',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/weather-hourly',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

#### 3. Daily Weather Cron Job

```sql
-- supabase/migrations/003_weather_daily_cron.sql
SELECT cron.schedule(
  'weather-daily-collection',
  '0 */12 * * *',  -- Every 12 hours
  $$
  SELECT
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/weather-daily',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

#### 4. Realtime Weather Cron Job

```sql
-- supabase/migrations/004_weather_realtime_cron.sql
SELECT cron.schedule(
  'weather-realtime-collection',
  '*/30 * * * *',  -- Every 30 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/weather-realtime',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

### Cron Schedule Reference

```bash
# Cron expression format: minute hour day month day-of-week

# Hourly (every hour at minute 0)
0 * * * *

# Daily (every 12 hours - at 00:00 and 12:00)
0 */12 * * *

# Realtime (every 30 minutes)
*/30 * * * *
```

## 💾 Database Schema - No Changes Required

### Current Firestore Structure (Maintained)

```
weather/
├── coastal_west/
│   ├── hourly/
│   │   ├── 000
│   │   ├── 001
│   │   └── ...
│   ├── daily/
│   │   ├── 000
│   │   ├── 001
│   │   └── ...
│   └── realtime/
│       └── data
```

**Important**: We maintain the exact same Firestore database structure. No schema migration is required since we're only changing the scheduling mechanism, not the data storage layer.

### Database Configuration for Edge Functions

The Edge Functions will need access to your Firebase project:

```typescript
// Configuration needed in Edge Functions
const firebaseConfig = {
  projectId: 'your-project-id',
  // Service account key will be provided via environment variables
};
```

## 🚀 Migration Steps

### Phase 1: Setup Supabase Environment

#### 1.1 Initialize Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project
cd Backend
supabase init

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

#### 1.2 Environment Configuration

```bash
# supabase/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEATHER_API_KEY=your-weather-api-key
FIREBASE_SERVICE_ACCOUNT_KEY=your-firebase-service-account-json
```

### Phase 2: Firebase Configuration for Edge Functions

#### 2.1 Setup Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key (JSON format)
3. Add the JSON content as an environment variable in Supabase:

```bash
# In Supabase Dashboard → Settings → Environment Variables
FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "your-project"...}'
```

#### 2.2 Test Firestore Connection (Optional)

```typescript
// scripts/test-firestore-connection.ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const testFirestoreConnection = async () => {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);

    const app = initializeApp({
      credential: cert(serviceAccount),
    });

    const db = getFirestore(app);

    // Test read from existing weather data
    const testDoc = await db.collection('weather').doc('central_naic').collection('realtime').doc('data').get();

    if (testDoc.exists) {
      console.log('✅ Firestore connection successful');
      console.log('Sample data:', testDoc.data());
    } else {
      console.log('⚠️ Firestore connected but no test data found');
    }
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
  }
};

testFirestoreConnection();
```

### Phase 3: Deploy Edge Functions

#### 3.1 Deployment Patterns & Best Practices

##### **Individual Function Deployment**

```bash
# Deploy functions individually (Recommended for development)
supabase functions deploy weather-hourly
supabase functions deploy weather-daily
supabase functions deploy weather-realtime

# Check deployment status
supabase functions list
```

##### **Environment-Specific Deployment**

```bash
# Deploy to staging environment
supabase functions deploy weather-hourly --project-ref YOUR_STAGING_REF

# Deploy to production environment
supabase functions deploy weather-hourly --project-ref YOUR_PROD_REF
```

##### **Batch Deployment Script**

```bash
#!/bin/bash
# deploy-weather-functions.sh

echo "🚀 Deploying weather functions..."

functions=("weather-hourly" "weather-daily" "weather-realtime")

for func in "${functions[@]}"; do
  echo "📦 Deploying $func..."
  supabase functions deploy $func

  if [ $? -eq 0 ]; then
    echo "✅ $func deployed successfully"
  else
    echo "❌ Failed to deploy $func"
    exit 1
  fi

  sleep 2  # Brief delay between deployments
done

echo "🎉 All weather functions deployed successfully!"
```

#### 3.2 Deployment Concerns & Solutions

##### **🔐 Environment Variables Management**

**Critical Environment Variables:**

```bash
# Required for all functions
WEATHER_API_KEY=your-tomorrow-io-api-key
FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account",...}'

# Optional for monitoring
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Security Concerns:**

- ❌ **Never commit** environment variables to version control
- ✅ **Use Supabase Dashboard** → Settings → Environment Variables
- ✅ **Validate keys** before deployment using test functions

**Environment Variables Validation Script:**

```typescript
// supabase/functions/validate-env/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async req => {
  const requiredVars = ['WEATHER_API_KEY', 'FIREBASE_SERVICE_ACCOUNT_KEY'];

  const missing = [];
  const valid = [];

  for (const varName of requiredVars) {
    const value = Deno.env.get(varName);
    if (!value) {
      missing.push(varName);
    } else {
      valid.push({
        name: varName,
        hasValue: true,
        length: value.length,
      });
    }
  }

  // Test Firebase service account parsing
  let firebaseValid = false;
  try {
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY') || '{}');
    firebaseValid = serviceAccount.type === 'service_account';
  } catch (error) {
    // Invalid JSON
  }

  return new Response(
    JSON.stringify({
      success: missing.length === 0 && firebaseValid,
      environment_check: {
        valid_variables: valid,
        missing_variables: missing,
        firebase_service_account_valid: firebaseValid,
      },
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
```

##### **📊 Function Size & Bundle Optimization**

**Bundle Size Concerns:**

```bash
# Check function bundle size after deployment
supabase functions list --output json | jq '.[] | {name, size}'
```

**Optimization Strategies:**

- ✅ **Shared Dependencies**: Use `_shared` folder effectively
- ✅ **Tree Shaking**: Only import what you need
- ⚠️ **Firebase Admin SDK**: Large bundle (~2MB), but necessary
- ✅ **ESM Imports**: Use specific imports from Firebase

**Optimized Import Pattern:**

```typescript
// ❌ Large bundle - imports everything
import * as admin from 'https://esm.sh/firebase-admin@11.8.0';

// ✅ Smaller bundle - specific imports
import { initializeApp, cert } from 'https://esm.sh/firebase-admin@11.8.0/app';
import { getFirestore } from 'https://esm.sh/firebase-admin@11.8.0/firestore';
```

##### **🚨 Deployment Error Handling**

**Common Deployment Issues:**

1. **Environment Variable Issues**

```bash
# Error: Missing environment variables
# Solution: Check Supabase dashboard environment variables
supabase functions deploy weather-hourly --debug
```

2. **Import Resolution Errors**

```bash
# Error: Cannot resolve import
# Solution: Check file paths and ESM imports
```

3. **Firebase Connection Issues**

```bash
# Error: Firebase connection failed
# Solution: Validate service account JSON format
```

**Deployment Verification Script:**

```bash
#!/bin/bash
# verify-deployment.sh

echo "🔍 Verifying weather function deployments..."

functions=("weather-hourly" "weather-daily" "weather-realtime")
base_url="https://your-project.supabase.co/functions/v1"
auth_header="Authorization: Bearer YOUR_ANON_KEY"

for func in "${functions[@]}"; do
  echo "Testing $func..."

  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "$auth_header" \
    "$base_url/$func")

  if [ $response -eq 200 ]; then
    echo "✅ $func is working"
  else
    echo "❌ $func failed (HTTP $response)"
  fi
done
```

##### **🔄 Hot Reload & Development Workflow**

**Local Development:**

```bash
# Start local development server
supabase functions serve weather-hourly --env-file supabase/.env

# Test locally
curl -X POST 'http://localhost:54321/functions/v1/weather-hourly' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

**Development-to-Production Pipeline:**

```bash
# 1. Develop locally
supabase functions serve weather-hourly

# 2. Test locally
npm run test:functions

# 3. Deploy to staging
supabase functions deploy weather-hourly --project-ref STAGING_REF

# 4. Test staging
npm run test:staging

# 5. Deploy to production
supabase functions deploy weather-hourly --project-ref PROD_REF
```

##### **📈 Performance & Monitoring Concerns**

**Cold Start Optimization:**

```typescript
// Minimize cold start time
let dbInstance: any = null;

const getDatabase = () => {
  if (!dbInstance) {
    const serviceAccountKey = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')!);
    const app = initializeApp({ credential: cert(serviceAccountKey) });
    dbInstance = getFirestore(app);
  }
  return dbInstance;
};
```

**Memory Usage Optimization:**

```typescript
// Process locations in batches to manage memory
const BATCH_SIZE = 2; // Process 2 locations at a time
const MEMORY_CLEANUP_INTERVAL = 3; // Cleanup every 3 locations

for (let i = 0; i < WEATHER_LOCATIONS.length; i += BATCH_SIZE) {
  const batch = WEATHER_LOCATIONS.slice(i, i + BATCH_SIZE);

  await Promise.all(batch.map(location => processWeather(location)));

  // Memory cleanup
  if (i % MEMORY_CLEANUP_INTERVAL === 0) {
    if (global.gc) global.gc(); // Force garbage collection if available
  }

  await delay(1500); // Rate limiting
}
```

**Function Timeout Configuration:**

```typescript
// Add timeout handling for long-running operations
const FUNCTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const processWithTimeout = async (operation: Promise<any>) => {
  return Promise.race([
    operation,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Function timeout')), FUNCTION_TIMEOUT)),
  ]);
};
```

#### 3.3 Production Deployment Checklist

**Pre-Deployment:**

- [ ] Environment variables configured in Supabase dashboard
- [ ] Firebase service account key tested and valid
- [ ] Weather API key has sufficient quota
- [ ] All `_shared` dependencies are properly structured
- [ ] Local testing completed successfully

**Deployment:**

- [ ] Functions deployed without errors
- [ ] Function list shows all three weather functions
- [ ] Environment validation function passes
- [ ] Bundle sizes are within reasonable limits

**Post-Deployment:**

- [ ] Manual function testing via curl/Postman
- [ ] Firestore data validation (check if data is being written)
- [ ] Function logs review for any errors
- [ ] Performance monitoring setup

**Rollback Plan:**

- [ ] Previous function versions identified
- [ ] Rollback commands prepared
- [ ] Express server weather service ready to re-enable

#### 3.4 Function Testing & Validation

```bash
# Comprehensive function testing
echo "🧪 Testing all weather functions..."

# Test environment validation first
echo "Testing environment setup..."
curl -X POST 'https://your-project.supabase.co/functions/v1/validate-env' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' | jq

# Test weather functions
echo "Testing weather-hourly..."
curl -X POST 'https://your-project.supabase.co/functions/v1/weather-hourly' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' | jq

echo "Testing weather-daily..."
curl -X POST 'https://your-project.supabase.co/functions/v1/weather-daily' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' | jq

echo "Testing weather-realtime..."
curl -X POST 'https://your-project.supabase.co/functions/v1/weather-realtime' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' | jq

echo "✅ Function testing complete!"
```

### Phase 4: Backend Integration - No Changes Required

**Important**: Since we're keeping Firestore as the database, **no changes are required** to your existing backend API endpoints or controllers. Your current backend will continue working exactly as before.

The existing code will remain functional:

```typescript
// Backend/src/services/WeatherService.ts - Keep as is
// Backend/src/controllers/admin/WeatherController.ts - Keep as is
// Backend/src/models/admin/WeatherModel.ts - Keep as is
```

#### 4.1 Optional: Add Monitoring Endpoint

You can optionally add a monitoring endpoint to check if the Edge Functions are working:

```typescript
// Backend/src/controllers/admin/WeatherController.ts - ADD this method
export class WeatherController {
  // ... existing methods stay the same ...

  async getSchedulingStatus(req: Request, res: Response) {
    try {
      // Check when data was last updated
      const locations = ['central_naic', 'coastal_west', 'coastal_east'];
      const promises = locations.map(async location => {
        const realtimeDoc = await db.collection('weather').doc(location).collection('realtime').doc('data').get();

        return {
          location,
          lastUpdated: realtimeDoc.exists ? realtimeDoc.data()?.localTime : null,
          dataAge: realtimeDoc.exists ? Date.now() - new Date(realtimeDoc.data()?.localTime).getTime() : null,
        };
      });

      const results = await Promise.all(promises);

      res.json({
        success: true,
        scheduling_status: 'supabase_edge_functions',
        locations: results,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch scheduling status',
      });
    }
  }
}
```

## 📊 Monitoring and Maintenance

### Function Monitoring Dashboard

```typescript
// supabase/functions/weather-monitor/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { initializeApp, cert } from 'https://esm.sh/firebase-admin@11.8.0/app';
import { getFirestore } from 'https://esm.sh/firebase-admin@11.8.0/firestore';

serve(async req => {
  try {
    const serviceAccountKey = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')!);

    const app = initializeApp({
      credential: cert(serviceAccountKey),
    });

    const db = getFirestore(app);

    // Check recent updates in Firestore
    const locations = ['coastal_west', 'coastal_east', 'central_naic', 'sabang', 'farm_area', 'naic_boundary'];
    const dataTypes = ['hourly', 'daily', 'realtime'];

    const monitoringResults = [];

    for (const location of locations) {
      for (const dataType of dataTypes) {
        try {
          let lastUpdate = null;

          if (dataType === 'realtime') {
            const doc = await db.collection('weather').doc(location).collection(dataType).doc('data').get();

            if (doc.exists) {
              lastUpdate = doc.data()?.localTime;
            }
          } else {
            // For hourly/daily, check the most recent document
            const snapshot = await db
              .collection('weather')
              .doc(location)
              .collection(dataType)
              .orderBy('time', 'desc')
              .limit(1)
              .get();

            if (!snapshot.empty) {
              lastUpdate = snapshot.docs[0].data()?.time;
            }
          }

          const dataAge = lastUpdate ? Date.now() - new Date(lastUpdate).getTime() : null;

          monitoringResults.push({
            location,
            dataType,
            lastUpdate,
            dataAgeMinutes: dataAge ? Math.floor(dataAge / (1000 * 60)) : null,
            isStale: dataAge ? dataAge > 2 * 60 * 60 * 1000 : true, // 2 hours threshold
          });
        } catch (error) {
          monitoringResults.push({
            location,
            dataType,
            error: error.message,
            isStale: true,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        monitoring: {
          total_checked: monitoringResults.length,
          stale_count: monitoringResults.filter(r => r.isStale).length,
          results: monitoringResults,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

### Cron Job Management

```sql
-- View active cron jobs
SELECT * FROM cron.job;

-- Monitor cron job runs
SELECT * FROM cron.job_run_details
WHERE end_time > NOW() - INTERVAL '24 hours'
ORDER BY end_time DESC;

-- Update cron schedule if needed
SELECT cron.alter_job('weather-hourly-collection', schedule := '0 * * * *');

-- Disable/enable cron jobs
SELECT cron.unschedule('weather-realtime-collection');
SELECT cron.schedule('weather-realtime-collection', '*/30 * * * *', $$..$$);
```

## 🔄 Rollback Strategy

### Emergency Rollback Plan

```typescript
// scripts/rollback-to-express.ts
export const rollbackPlan = {
  // 1. Re-enable Express weather service
  enableExpressService: async () => {
    // Uncomment weatherSched import in server.ts
    // Re-enable timestamp checking logic
  },

  // 2. Disable Supabase cron jobs
  disableSupabaseCron: async () => {
    // Run SQL to unschedule all weather cron jobs
    const jobs = ['weather-hourly-collection', 'weather-daily-collection', 'weather-realtime-collection'];

    jobs.forEach(job => {
      // Execute: SELECT cron.unschedule('${job}');
    });
  },

  // 3. Resume manual scheduling in Express server
  resumeManualScheduling: async () => {
    // Re-enable the weatherSched import and manual timestamp logic
    // No data migration needed since we never left Firestore
  },
};
```

## 📈 Cost Optimization Analysis

### Before Migration (Current State)

- **API Calls per Day**: 444 calls (74 calls × 6 locations)
- **Monthly API Calls**: ~13,320 calls
- **Server Resources**: Continuous polling and timestamp checking
- **Reliability**: Dependent on server uptime
- **Database**: Firestore (pay-per-usage)

### After Migration (Supabase Edge Functions + Firestore)

- **API Calls per Day**: 444 calls (same total, but scheduled)
- **Monthly API Calls**: ~13,320 calls
- **Server Resources**: Zero - handled by Supabase
- **Reliability**: Built-in redundancy and scheduling
- **Database**: Still Firestore (same costs)
- **Cost Reduction**: Eliminate server polling overhead, reduce server compute costs

### Resource Optimization

```typescript
// Optimized batch processing in edge functions
const BATCH_SIZE = 3; // Process 3 locations at a time
const BATCH_DELAY = 2000; // 2 second delay between batches

const processBatches = async (locations: WeatherLocation[]) => {
  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    const batch = locations.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(location => processWeatherData(location)));

    if (i + BATCH_SIZE < locations.length) {
      await delay(BATCH_DELAY);
    }
  }
};
```

## 🎯 Success Metrics

### Key Performance Indicators

- **Reliability**: 99.9% successful cron job execution
- **Cost Efficiency**: 50% reduction in server resource usage
- **API Optimization**: Maintain same data freshness with precise scheduling
- **Maintenance**: 80% reduction in manual intervention
- **Scalability**: Easy addition of new locations without server changes

### Monitoring Checklist

- [ ] All cron jobs running on schedule
- [ ] No stale data older than expected intervals
- [ ] API rate limits not exceeded
- [ ] Edge function error rates < 1%
- [ ] Database storage growth within expected bounds
- [ ] Frontend weather data displays correctly

## 🚀 Next Steps

1. **Setup Development Environment** (Week 1)

   - Initialize Supabase project
   - Create development edge functions
   - Test basic functionality

2. **Migration Development** (Week 2-3)

   - Implement all edge functions
   - Create database schema
   - Build API adapters

3. **Testing & Validation** (Week 4)

   - End-to-end testing
   - Performance validation
   - Load testing

4. **Production Deployment** (Week 5)

   - Deploy to production
   - Enable cron jobs
   - Monitor initial runs

5. **Optimization & Monitoring** (Week 6+)
   - Fine-tune schedules
   - Optimize performance
   - Establish monitoring alerts

This migration will provide a robust, cost-effective, and scalable weather service that eliminates the current reliability issues while maintaining the same data quality and freshness your application requires.
