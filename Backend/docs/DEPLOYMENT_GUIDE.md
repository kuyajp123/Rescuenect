# Rescuenect Production Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Backend Deployment (Render)](#backend-deployment-render)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Mobile App Deployment (Google Play Store)](#mobile-app-deployment-google-play-store)
5. [Firebase & Firestore Security](#firebase--firestore-security)
6. [Environment Variables](#environment-variables)
7. [Security Best Practices](#security-best-practices)
8. [Performance Optimizations](#performance-optimizations)
9. [Monitoring & Logging](#monitoring--logging)
10. [Backup & Disaster Recovery](#backup--disaster-recovery)
11. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Overview

Rescuenect is a disaster management system with three main components:

- **Backend API**: Node.js/Express server with Firebase Admin SDK
- **Frontend Admin Dashboard**: React/TypeScript with HeroUI
- **Mobile App**: React Native (Expo) for residents

**Deployment Stack:**

- Backend: Render (Web Service)
- Frontend: Vercel
- Mobile: Google Play Store
- Database: Firebase Firestore
- Authentication: Firebase Authentication
- Storage: Firebase Storage
- Notifications: Firebase Cloud Messaging (FCM)

---

## Backend Deployment (Render)

### Prerequisites

- Render account
- Firebase service account JSON file
- All environment variables configured

### Step 1: Prepare Backend for Production

#### 1.1 Update package.json scripts

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts"
  }
}
```

#### 1.2 Ensure TypeScript Build Configuration

Verify `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "target": "ES2020",
    "module": "commonjs"
  }
}
```

#### 1.3 Create `.gitignore` (if not exists)

```
node_modules/
dist/
.env
*.log
firebase-service-account.json
```

### Step 2: Deploy to Render

#### 2.1 Create New Web Service

1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `rescuenect-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users (e.g., Singapore for Philippines)
   - **Branch**: `main` or `production`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Standard` (at minimum) or higher for production

#### 2.2 Add Environment Variables

Add all variables from [Environment Variables](#environment-variables) section.

**IMPORTANT**: For Firebase service account:

- Option 1: Use Render's Secret Files feature

  - Create a secret file named `firebase-service-account.json`
  - Paste your service account JSON content
  - Reference in code: `process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'`

- Option 2: Base64 encode the JSON

  ```bash
  # Encode
  cat firebase-service-account.json | base64

  # In code, decode:
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
  );
  ```

#### 2.3 Configure Health Checks

Render will use your `/health` endpoint:

- Health check path: `/health`
- Expected response: 200 OK

#### 2.4 Enable Auto-Deploy

- Enable "Auto-Deploy" from GitHub pushes
- Set up branch protection rules in GitHub

### Step 3: Backend Security Hardening

#### 3.1 CORS Configuration

Update CORS to allow only your production domains:

```typescript
const allowedOrigins = [
  'https://your-frontend.vercel.app',
  'https://rescuenect.com', // Your custom domain
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
```

#### 3.2 Rate Limiting

Ensure rate limiting is configured in production:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

#### 3.3 Helmet for Security Headers

```typescript
import helmet from 'helmet';
app.use(helmet());
```

#### 3.4 Production Logging

Use Winston or similar for production logging:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

### Step 4: Database Connection Health

Monitor Firebase connection:

- Health check endpoint already implemented: `/health/firebase`
- Set up monitoring alerts in Render

---

## Frontend Deployment (Vercel)

### Prerequisites

- Vercel account
- Firebase web config
- Backend API URL

### Step 1: Prepare Frontend

#### 1.1 Environment Variables for Production

Create `.env.production`:

```env
VITE_BACKEND_URL=https://rescuenect-backend.onrender.com
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

#### 1.2 Build Optimization

Update `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@heroui/react'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
});
```

### Step 2: Deploy to Vercel

#### 2.1 Connect Repository

1. Go to Vercel Dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select `Frontend` directory as root

#### 2.2 Configure Build Settings

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `Frontend`

#### 2.3 Add Environment Variables

Add all variables from `.env.production` in Vercel dashboard under:
Settings → Environment Variables

#### 2.4 Custom Domain (Optional)

1. Go to Settings → Domains
2. Add your custom domain (e.g., `admin.rescuenect.com`)
3. Configure DNS records as instructed

#### 2.5 Security Headers

Create `vercel.json` in Frontend root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(self), microphone=(), camera=()"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 3: Performance Optimization

#### 3.1 Enable Vercel Analytics

```bash
npm install @vercel/analytics
```

In `main.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

