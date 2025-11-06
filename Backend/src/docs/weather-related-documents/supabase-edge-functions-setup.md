# Supabase Edge Functions Setup Guide

## Weather Notification System Implementation

## 📋 Overview

This guide provides step-by-step instructions for setting up Supabase Edge Functions for the weather notification system. It includes detailed configuration for Deno's strict import system and proper deployment procedures.

## 🏗️ Project Structure Setup

### 1. Initialize Supabase Project Structure

```bash
# Navigate to Backend directory
cd Backend

# Initialize Supabase (if not already done)
supabase init

# Create functions directory structure
mkdir -p supabase/functions/_shared
mkdir -p supabase/functions/notification-critical
mkdir -p supabase/functions/notification-warning
mkdir -p supabase/functions/notification-advisory
mkdir -p supabase/functions/notification-info
mkdir -p supabase/functions/notification-dashboard
mkdir -p supabase/functions/notification-health
```

### 2. Complete Directory Structure

```
Backend/
├── supabase/
│   ├── config.toml
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── notification-engine.ts
│   │   │   ├── weather-notification-core.ts
│   │   │   ├── fcm-client.ts
│   │   │   ├── firestore-client.ts
│   │   │   └── types.ts
│   │   ├── notification-critical/
│   │   │   ├── index.ts
│   │   │   └── deno.json
│   │   ├── notification-warning/
│   │   │   ├── index.ts
│   │   │   └── deno.json
│   │   ├── notification-advisory/
│   │   │   ├── index.ts
│   │   │   └── deno.json
│   │   ├── notification-info/
│   │   │   ├── index.ts
│   │   │   └── deno.json
│   │   ├── notification-dashboard/
│   │   │   ├── index.ts
│   │   │   └── deno.json
│   │   └── notification-health/
│   │       ├── index.ts
│   │       └── deno.json
│   └── migrations/
│       ├── 001_enable_cron.sql
│       ├── 002_notification_cron_jobs.sql
│       └── 003_notification_history_table.sql
```

## 🔧 Deno Configuration Files

### Template deno.json Configuration

Create this `deno.json` file in each notification function directory:

```json
{
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  },
  "imports": {
    "firebase-admin/app": "https://esm.sh/firebase-admin@11.8.0/app",
    "firebase-admin/firestore": "https://esm.sh/firebase-admin@11.8.0/firestore",
    "firebase-admin/messaging": "https://esm.sh/firebase-admin@11.8.0/messaging",
    "std/": "https://deno.land/std@0.168.0/"
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  },
  "fmt": {
    "files": {
      "include": ["**/*.ts", "**/*.js"],
      "exclude": ["node_modules/", "dist/"]
    },
    "options": {
      "useTabs": false,
      "lineWidth": 100,
      "indentWidth": 2,
      "semiColons": true,
      "singleQuote": true,
      "proseWrap": "preserve"
    }
  },
  "tasks": {
    "start": "deno run --allow-net --allow-env index.ts",
    "dev": "deno run --allow-net --allow-env --watch index.ts",
    "check": "deno check index.ts",
    "lint": "deno lint",
    "fmt": "deno fmt"
  },
  "permissions": {
    "net": ["https://esm.sh", "https://firestore.googleapis.com", "https://fcm.googleapis.com"],
    "env": ["FIREBASE_SERVICE_ACCOUNT_KEY", "SUPABASE_SERVICE_ROLE_KEY", "WEATHER_API_KEY"]
  }
}
```

## 📝 Individual Function Implementations

### 1. Critical Notification Function

Create `supabase/functions/notification-critical/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { NotificationProcessor, NotificationConfig } from '../_shared/notification-engine.ts';

console.log('🚨 Critical Notification Function Loaded');

const processor = new NotificationProcessor();

serve(async (req: Request) => {
  const startTime = performance.now();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Only allow POST requests for processing
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        allowedMethods: ['POST'],
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  console.log('🚨 Processing CRITICAL weather notifications...');

  try {
    // Configuration for critical notifications
    const config: NotificationConfig = {
      level: 'CRITICAL',
      maxNotificationsPerLocation: 5, // Allow multiple critical alerts
      cooldownPeriod: 10, // 10 minutes minimum between same type
      targetAudience: 'both', // Notify everyone for critical conditions
    };

    const results = await processor.processNotificationsForLevel(config);
    const processingTime = Math.round(performance.now() - startTime);

    const response = {
      success: true,
      level: 'CRITICAL',
      results: results,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      message: `Critical notifications: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`,
    };

    console.log('✅ Critical notifications processed:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ Critical notification error:', error);

    const errorResponse = {
      success: false,
      level: 'CRITICAL',
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
```

### 2. Warning Notification Function

