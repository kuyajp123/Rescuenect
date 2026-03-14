# Rescuenect

A full-stack disaster response and community safety platform consisting of a **Node.js/Express backend**, a **React (Vite) web admin dashboard**, and an **Expo React Native mobile app**.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Backend](#backend)
- [Frontend (Web Admin)](#frontend-web-admin)
- [Mobile App](#mobile-app)
- [Supabase Edge Functions](#supabase-edge-functions)
- [Environment Variables](#environment-variables)

---

## Project Structure

```
Rescuenect/
├── Backend/          # Express + TypeScript API server
├── Frontend/         # Vite + React admin web dashboard
└── mobile/
    └── client/       # Expo React Native mobile app
```

---

## Tech Stack

| Layer          | Technology                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Backend        | Node.js, Express, TypeScript, Supabase, Firebase Admin, Luxon, Multer                          |
| Frontend       | React, Vite, TypeScript, HeroUI, Framer Motion, TipTap, Supabase JS, Firebase                  |
| Mobile         | Expo (SDK 53), React Native, Expo Router, GlueStack UI, NativeWind, Firebase Messaging, Mapbox |
| Edge Functions | Supabase Edge Functions (Deno)                                                                 |

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Expo CLI** — `npm install -g expo-cli`
- **Android Debug Bridge (ADB)** — required for Android emulator/device testing
- **Supabase CLI** — required for deploying edge functions (`npm install -g supabase`)
- A `.env` file configured in each sub-project (see [Environment Variables](#environment-variables))

---

## Backend

Located in `Backend/`.

### Install dependencies

```bash
cd Backend
npm install
```

### Scripts

| Command               | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `npm run dev-backend` | Start development server with hot-reload (ts-node-dev) |
| `npm run build`       | Compile TypeScript to `dist/`                          |
| `npm start`           | Run compiled production server (`dist/src/server.js`)  |

### Development

```bash
npm run dev-backend
```

The server runs on `http://localhost:3000` by default.  
API routes are split into three groups: **admin**, **mobile**, and **unified** (shared).

---

## Frontend (Web Admin)

Located in `Frontend/`.

### Install dependencies

```bash
cd Frontend
npm install
```

### Scripts

| Command                     | Description                                         |
| --------------------------- | --------------------------------------------------- |
| `npm run dev` / `npm start` | Start Vite dev server                               |
| `npm run build`             | Production build (TypeScript compile + Vite bundle) |
| `npm run preview`           | Preview production build locally                    |
| `npm run lint`              | Run ESLint                                          |

### Development

```bash
npm run dev
```

The app runs on `http://localhost:5173` by default (Vite default port).  
Make sure the backend server is running first, as the web app makes API requests to it.

---

## Mobile App

Located in `mobile/client/`.

### Install dependencies

```bash
cd mobile/client
npm install
```

### Scripts

| Command                      | Description                       |
| ---------------------------- | --------------------------------- |
| `npm start` / `expo start`   | Start Expo dev server             |
| `npm run android`            | Launch on Android emulator/device |
| `npm run ios`                | Launch on iOS simulator           |
| `npx expo start --localhost` | Start in offline/localhost mode   |

### Running on a physical device

1. Install **App apk** on your device.
2. Start the dev server:
   ```bash
   npm start
   ```
3. Scan the QR code shown in the terminal with Expo Go.

### Running on an Android emulator

```bash
npm run android
```

If the app cannot reach the dev server, reverse the Metro bundler port via ADB:

```bash
adb reverse tcp:8081 tcp:8081
```

And enter port 8081 in URL input in Expo Go

```bash
http://localhost:8081
```

### Running in offline / localhost mode

```bash
npx expo start --localhost
```

---

## Supabase Edge Functions

Located in `Backend/supabase/functions/`. Functions are written in Deno TypeScript.

Available functions:

| Function                        | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `earthquake-monitor`            | Monitor and broadcast earthquake alerts  |
| `weather-realtime`              | Real-time weather data ingestion         |
| `weather-hourly`                | Hourly weather updates                   |
| `weather-daily`                 | Daily weather summaries                  |
| `weather-forecast-notification` | Push notifications for weather forecasts |
| `weather-tomorrow-notification` | Next-day weather notifications           |
| `unified-weather-notification`  | Consolidated weather push notifications  |
| `status-expire`                 | Expire outdated status records           |
| `status-cleanup`                | Clean up old status entries              |
| `notification-cleanup`          | Clean up old notification records        |

### Deploy a function

```bash
cd Backend
npx supabase functions deploy <function-name>
```

---

## Environment Variables

Each sub-project requires its own `.env` file.

### Backend — `Backend/.env`

```env
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Frontend — `Frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
```

### Mobile — `mobile/client/.env`

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Replace all placeholder values (`your_...`) with your actual credentials before running any sub-project.