#### 3.2 Image Optimization

Use Vercel's image optimization or load images from CDN.

#### 3.3 Lazy Loading

Ensure routes are lazy loaded:

```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Status = lazy(() => import('./pages/Status'));
// ... other routes

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    {/* ... */}
  </Routes>
</Suspense>;
```

---

## Mobile App Deployment (Google Play Store)

### Prerequisites

- Google Play Console account ($25 one-time fee)
- Android signing key
- App bundle built with EAS Build
- Privacy policy URL
- App icon and screenshots

### Step 1: Prepare Mobile App

#### 1.1 Update app.config.ts

```typescript
export default {
  expo: {
    name: 'Rescuenect',
    slug: 'rescuenect',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'rescuenect',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    android: {
      package: 'com.rescuenect.mobile',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'NOTIFICATIONS',
      ],
      googleServicesFile: './google-services.json',
    },
    plugins: [
      'expo-router',
      [
        'expo-notifications',
        {
          icon: './assets/images/notification-icon.png',
          color: '#ffffff',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'your-eas-project-id',
      },
    },
  },
};
```

#### 1.2 Configure EAS Build

Create `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./play-store-credentials.json",
        "track": "internal"
      }
    }
  }
}
```

### Step 2: Build for Production

#### 2.1 Install EAS CLI

```bash
npm install -g eas-cli
```

#### 2.2 Configure Project

```bash
cd mobile/client
eas login
eas build:configure
```

#### 2.3 Build App Bundle

```bash
eas build --platform android --profile production
```

This will:

- Generate Android App Bundle (.aab)
- Sign with managed credentials
- Upload to EAS servers

### Step 3: Prepare Play Store Listing

#### 3.1 Required Assets

- **App Icon**: 512x512 PNG (no transparency)
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: At least 2-8 screenshots
  - Phone: 1080x1920 or 1080x2340
  - Tablet (optional): 1536x2048
- **Privacy Policy**: Hosted URL (e.g., on your website)

#### 3.2 Store Listing Information

```
App Name: Rescuenect
Short Description: Emergency status reporting and disaster management for residents
Full Description:
Rescuenect is a mobile application designed to help residents report their emergency status during disasters. Features include:
- Real-time status reporting (Safe, Evacuated, Affected, Missing)
- Location sharing with emergency responders
- Emergency notifications and alerts
- Evacuation center information
- Weather and earthquake updates
- Contact information sharing with authorities

Category: Tools
Content Rating: Everyone
```

### Step 4: Submit to Play Store

#### 4.1 Create App in Play Console

1. Go to Google Play Console
2. Create Application
3. Fill in store listing details
4. Upload graphics assets

#### 4.2 Set Up Testing Track

Start with **Internal Testing**:

1. Go to Testing → Internal testing
2. Create release
3. Upload AAB file from EAS Build
4. Add release notes
5. Add internal testers (up to 100 email addresses)

#### 4.3 Content Rating

1. Go to Content rating
2. Fill out questionnaire
3. Submit for rating

#### 4.4 Target Audience and Content

1. Set target age group
2. Declare ads (if applicable)
3. Privacy policy URL

#### 4.5 App Access

If your app requires login:

1. Provide test credentials
2. Document any special testing instructions

#### 4.6 Submit for Review

1. Complete all required sections
2. Move from Internal → Closed → Open Testing (gradually)
3. Finally submit for Production
4. Review process typically takes 1-7 days

### Step 5: Continuous Updates

#### 5.1 Version Updates

Update version in `app.config.ts`:

```typescript
version: "1.0.1", // Semantic versioning
android: {
  versionCode: 2 // Must increment for each release
}
```

#### 5.2 Build and Submit

```bash
eas build --platform android --profile production
eas submit --platform android --latest
```

---

## Firebase & Firestore Security

### Current Security Concerns

#### ⚠️ CRITICAL: Firestore Security Rules

**Current Status**: Default rules (read/write: true) - **INSECURE FOR PRODUCTION**

### Step 1: Implement Proper Firestore Rules

#### 1.1 Production Security Rules