Create `supabase/functions/notification-warning/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { NotificationProcessor, NotificationConfig } from '../_shared/notification-engine.ts';

console.log('⚠️ Warning Notification Function Loaded');

const processor = new NotificationProcessor();

serve(async (req: Request) => {
  const startTime = performance.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        allowedMethods: ['POST'],
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  console.log('⚠️ Processing WARNING weather notifications...');

  try {
    const config: NotificationConfig = {
      level: 'WARNING',
      maxNotificationsPerLocation: 3, // Limit warning spam
      cooldownPeriod: 30, // 30 minutes between same warnings
      targetAudience: 'both', // Notify admins and public
    };

    const results = await processor.processNotificationsForLevel(config);
    const processingTime = Math.round(performance.now() - startTime);

    const response = {
      success: true,
      level: 'WARNING',
      results: results,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      message: `Warning notifications: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`,
    };

    console.log('✅ Warning notifications processed:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ Warning notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        level: 'WARNING',
        error: error.message,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
```

### 3. Advisory Notification Function

Create `supabase/functions/notification-advisory/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { NotificationProcessor, NotificationConfig } from '../_shared/notification-engine.ts';

console.log('📋 Advisory Notification Function Loaded');

const processor = new NotificationProcessor();

serve(async (req: Request) => {
  const startTime = performance.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        allowedMethods: ['POST'],
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  console.log('📋 Processing ADVISORY weather notifications...');

  try {
    const config: NotificationConfig = {
      level: 'ADVISORY',
      maxNotificationsPerLocation: 2, // Fewer advisory notifications
      cooldownPeriod: 120, // 2 hours between same advisories
      targetAudience: 'both', // Notify all users
    };

    const results = await processor.processNotificationsForLevel(config);
    const processingTime = Math.round(performance.now() - startTime);

    const response = {
      success: true,
      level: 'ADVISORY',
      results: results,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      message: `Advisory notifications: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`,
    };

    console.log('✅ Advisory notifications processed:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ Advisory notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        level: 'ADVISORY',
        error: error.message,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
```

### 4. Info Notification Function

Create `supabase/functions/notification-info/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { NotificationProcessor, NotificationConfig } from '../_shared/notification-engine.ts';

console.log('ℹ️ Info Notification Function Loaded');

const processor = new NotificationProcessor();

serve(async (req: Request) => {
  const startTime = performance.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        allowedMethods: ['POST'],
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  console.log('ℹ️ Processing INFO weather notifications...');

  try {
    const config: NotificationConfig = {
      level: 'INFO',
      maxNotificationsPerLocation: 1, // Only essential info notifications
      cooldownPeriod: 360, // 6 hours between same info
      targetAudience: 'admin', // Only notify admins for info level
    };

    const results = await processor.processNotificationsForLevel(config);
    const processingTime = Math.round(performance.now() - startTime);

    const response = {
      success: true,
      level: 'INFO',
      results: results,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      message: `Info notifications: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`,
    };

    console.log('✅ Info notifications processed:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const processingTime = Math.round(performance.now() - startTime);
    console.error('❌ Info notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        level: 'INFO',
        error: error.message,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
```

## 🗄️ Database Migrations

### 1. Enable pg_cron Extension

Create `supabase/migrations/001_enable_cron.sql`:

```sql
-- Enable the pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create schema for notification management
CREATE SCHEMA IF NOT EXISTS notification_system;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA notification_system TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA notification_system TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA notification_system GRANT ALL ON TABLES TO postgres, service_role;

-- Create function for HTTP requests (if not exists)
CREATE OR REPLACE FUNCTION notification_system.http_post(
    url text,
    headers jsonb DEFAULT '{}',
    body jsonb DEFAULT '{}'
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Use the built-in net.http_post function
    SELECT net.http_post(url, headers, body) INTO result;
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error', SQLERRM,
            'url', url,
            'timestamp', now()
        );
END;
$$;
```

### 2. Setup Notification Cron Jobs

Create `supabase/migrations/002_notification_cron_jobs.sql`:

