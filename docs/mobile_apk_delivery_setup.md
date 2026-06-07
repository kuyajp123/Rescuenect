# Mobile APK Delivery Setup

Rescuenect can publish the latest resident Android APK from an Expo EAS build to GitHub Release assets automatically.

## How it works

1. EAS finishes an Android build.
2. Expo sends a signed webhook to the backend.
3. The backend verifies the `expo-signature` header with `EAS_WEBHOOK_SECRET`.
4. The backend downloads the EAS APK artifact.
5. The APK is uploaded to a GitHub Release asset.
6. Firestore stores the latest release metadata.
7. The homepage calls `GET /public/mobile-app/latest` and renders the current QR code and download button.

## Backend environment variables

Add these to the deployed backend environment:

```bash
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
EAS_WEBHOOK_SECRET=use-a-long-random-secret-at-least-16-chars

MOBILE_APK_GITHUB_TOKEN=github-token-with-repo-contents-write
MOBILE_APK_GITHUB_REPO=kuyajp123/Rescuenect
MOBILE_APK_MAX_BYTES=262144000
```

GitHub release asset options:

```bash
MOBILE_APK_GITHUB_RELEASE_TAG=mobile-app-preview
MOBILE_APK_GITHUB_RELEASE_NAME=Rescuenect Android APK
MOBILE_APK_GITHUB_RELEASE_PRERELEASE=true
```

If `MOBILE_APK_GITHUB_RELEASE_TAG` is omitted, the backend uses `mobile-app-<build-profile>`, for example
`mobile-app-staging` or `mobile-app-preview`.

Optional filters are recommended in production so only the expected EAS builds can update the homepage:

```bash
MOBILE_APK_ALLOWED_EAS_ACCOUNT=your-expo-account-name
MOBILE_APK_ALLOWED_EAS_PROJECT=your-eas-project-name
MOBILE_APK_ALLOWED_BUILD_PROFILE=preview
MOBILE_APK_ALLOWED_APP_IDENTIFIER=your.android.package.name
```

If `MOBILE_APK_ALLOWED_BUILD_PROFILE=preview`, only successful `eas build --platform android --profile preview` builds can publish to the homepage.

Recommended staging values:

```bash
MOBILE_APK_ALLOWED_EAS_ACCOUNT=yajeyps
MOBILE_APK_ALLOWED_EAS_PROJECT=client
MOBILE_APK_ALLOWED_BUILD_PROFILE=staging
MOBILE_APK_ALLOWED_APP_IDENTIFIER=com.yajeyps.client.staging
MOBILE_APK_GITHUB_RELEASE_TAG=mobile-app-staging
MOBILE_APK_GITHUB_RELEASE_NAME=Rescuenect Android APK (staging)
```

Recommended production homepage APK values:

```bash
MOBILE_APK_ALLOWED_EAS_ACCOUNT=yajeyps
MOBILE_APK_ALLOWED_EAS_PROJECT=client
MOBILE_APK_ALLOWED_BUILD_PROFILE=preview
MOBILE_APK_ALLOWED_APP_IDENTIFIER=com.yajeyps.client
MOBILE_APK_GITHUB_RELEASE_TAG=mobile-app-preview
MOBILE_APK_GITHUB_RELEASE_NAME=Rescuenect Android APK
```

## GitHub Releases

Create a GitHub token for the backend. Use a fine-grained token scoped to this repository with:

```text
Contents: Read and write
Metadata: Read-only
```

Save it in the backend environment as:

```bash
MOBILE_APK_GITHUB_TOKEN=your-token
```

The backend creates or reuses a GitHub Release, uploads the APK as an asset, and stores the asset download URL in the
latest release metadata. Supabase Storage is not used for APK files, which avoids the Supabase Free 50 MB upload limit.

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
