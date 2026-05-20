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

| Command                          | Description                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev-backend`            | Start development server with hot-reload (ts-node-dev)                         |
| `npm run dev-backend:local`      | Start development server with local env config; falls back to staging Firebase |
| `npm run dev-backend:staging`    | Start development server with staging Firebase/env config                      |
| `npm run dev-backend:production` | Start development server with production Firebase/env config                   |
| `npm run build`                  | Compile TypeScript to `dist/`                                                  |
| `npm start`                      | Run compiled production server (`dist/src/server.js`)                          |

### Development

```bash
npm run dev-backend
```

For local mobile testing with `mobile/client/.env` set to `APP_ENV=local`, run the matching backend environment:

```bash
npm run dev-backend:local
```

Backend environment mapping:

| Environment  | Command                          | Env file behavior                                                                    |
| ------------ | -------------------------------- | ------------------------------------------------------------------------------------ |
| `local`      | `npm run dev-backend:local`      | Uses `Backend/.env.local` if present, otherwise falls back to `Backend/.env.staging` |
| `staging`    | `npm run dev-backend:staging`    | Uses `Backend/.env.staging`                                                          |
| `production` | `npm run dev-backend:production` | Uses `Backend/.env.production` if present, otherwise falls back to `Backend/.env`    |

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

### Android phone setup and local dev client

Use this flow when testing the mobile app on a real Android phone from your local machine.

1. Connect phone by USB.
2. Enable **Developer options** on the phone.
3. Enable **USB debugging**.
4. Enable **Install via USB** if your phone has that setting.
5. Keep the phone unlocked and accept the **Allow USB debugging** prompt.
6. Confirm ADB can see the phone:

   ```bash
   adb devices -l
   ```

7. Build and install the local development client on the phone:

   ```bash
   npx expo run:android --device
   ```

   If multiple devices are listed, pass the device id:

   ```bash
   npx expo run:android --device <device-id>
   ```

8. After the dev client is installed, start Metro over the local network:

   ```bash
   npx expo start --dev-client --lan
   ```

9. Open the installed Rescuenect dev app on the phone or scan the QR code from the terminal.

For local backend testing, `mobile/client/.env` should point to your computer's LAN IP:

```env
APP_ENV=local
EXPO_PUBLIC_BACKEND_URL=http://<your-computer-lan-ip>:4000
```

When the mobile app uses `APP_ENV=local`, it uses the local backend URL and the staging Firebase app. Start the backend with the matching local environment so Google Sign-In and Firebase custom tokens use the same project:

```powershell
cd Backend
npm run dev-backend:local
```

If installation fails with `INSTALL_FAILED_USER_RESTRICTED`, check the phone's Developer options and make sure **Install via USB** is enabled.

### wireless installation step

Use this when Wireless debugging is enabled and the dev client is not installed yet.

1. Connect the computer and phone to the same Wi-Fi/LAN.
2. On the phone, open **Developer options** -> **Wireless debugging** -> **Pair device with pairing code**.
3. Pair the phone from PowerShell using the pairing IP, port, and code shown on the phone:

   ```bash
   adb pair <phone-ip>:<pairing-port>
   ```

4. Go back to the main **Wireless debugging** screen and connect using the wireless debugging IP and port:

   ```bash
   adb connect <phone-ip>:<debug-port>
   ```

5. Confirm ADB can see the wireless device:

   ```bash
   adb devices -l
   ```

6. Build and install the local development client on the wireless device:

   ```bash
   cd mobile/client
   npx expo run:android --device
   ```

   If multiple devices are listed, pass the wireless device id:

   ```bash
   npx expo run:android --device <phone-ip>:<debug-port>
   ```

7. Start Metro over the local network:

   ```bash
   npx expo start --dev-client --lan
   ```

8. Open the installed Rescuenect dev app on the phone or scan the QR code from the terminal.

Keep `EXPO_PUBLIC_BACKEND_URL` pointed at your computer's LAN IP when testing the local backend. Do not use `localhost` on a physical phone because it points to the phone itself, not your computer.

### Wireless Android testing

Use this after the dev client is already installed on the phone.

1. Connect the computer and phone to the same Wi-Fi/LAN.
2. Start Metro in LAN mode:

   ```bash
   npx expo start --dev-client --lan
   ```

3. Open the Rescuenect dev app on the phone.
4. Scan the QR code or let the dev client connect to the Metro URL.

Keep `EXPO_PUBLIC_BACKEND_URL` pointed at your computer's LAN IP when testing the local backend. Do not use `localhost` on a physical phone because it points to the phone itself, not your computer.

If LAN discovery does not work, reconnect with USB and run:

```bash
adb reverse tcp:8081 tcp:8081
npx expo start --dev-client --localhost
```

### Installing staging and production-preview APKs

Use these commands when Wireless debugging is connected and you want to build/install locally without uploading the project to Expo. These release installs do not need Metro after installation.

Confirm ADB can see the wireless device:

```bash
adb devices -l
```

Use the device id from `adb devices -l` in the `--device` value below, for example `<phone-ip>:<debug-port>`.

Build and install the dev client app locally:

```powershell
cd C:\Users\Paul\Rescuenect\mobile\client
npx expo run:android --device
"choose network devices"
```

Build and install the staging app locally:

```powershell
cd mobile/client
$env:APP_ENV="staging"
$env:EXPO_PUBLIC_BACKEND_URL="https://rescuenect-staging-api.onrender.com"
npx expo prebuild --platform android --clean
npx expo run:android --variant release --device <phone-ip>:<debug-port>
```

Build and install the production-preview app locally:

```powershell
cd mobile/client
$env:APP_ENV="production-preview"
$env:EXPO_PUBLIC_BACKEND_URL="https://rescuenect-backend.onrender.com"
npx expo prebuild --platform android --clean
npx expo run:android --variant release --device <phone-ip>:<debug-port>
```

Use EAS cloud builds only when you want Expo to build a shareable install link or APK:

```bash
cd mobile/client
eas build --platform android --profile staging
eas build --platform android --profile preview
```

If you download an APK from EAS, you can install it over wireless ADB:

```bash
adb install -r path/to/app.apk
```

Do not use `eas build --local` on Windows. Android local EAS builds require macOS or Linux.

Package behavior:

- `staging` installs as `com.yajeyps.client.staging` and points to the staging backend.
- `preview` installs as `com.yajeyps.client` and points to the production backend.
- `preview` and `production` use the same package name, so they replace each other on the same phone.
- `staging` can be installed beside `preview` or `production`.

### Running on an Android emulator

```bash
npm run android
```

If the app cannot reach the dev server, reverse the Metro bundler port via ADB:

```bash
adb reverse tcp:8081 tcp:8081
```

On Windows, `npx expo start --localhost` can bind Metro to IPv6 loopback (`::1`), which does not always work cleanly with `adb reverse tcp:8081 tcp:8081`. If you see `unexpected end of stream on http://localhost:8081/...`, stop Metro and restart it in LAN mode instead:

```bash
npx expo start --dev-client --lan
```

Then open the development build again on the emulator.

### Running in offline / localhost mode

```bash
npx expo start --localhost
```

### EAS build profiles

Mobile builds are selected with `eas.json` profiles. The profile decides which environment variables are available during the EAS cloud build, and `app.config.ts` uses `APP_ENV` to choose the Android package name and Firebase `google-services` file.

| Profile       | Purpose                                                     | Backend                                       | Firebase / package                                            |
| ------------- | ----------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| `development` | Custom dev client for local development                     | Local `.env` when running Metro               | Usually local/staging Firebase, depending on the built client |
| `staging`     | Internal APK for staging QA                                 | `https://rescuenect-staging-api.onrender.com` | Staging Firebase, `com.yajeyps.client.staging`                |
| `preview`     | Internal APK for testing production behavior before release | `https://rescuenect-backend.onrender.com`     | Production Firebase, `com.yajeyps.client`                     |
| `production`  | Play Store release build                                    | `https://rescuenect-backend.onrender.com`     | Production Firebase, `com.yajeyps.client`                     |

Recommended EAS cloud commands:

```bash
cd mobile/client

# Local development with an installed dev client
npx expo start --dev-client --lan

# Build staging APK
eas build --platform android --profile staging

# Build production-preview APK
eas build --platform android --profile preview

# Build production Android App Bundle
eas build --platform android --profile production
```

For local wireless release installs that do not upload to Expo, use the staging and production-preview commands in [Installing staging and production-preview APKs](#installing-staging-and-production-preview-apks).

Important notes:

- `env` values inside `eas.json` are used during that EAS build. They do not create permanent Expo dashboard environment variables.
- Local `.env` values are used by Metro when running `npx expo start --dev-client`.
- Native Firebase config is baked into the built app. Changing `google-services.json` or `staging-google-services.json` requires a new EAS build.
- The staging Firebase Android app package name must match `com.yajeyps.client.staging` exactly.

---

## Supabase Edge Functions

Located in `Backend/supabase/functions/`. Functions are written in Deno TypeScript.

Available functions:

| Function                       | Purpose                                                    |
| ------------------------------ | ---------------------------------------------------------- |
| `earthquake-monitor`           | Monitor and broadcast earthquake alerts                    |
| `earthquake-test`              | Simulate sending and saving a mock earthquake notification |
| `weather-realtime`             | Real-time weather data ingestion                           |
| `weather-hourly`               | Hourly weather updates                                     |
| `weather-daily`                | Daily weather summaries                                    |
| `unified-weather-notification` | Consolidated weather push notifications                    |
| `status-expire`                | Expire outdated status records                             |
| `status-cleanup`               | Clean up old status entries                                |
| `notification-cleanup`         | Clean up old notification records                          |

### Deploy a function

```bash
cd Backend
npx supabase functions deploy <function-name>
```

### Local Testing for Edge Functions (e.g. `earthquake-test`)

1. **Start containerization** (e.g. start docker):

   ```bash
   docker-compose up -d
   ```

2. **Serve the function locally** (injecting variables from your `.env` file):

   ```bash
   cd Backend
   npx supabase functions serve earthquake-test --env-file .env --no-verify-jwt
   ```

3. **Invoke the function** using an HTTP client like Postman or PowerShell's `Invoke-RestMethod`.
   _Note: `earthquake-test` requires your `SUPABASE_SERVICE_KEY` in the `Authorization` header._

   **PowerShell Example:**

   ```powershell
   Invoke-RestMethod -Uri "http://127.0.0.1:54321/functions/v1/earthquake-test" `
     -Method Post `
     -ContentType "application/json" `
     -Headers @{ Authorization="Bearer <YOUR_SUPABASE_SERVICE_KEY_HERE>" } `
     -Body (@{ audience="admin"; sendPush=$true; saveNotification=$true; magnitude=5.4; place="TEST: Naic, Cavite"; latitude=14.32; longitude=120.84; depth=12; tsunami_warning=$false } | ConvertTo-Json)
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
