# Mobile APK Delivery Setup

Rescuenect can publish the latest resident Android APK to GitHub Release assets from either an Expo EAS build webhook or a Super Admin manual upload.

## How it works

1. EAS finishes an Android build, or a Super Admin uploads an APK from the dashboard.
2. For EAS builds, Expo sends a signed webhook to the backend.
3. The backend verifies the `expo-signature` header with `EAS_WEBHOOK_SECRET`.
4. The backend downloads or receives the APK.
5. The APK is uploaded to a GitHub Release asset.
6. Firestore stores the latest release metadata.
7. The homepage calls `GET /public/mobile-app/latest` and renders the current QR code and download button.

## Backend environment variables

Add these to the deployed backend environment:

```bash
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

## Publish from Super Admin

Open `/settings` as a Super Admin and use the **Mobile App Release** panel.

1. Choose the `.apk` file.
2. Add version and build number if available.
3. Leave build profile and app identifier blank to use the backend environment defaults.
4. Click **Publish APK**.

The upload uses the same GitHub Release asset flow as the EAS webhook. The script below remains available as a fallback.

Mobile App Release panel:
- APK file: the actual Android installer to publish. Required. Must end in .apk.
- Version: the app version users/admins recognize, like 2.1.0. Optional, but recommended.
- Build number: the internal build number, like 8 or 12. Helps distinguish multiple APKs with the same version.
- Build profile: the environment label. Use staging for staging APKs or preview for production-preview APKs. Usually you can leave this blank because Render env already provides the default.
- App identifier: Android package name. For production preview use com.yajeyps.client; for staging use com.yajeyps.client.staging. Usually safe to leave blank if the backend env is configured.

## Publish an existing APK without a new EAS build

If the EAS monthly build limit is reached, you can publish a previously downloaded APK manually.

For staging:

```bash
cd Backend
npm run publish-mobile-apk -- \
  --apk "C:\Users\Paul\Downloads\Rescuenect.apk" \
  --profile staging \
  --app-id com.yajeyps.client.staging \
  --version 2.1.0 \
  --build-number 1 \
  --release-tag mobile-app-staging \
  --release-name "Rescuenect Android APK (staging)"
```

For production homepage APK, use the production app identifier and preview release tag:

```bash
cd Backend
npm run publish-mobile-apk -- \
  --apk "C:\Users\Paul\Downloads\Rescuenect.apk" \
  --profile preview \
  --app-id com.yajeyps.client \
  --version 2.1.0 \
  --build-number 1 \
  --release-tag mobile-app-preview \
  --release-name "Rescuenect Android APK"
```

The script uploads the APK to GitHub Releases and writes the latest metadata document used by
`GET /public/mobile-app/latest`.