Create `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Admins collection - only readable by admins themselves
    match /admins/{adminId} {
      allow read: if isAuthenticated() && isOwner(adminId);
      allow write: if false; // Managed through Firebase Admin SDK
    }

    // Status collection - read/write by owner, read by admins
    match /status/{userId}/statuses/{statusId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow delete: if isAdmin();
    }

    // Residents collection - read by admins only
    match /residents/{residentId} {
      allow read: if isAdmin();
      allow write: if false; // Managed through Firebase Admin SDK
    }

    // Evacuation centers - read by all authenticated, write by admins
    match /evacuationCenters/{centerId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Notifications - read/write by owner, create by admins
    match /notifications/{userId}/userNotifications/{notificationId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow create: if isAdmin();
      allow delete: if isOwner(userId);
    }

    // Weather data - read by all authenticated
    match /weather/{docId} {
      allow read: if isAuthenticated();
      allow write: if false; // Managed through cron job
    }

    // Earthquake data - read by all authenticated
    match /earthquakes/{docId} {
      allow read: if isAuthenticated();
      allow write: if false; // Managed through cron job
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### 1.2 Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### Step 2: Firebase Storage Security Rules

Create `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated(); // Check admin role from custom claims
    }

    // Status images - read by authenticated, upload by owner
    match /status/{userId}/{imageId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024 // 10MB limit
                   && request.resource.contentType.matches('image/.*');
    }

    // Evacuation center images - read by all, write by admins
    match /evacuation/{imageId} {
      allow read: if true;
      allow write: if isAdmin()
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // Profile images
    match /profiles/{userId}/{imageId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy storage rules:

```bash
firebase deploy --only storage
```

### Step 3: Firebase Authentication Settings

#### 3.1 Enable Required Sign-in Methods

Firebase Console → Authentication → Sign-in method:

- ✅ Email/Password
- ✅ Google (for admin dashboard)
- Configure authorized domains

#### 3.2 Set Password Policy

- Minimum length: 8 characters
- Require uppercase, lowercase, numbers
- Enable email verification

#### 3.3 Configure Authorized Domains

Add production domains:

- `your-frontend.vercel.app`
- `rescuenect.com`
- `admin.rescuenect.com`

### Step 4: Firebase Admin SDK Security

#### 4.1 Service Account Key Management

- **NEVER** commit service account JSON to version control
- Use environment variables or secret management
- Rotate keys periodically (every 90 days recommended)

#### 4.2 Restrict API Keys

Firebase Console → Project Settings → API keys:

- Restrict API keys to specific websites/apps
- Add referrer restrictions
- Monitor usage

### Step 5: Database Backup Strategy

#### 5.1 Enable Firestore Backups

```bash
# Install gcloud SDK
# Setup scheduled exports
gcloud firestore export gs://your-backup-bucket/

# Create Cloud Scheduler job for daily backups
gcloud scheduler jobs create http firestore-backup \
  --schedule="0 2 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/YOUR_PROJECT/databases/(default):exportDocuments" \
  --message-body='{"outputUriPrefix":"gs://your-backup-bucket/backup-$(date +%Y%m%d)"}' \
  --oauth-service-account-email=your-service-account@project.iam.gserviceaccount.com
```

#### 5.2 Retention Policy

- Keep daily backups for 7 days
- Keep weekly backups for 4 weeks
- Keep monthly backups for 12 months

---

## Environment Variables

### Backend (.env - Render)

```env
# Server Configuration
NODE_ENV=production
PORT=8080

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
# OR use secret file
FIREBASE_SERVICE_ACCOUNT_PATH=/etc/secrets/firebase-service-account.json

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://rescuenect.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=error

# External APIs (if any)
WEATHER_API_KEY=your_weather_api_key
EARTHQUAKE_API_URL=https://earthquake.phivolcs.dost.gov.ph/api
```

### Frontend (.env.production - Vercel)

```env
# Backend API
VITE_BACKEND_URL=https://rescuenect-backend.onrender.com

# Firebase Web Config
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Cloud Messaging
VITE_FIREBASE_VAPID_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# App Configuration
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

### Mobile (.env - in app)

```env
# Backend API
EXPO_PUBLIC_API_URL=https://rescuenect-backend.onrender.com

# Firebase Config (Android)
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:android:abcdef
```

**Note**: For mobile, use `google-services.json` file for Firebase configuration.

---

## Security Best Practices

### 1. Authentication & Authorization

#### ✅ Implemented

- Firebase Authentication for all users
- JWT token verification on backend
- Role-based access (Admin vs Resident)
- Token expiration and refresh

#### 🔧 Recommendations

- [ ] Implement refresh token rotation
- [ ] Add multi-factor authentication (MFA) for admins
- [ ] Set up session timeout (30 minutes idle)
- [ ] Implement account lockout after failed login attempts

### 2. Data Protection

#### ✅ Implemented

- HTTPS/TLS for all communications
- Firebase Admin SDK server-side operations
- Sensitive data stored in environment variables

#### 🔧 Recommendations

- [ ] Encrypt sensitive fields in Firestore (phone numbers, addresses)
- [ ] Implement field-level encryption for PII
- [ ] Regular security audits of database rules
- [ ] Data anonymization for analytics

### 3. API Security

#### ✅ Implemented

- CORS configuration
- Request validation middleware
- Rate limiting
- Authentication middleware

#### 🔧 Recommendations

- [ ] Implement API key rotation
- [ ] Add request signature verification
- [ ] Set up Web Application Firewall (WAF)
- [ ] Implement DDoS protection (Cloudflare/similar)
- [ ] Add request/response payload size limits

### 4. Mobile App Security

#### 🔧 Recommendations

- [ ] Implement certificate pinning
- [ ] Add root detection
- [ ] Implement jailbreak detection
- [ ] Use secure storage for tokens (Expo SecureStore)
- [ ] Obfuscate JavaScript code
- [ ] Enable ProGuard for Android

### 5. Secrets Management

#### ✅ Implemented

- Environment variables for sensitive data
- .gitignore for credential files

#### 🔧 Recommendations

- [ ] Use secret rotation (90-day cycle)
- [ ] Implement secret versioning
- [ ] Use managed secret services (AWS Secrets Manager, Google Secret Manager)
- [ ] Regular audit of who has access to secrets

### 6. Compliance & Privacy

#### 🔧 Required for Production

- [ ] Privacy Policy (GDPR, Data Privacy Act)
- [ ] Terms of Service
- [ ] Cookie consent (if applicable)
- [ ] Data retention policy
- [ ] Right to erasure (delete account feature)
- [ ] Data export feature for users

---

## Performance Optimizations

### Backend Optimizations

#### 1. Database Query Optimization

```typescript
// Use indexed queries
// Create composite indexes in Firestore
// Example: status collection
// Index: (statusType, createdAt DESC)

// Firestore Console → Indexes
// Add composite index:
// Collection: statuses
// Fields: statusType (Ascending), createdAt (Descending)
```

#### 2. Caching Strategy

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120,
});

// Cache evacuation centers
app.get('/api/evacuation/centers', async (req, res) => {
  const cacheKey = 'evacuation_centers';
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  const centers = await getEvacuationCenters();
  cache.set(cacheKey, centers);
  res.json(centers);
});
```

#### 3. Connection Pooling

Already implemented via Firebase Admin SDK connection reuse.

#### 4. Compression

```typescript
import compression from 'compression';
app.use(compression());
```

### Frontend Optimizations

#### 1. Code Splitting

```typescript
// Already implemented with lazy loading
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

#### 2. Image Optimization

```typescript
// Use WebP format
// Implement lazy loading
// Use appropriate image sizes
```

#### 3. Bundle Analysis

```bash
npm run build
npx vite-bundle-visualizer
```

Optimize largest chunks:

- Split vendor bundles
- Remove unused dependencies
- Use dynamic imports

#### 4. Service Worker (PWA)

Implement for offline functionality:

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
});
```

### Mobile Optimizations

#### 1. Image Optimization

```typescript
// Use expo-image for better performance
import { Image } from 'expo-image';

<Image source={{ uri: imageUrl }} contentFit="cover" cachePolicy="memory-disk" />;
```

#### 2. List Performance

```typescript
// Use FlashList instead of FlatList
import { FlashList } from '@shopify/flash-list';
```

#### 3. Reduce Bundle Size

```json
// metro.config.js
module.exports = {
  transformer: {
    minifierConfig: {
      keep_classnames: true,
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
  },
};
```

---

## Monitoring & Logging

### Backend Monitoring

#### 1. Application Monitoring

**Recommended Tools:**

- Sentry (Error tracking)
- New Relic (APM)
- Render built-in metrics

**Setup Sentry:**

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

#### 2. Health Monitoring

```typescript
// Already implemented
GET / health;
GET / health / firebase;
GET / health / full;

// Setup uptime monitoring
// - UptimeRobot (free)
// - Render health checks
```

#### 3. Logging Strategy

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'rescuenect-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Log critical events
logger.error('Failed authentication attempt', { userId, ip });
logger.warn('Rate limit exceeded', { ip });
logger.info('Status created', { userId, statusId });
```

### Frontend Monitoring

#### 1. Analytics

```bash
npm install @vercel/analytics
```

```typescript
import { Analytics } from '@vercel/analytics/react';

<App>
  <Analytics />
</App>;
```

#### 2. Error Tracking

```bash
npm install @sentry/react
```

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

#### 3. Performance Monitoring

```typescript
// Use Vercel Speed Insights
import { SpeedInsights } from '@vercel/speed-insights/react';

<App>
  <SpeedInsights />
</App>;
```

### Mobile Monitoring

#### 1. Crash Reporting

```bash
npm install @sentry/react-native
```

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-dsn',
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,
});
```

#### 2. Performance Monitoring

Use Firebase Performance Monitoring (already integrated).

---

## Backup & Disaster Recovery

### 1. Database Backups

#### Automated Firestore Exports

```bash
# Daily backups
gcloud firestore export gs://rescuenect-backups/$(date +%Y%m%d)

# Setup Cloud Scheduler
gcloud scheduler jobs create http firestore-daily-backup \
  --schedule="0 2 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/YOUR_PROJECT/databases/(default):exportDocuments" \
  --message-body='{"outputUriPrefix":"gs://rescuenect-backups/backup-$(date +%Y%m%d)"}'
```

#### Backup Verification

- Test restore process monthly
- Validate data integrity
- Document restore procedures

### 2. Code Repository

#### Git Best Practices

- Protected branches (main, production)
- Require pull request reviews
- Automated testing before merge
- Tag releases (v1.0.0, v1.0.1, etc.)

#### Backup Strategy

- GitHub as primary (already implemented)
- Consider secondary backup (GitLab mirror)

### 3. Disaster Recovery Plan

#### Recovery Time Objective (RTO): 2 hours

#### Recovery Point Objective (RPO): 24 hours

**Steps:**

1. Restore Firestore from latest backup
2. Redeploy backend from last stable release
3. Redeploy frontend from last stable release
4. Verify all services operational
5. Notify users of any data loss (if applicable)

**Communication Plan:**

- Status page for system status
- Email notifications to admins
- In-app notifications to users

---

## Post-Deployment Checklist

### Pre-Launch

#### Backend

- [ ] All environment variables configured
- [ ] Firebase service account configured
- [ ] CORS restricted to production domains
- [ ] Rate limiting enabled
- [ ] Health checks responding
- [ ] Logging configured
- [ ] Error tracking setup (Sentry)

#### Frontend

- [ ] All environment variables configured
- [ ] API calls pointing to production backend
- [ ] Console logs removed (terser config)
- [ ] Error tracking setup
- [ ] Analytics configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active

#### Mobile

- [ ] Release build tested
- [ ] Crash reporting configured
- [ ] Push notifications tested
- [ ] All APIs pointing to production
- [ ] Store listing complete
- [ ] Privacy policy published

#### Database

- [ ] Firestore security rules deployed
- [ ] Storage security rules deployed
- [ ] Indexes created
- [ ] Backup system configured
- [ ] Admin users configured

### Day 1 Post-Launch

- [ ] Monitor error rates
- [ ] Check server response times
- [ ] Verify all API endpoints
- [ ] Monitor database queries
- [ ] Check authentication flow
- [ ] Test critical user journeys
- [ ] Monitor crash reports

### Week 1 Post-Launch

- [ ] Review error logs daily
- [ ] Analyze user feedback
- [ ] Monitor performance metrics
- [ ] Check backup success
- [ ] Review security logs
- [ ] Update documentation
- [ ] Plan hotfixes if needed

### Ongoing Maintenance

#### Daily

- Check error tracking dashboard
- Monitor uptime
- Review critical alerts

#### Weekly

- Review performance metrics
- Check for security updates
- Review user feedback
- Analyze usage patterns

#### Monthly

- Security audit
- Dependency updates
- Backup verification
- Cost optimization review
- Performance optimization

#### Quarterly

- Disaster recovery drill
- Security penetration testing
- Full system audit
- Rotate secrets/keys
- Review and update documentation

---

## Troubleshooting Guide

### Backend Issues

#### API Not Responding

```bash
# Check Render logs
# Verify health endpoint
curl https://rescuenect-backend.onrender.com/health

# Check environment variables
# Verify Firebase connection
curl https://rescuenect-backend.onrender.com/health/firebase
```

#### Firebase Connection Errors

```bash
# Verify service account credentials
# Check Firestore rules
# Monitor Firebase console for errors
# Check backend logs for specific error messages
```

#### High Response Times

```bash
# Check database indexes
# Review slow query logs
# Enable caching
# Scale up instance size (Render dashboard)
```

### Frontend Issues

#### Build Failures

```bash
# Check environment variables in Vercel
# Verify all dependencies installed
# Check build logs for specific errors
# Test build locally: npm run build
```

#### Runtime Errors

```bash
# Check Sentry error reports
# Verify API endpoints
# Check CORS configuration
# Review browser console logs
```

### Mobile Issues

#### Build Failures

```bash
# Check EAS build logs
eas build:list

# Verify app.config.ts
# Check for dependency conflicts
# Test local build
```

#### Crashes

```bash
# Check Sentry crash reports
# Review device logs
# Test on multiple devices
# Check for API compatibility
```

---

## Security Incident Response Plan

### 1. Incident Detection

Monitor for:

- Unusual API traffic patterns
- Failed authentication attempts spike
- Unexpected database writes
- Error rate increases

### 2. Immediate Response

1. Assess severity (Low/Medium/High/Critical)
2. Isolate affected systems if needed
3. Notify team leads
4. Document incident timeline

### 3. Investigation

- Review logs (last 24-48 hours)
- Identify attack vector
- Determine data exposure
- Check for backdoors

### 4. Containment

- Block malicious IPs
- Rotate compromised credentials
- Patch vulnerabilities
- Update security rules

### 5. Recovery

- Restore from clean backup if needed
- Verify system integrity
- Monitor for recurring issues
- Update security measures

### 6. Post-Incident

- Write incident report
- Update security procedures
- Notify affected users (if required)
- Conduct lessons learned session

---

## Cost Optimization

### Render (Backend)

- **Starter Plan**: $7/month - Good for low traffic
- **Standard Plan**: $25/month - Recommended for production
- Optimize by:
  - Using sleep/wake schedule for non-critical services
  - Efficient query patterns
  - Caching frequently accessed data

### Vercel (Frontend)

- **Hobby Plan**: Free - Good for testing
- **Pro Plan**: $20/month - Recommended for production
- Optimize by:
  - Minimize serverless function calls
  - Use edge caching
  - Optimize build times

### Firebase

- **Spark Plan**: Free - Limited
- **Blaze Plan**: Pay as you go - Recommended
- Optimize by:
  - Efficient database queries
  - Use indexed queries
  - Implement data archiving
  - Set storage lifecycle rules
  - Monitor quota usage

### Total Estimated Monthly Cost

- Backend (Render Standard): $25
- Frontend (Vercel Pro): $20
- Firebase (Blaze - estimated): $20-50
- **Total**: ~$65-95/month

---

## Support & Resources

### Documentation

- Backend API: `/docs/API_DOCUMENTATION.md`
- Firebase: https://firebase.google.com/docs
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Expo: https://docs.expo.dev

### Monitoring Dashboards

- Render: https://dashboard.render.com
- Vercel: https://vercel.com/dashboard
- Firebase: https://console.firebase.google.com
- Sentry: https://sentry.io

### Emergency Contacts

- Backend Issues: [Developer Email]
- Frontend Issues: [Developer Email]
- Database Issues: [DBA Email]
- Security Issues: [Security Team Email]

---

## Conclusion

This deployment guide provides comprehensive instructions for deploying Rescuenect to production. Follow each section carefully and complete all checklist items before going live.

**Remember:**

- Security first - never skip security hardening
- Test thoroughly before production deployment
- Monitor continuously after launch
- Have a rollback plan ready
- Document everything

For questions or issues, refer to the troubleshooting guide or contact the development team.

**Last Updated**: December 18, 2025
**Version**: 1.0.0