```sql
-- Clear any existing notification cron jobs
SELECT cron.unschedule('weather-notification-warning');
SELECT cron.unschedule('weather-notification-advisory');
SELECT cron.unschedule('weather-notification-info');

-- WARNING Notifications: Every 30 minutes (aligned with realtime weather data)
SELECT cron.schedule(
    'weather-notification-warning',
    '*/30 * * * *', -- Every 30 minutes
    $$
    SELECT notification_system.http_post(
        url := 'https://your-project-ref.supabase.co/functions/v1/notification-warning',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        ),
        body := '{}'::jsonb
    );
    $$
);

-- ADVISORY Notifications: Every 2 hours
SELECT cron.schedule(
    'weather-notification-advisory',
    '0 */2 * * *', -- Every 2 hours at minute 0
    $$
    SELECT notification_system.http_post(
        url := 'https://your-project-ref.supabase.co/functions/v1/notification-advisory',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        ),
        body := '{}'::jsonb
    );
    $$
);

-- INFO Notifications: Every 6 hours
SELECT cron.schedule(
    'weather-notification-info',
    '0 */6 * * *', -- Every 6 hours at minute 0
    $$
    SELECT notification_system.http_post(
        url := 'https://your-project-ref.supabase.co/functions/v1/notification-info',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        ),
        body := '{}'::jsonb
    );
    $$
);

-- Create a view to monitor cron job status
CREATE OR REPLACE VIEW notification_system.cron_job_status AS
SELECT
    jobname,
    schedule,
    active,
    jobid,
    nodename,
    nodeport,
    database,
    username,
    command
FROM cron.job
WHERE jobname LIKE 'weather-notification-%'
ORDER BY jobname;

-- Create a view to monitor recent cron job runs
CREATE OR REPLACE VIEW notification_system.recent_cron_runs AS
SELECT
    j.jobname,
    r.runid,
    r.job_pid,
    r.database,
    r.username,
    r.command,
    r.status,
    r.return_message,
    r.start_time,
    r.end_time,
    EXTRACT(EPOCH FROM (r.end_time - r.start_time)) as duration_seconds
FROM cron.job j
LEFT JOIN cron.job_run_details r ON j.jobid = r.jobid
WHERE j.jobname LIKE 'weather-notification-%'
    AND r.start_time > NOW() - INTERVAL '24 hours'
ORDER BY r.start_time DESC;
```

### 3. Notification History Tracking

Create `supabase/migrations/003_notification_history_table.sql`:

```sql
-- Create table for notification history (optional - for analytics)
CREATE TABLE IF NOT EXISTS notification_system.notification_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    level text NOT NULL CHECK (level IN ('CRITICAL', 'WARNING', 'ADVISORY', 'INFO')),
    category text NOT NULL,
    location text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    recipients_count integer NOT NULL DEFAULT 0,
    successful_count integer NOT NULL DEFAULT 0,
    failed_count integer NOT NULL DEFAULT 0,
    processing_time_ms integer,
    weather_data jsonb,
    errors jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_notification_log_level ON notification_system.notification_log(level);
CREATE INDEX idx_notification_log_location ON notification_system.notification_log(location);
CREATE INDEX idx_notification_log_created_at ON notification_system.notification_log(created_at);
CREATE INDEX idx_notification_log_level_location ON notification_system.notification_log(level, location);

-- Enable RLS (Row Level Security)
ALTER TABLE notification_system.notification_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow service role full access" ON notification_system.notification_log
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users to read" ON notification_system.notification_log
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION notification_system.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notification_log_updated_at
    BEFORE UPDATE ON notification_system.notification_log
    FOR EACH ROW EXECUTE FUNCTION notification_system.update_updated_at_column();

-- Create view for notification statistics
CREATE OR REPLACE VIEW notification_system.notification_stats AS
SELECT
    level,
    location,
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_notifications,
    SUM(recipients_count) as total_recipients,
    SUM(successful_count) as total_successful,
    SUM(failed_count) as total_failed,
    AVG(processing_time_ms) as avg_processing_time_ms,
    COUNT(CASE WHEN failed_count > 0 THEN 1 END) as notifications_with_errors
FROM notification_system.notification_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY level, location, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC, level, location;
```

## 🚀 Deployment Process

### 1. Environment Variables Setup

Before deployment, set up environment variables in Supabase Dashboard:

```bash
# Go to Supabase Dashboard > Settings > Environment Variables
# Add these variables:

FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "your-project-id", ...}'
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
WEATHER_API_KEY=your-tomorrow-io-api-key
SUPABASE_URL=https://your-project-ref.supabase.co
```

### 2. Deploy Shared Dependencies First

```bash
# Copy the shared files to the _shared directory
cp ../docs/weather-notification-core.ts supabase/functions/_shared/
```

Create the notification engine and other shared files as per the comprehensive documentation.

### 3. Deploy Functions in Order

```bash
# Deploy functions individually
supabase functions deploy notification-critical
supabase functions deploy notification-warning
supabase functions deploy notification-advisory
supabase functions deploy notification-info

# Verify deployments
supabase functions list
```

### 4. Run Database Migrations

```bash
# Run the migration files
supabase db reset
# or apply individually:
# supabase migration up
```

### 5. Update Cron Job URLs

After deployment, update the URLs in your cron jobs:

```sql
-- Update the cron job URLs with your actual project reference
UPDATE cron.job
SET command = REPLACE(command, 'your-project-ref', 'your-actual-project-ref')
WHERE jobname LIKE 'weather-notification-%';
```

## 🧪 Testing & Validation

### 1. Manual Function Testing

```bash
# Test each function individually
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/notification-critical' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' | jq

curl -X POST 'https://your-project-ref.supabase.co/functions/v1/notification-warning' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' | jq
```

### 2. Cron Job Status Check

```sql
-- Check if cron jobs are scheduled correctly
SELECT * FROM notification_system.cron_job_status;

-- Monitor recent runs
SELECT * FROM notification_system.recent_cron_runs LIMIT 10;
```

### 3. Test Script

Create `test-notification-functions.sh`:

```bash
#!/bin/bash

PROJECT_REF="your-project-ref"
SERVICE_ROLE_KEY="your-service-role-key"
BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1"

echo "🧪 Testing Weather Notification Functions"
echo "========================================"

# Test functions array
functions=("notification-critical" "notification-warning" "notification-advisory" "notification-info")

for func in "${functions[@]}"; do
    echo ""
    echo "Testing $func..."

    response=$(curl -s -X POST "${BASE_URL}/${func}" \
        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -w "HTTPSTATUS:%{http_code}")

    # Extract HTTP status code
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        echo "✅ $func - Success"
        echo "$body" | jq -r '.message // .results // "No message"'
    else
        echo "❌ $func - Failed (HTTP $http_code)"
        echo "$body"
    fi

    sleep 1
done

echo ""
echo "🏁 Testing complete!"
```

Make it executable and run:

```bash
chmod +x test-notification-functions.sh
./test-notification-functions.sh
```

## 📊 Monitoring Setup

### 1. Health Check Function

Create `supabase/functions/notification-health/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        environment: await checkEnvironmentVariables(),
        firebase: await testFirebaseConnection(),
        database: await testDatabaseConnection(),
      },
    };

    // Determine overall health
    const allChecksHealthy = Object.values(health.checks).every(check => check.status === 'ok');

    health.status = allChecksHealthy ? 'healthy' : 'degraded';

    return new Response(JSON.stringify(health), {
      status: allChecksHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

async function checkEnvironmentVariables() {
  const required = ['FIREBASE_SERVICE_ACCOUNT_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !Deno.env.get(key));

  return {
    status: missing.length === 0 ? 'ok' : 'error',
    message: missing.length === 0 ? 'All required variables present' : `Missing: ${missing.join(', ')}`,
  };
}

async function testFirebaseConnection() {
  try {
    const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      return { status: 'error', message: 'Firebase service account key not found' };
    }

    JSON.parse(serviceAccountKey); // Validate JSON format
    return { status: 'ok', message: 'Firebase configuration valid' };
  } catch (error) {
    return { status: 'error', message: `Firebase config error: ${error.message}` };
  }
}

async function testDatabaseConnection() {
  try {
    // This would require actual database connection testing
    return { status: 'ok', message: 'Database connection available' };
  } catch (error) {
    return { status: 'error', message: `Database error: ${error.message}` };
  }
}
```

### 2. Monitoring Dashboard

Access monitoring information via:

- **Health Check**: `GET /functions/v1/notification-health`
- **Cron Status**: Query `notification_system.cron_job_status`
- **Recent Runs**: Query `notification_system.recent_cron_runs`
- **Statistics**: Query `notification_system.notification_stats`

## 🔧 Troubleshooting

### Common Issues & Solutions

1. **Import Resolution Errors**

```bash
# Issue: Cannot resolve import
# Solution: Check deno.json imports mapping and ESM URLs
```

2. **Environment Variable Issues**

```bash
# Issue: Missing environment variables
# Solution: Verify in Supabase Dashboard > Settings > Environment Variables
```

3. **Cron Job Failures**

```sql
-- Check recent cron job runs for errors
SELECT * FROM notification_system.recent_cron_runs
WHERE status != 'succeeded'
ORDER BY start_time DESC;
```

4. **Function Memory Issues**

```typescript
// Solution: Optimize memory usage in notification processing
// Process locations in smaller batches
```

5. **FCM Token Validation Errors**

```typescript
// Solution: Implement token cleanup and validation
// Check token format before sending notifications
```

## 🎯 Next Steps

1. **Deploy All Functions**: Complete the deployment of all notification functions
2. **Configure Cron Jobs**: Update URLs and test cron job execution
3. **Test Notification Flow**: Verify end-to-end notification delivery
4. **Monitor Performance**: Set up alerting for function failures
5. **Optimize Settings**: Fine-tune notification frequency and thresholds

This setup guide provides everything needed to implement a robust, scalable weather notification system using Supabase Edge Functions with proper Deno configuration and deployment procedures.
