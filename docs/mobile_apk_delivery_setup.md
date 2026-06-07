# Mobile APK Delivery Setup

Rescuenect can publish the latest resident Android APK from an Expo EAS build to Supabase Storage automatically.

## How it works

1. EAS finishes an Android build.
2. Expo sends a signed webhook to the backend.
3. The backend verifies the `expo-signature` header with `EAS_WEBHOOK_SECRET`.
4. The backend downloads the EAS APK artifact.
5. The APK is uploaded to the Supabase Storage bucket.
6. Firestore stores the latest release metadata.
7. The homepage calls `GET /public/mobile-app/latest` and renders the current QR code and download button.

## Backend environment variables

Add these to the deployed backend environment:

```bash
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
EAS_WEBHOOK_SECRET=use-a-long-random-secret-at-least-16-chars

MOBILE_APK_BUCKET=mobile-app-releases
MOBILE_APK_MAX_BYTES=262144000
```

Optional filters are recommended in production so only the expected EAS builds can update the homepage:

```bash
MOBILE_APK_ALLOWED_EAS_ACCOUNT=your-expo-account-name
MOBILE_APK_ALLOWED_EAS_PROJECT=your-eas-project-name
MOBILE_APK_ALLOWED_BUILD_PROFILE=preview
MOBILE_APK_ALLOWED_APP_IDENTIFIER=your.android.package.name
```

If `MOBILE_APK_ALLOWED_BUILD_PROFILE=preview`, only successful `eas build --platform android --profile preview` builds can publish to the homepage.

## Supabase Storage

The backend can create or update the bucket automatically with the service role key. You can also provision the buckets
with the migration at `Backend/supabase/migrations/20260607090000_add_mobile_apk_storage_buckets.sql`.

Default buckets:

```text
mobile-app-releases
mobile-app-releases-staging
```

Bucket settings:

```text
Public: true
Allowed MIME types:
- application/vnd.android.package-archive
- application/octet-stream
- application/zip
File size limit: MOBILE_APK_MAX_BYTES
```

Apply the migration to the target Supabase project:

```bash
cd Backend
supabase db push
```

For staging, set `MOBILE_APK_BUCKET=mobile-app-releases-staging`. For production, set
`MOBILE_APK_BUCKET=mobile-app-releases`.

## Expo EAS

The APK profiles in `mobile/client/eas.json` are already configured correctly:

```json
"staging": {
  "distribution": "internal",
  "android": { "buildType": "apk" }
},
"preview": {
  "distribution": "internal",
  "android": { "buildType": "apk" }
}
```

The `production` profile uses `app-bundle`, so the backend will ignore those `.aab` builds. Use `staging` or `preview` for homepage APK downloads.

## Add the EAS webhook

Create an EAS webhook for build events:

```text
Webhook URL: https://your-backend-domain.com/public/mobile-app/eas-webhook
Secret: same value as EAS_WEBHOOK_SECRET
Event: Build
```

Then trigger an APK build:

```bash
cd mobile/client
eas build --platform android --profile preview
```

After the build finishes, check:

```bash
curl https://your-backend-domain.com/public/mobile-app/latest
```

The homepage footer will automatically show the latest APK download button and QR code once the release is available.
