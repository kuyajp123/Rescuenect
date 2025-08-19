# URGENT: Fix Google OAuth 2.0 "Access Blocked" Error

## Your Current Configuration ✅
- ✅ Android Client ID: `554379793893-lba6vgs0lf9egam77li7b36dsc7k0usm.apps.googleusercontent.com`
- ✅ Web Client ID: `554379793893-2e0g1r9lrkiokel1kq7ptg81ttb6k1e3.apps.googleusercontent.com`
- ✅ Package Name: `com.yajeyps.client`
- ✅ Project ID: `lively-metrics-453114-q3`

## The Problem
Google is blocking access because your OAuth consent screen isn't properly configured or your Google account isn't added as a test user.

## IMMEDIATE FIX (Do this RIGHT NOW):

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. **Make sure you're in the correct project**: `lively-metrics-453114-q3`
3. If not selected, click the project dropdown and select `lively-metrics-453114-q3`

### Step 2: Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. If you see "CONFIGURE CONSENT SCREEN", click it
3. Choose **External** (this allows any Google user to sign in during testing)
4. Fill out **REQUIRED** fields:
   ```
   App name: Rescuenect
   User support email: [YOUR EMAIL ADDRESS]
   App logo: [OPTIONAL - skip for now]
   App domain: [LEAVE BLANK]
   Developer contact information: [YOUR EMAIL ADDRESS]
   ```
5. Click **SAVE AND CONTINUE**

### Step 3: Add Scopes (CRITICAL)
1. Click **ADD OR REMOVE SCOPES**
2. Add these scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
3. Click **UPDATE** then **SAVE AND CONTINUE**

### Step 4: Add Test Users (MOST IMPORTANT)
1. In the **Test users** section, click **ADD USERS**
2. Add your Gmail account (the one you're trying to sign in with)
3. Add any other Gmail accounts you want to test with
4. Click **SAVE AND CONTINUE**

### Step 5: Review and Back to Testing
1. Click **BACK TO TESTING** (DON'T publish yet)
2. Your app status should show **Testing**

### Step 6: Verify OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Find your **Android OAuth client** and verify:
   - Package name: `com.yajeyps.client`
   - SHA-1 certificate fingerprint should be filled
3. Find your **Web OAuth client** and add these redirect URIs:
   ```
   http://localhost:8081
   https://auth.expo.io/@yajeyps/client
   client://auth
   exp://localhost:8081
   ```

## If You Don't Have SHA-1 Certificate:

Run this command in your project terminal:

```bash
cd android && ./gradlew signingReport
```

Look for the **debug** keystore SHA-1 and add it to your Android OAuth client.

## Alternative: Use Expo's Certificate

If the above doesn't work, get Expo's certificate:

```bash
expo credentials:manager
```

Select **Android** → your project → **Keystore** → **View SHA-1**

## Test Again:

1. ✅ Your Expo server is already running
2. ✅ Your app configuration is correct
3. ✅ Your client IDs are correct
4. 🔄 **NOW**: Add yourself as a test user in Google Cloud Console
5. 🧪 **TEST**: Try Google Sign-In again

## Debug Information:

When you press the Google Sign-In button, check the console logs to see:
```
554379793893-lba6vgs0lf9egam77li7b36dsc7k0usm.apps.googleusercontent.com
554379793893-2e0g1r9lrkiokel1kq7ptg81ttb6k1e3.apps.googleusercontent.com
```

These should match your client IDs.

## Common Mistakes:
❌ **Wrong project selected** in Google Cloud Console
❌ **No test users added** (most common cause)
❌ **OAuth consent screen not configured**
❌ **Missing required scopes**
❌ **Wrong redirect URIs**

## Why This Happens:
- Your app is in "Testing" mode (correct for development)
- Google only allows **explicitly added test users** to sign in
- OAuth consent screen must be properly configured
- All redirect URIs must be authorized

**The #1 cause of your error is not having your Google account added as a test user!**

Try the fix above and let me know if you still get the error!
