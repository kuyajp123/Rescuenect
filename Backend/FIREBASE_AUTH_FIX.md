# Firebase Admin SDK - ACCESS_TOKEN_EXPIRED Fix

## 🔍 Problem

Your Firebase Admin SDK kept showing `ACCESS_TOKEN_EXPIRED` errors every few days, even with a brand new service account key.

## ✅ Root Cause

The issue is **NOT** with your service account key. Service account keys don't expire unless manually deleted.

The real issue:

1. **Access tokens expire after ~1 hour** - Firebase Admin SDK generates short-lived OAuth2 access tokens from your service account key
2. **Token refresh failures** - On long-running Node.js servers, the automatic token refresh can fail silently
3. **No retry mechanism** - When auth fails, operations immediately error without attempting to refresh

## 🛠️ Solution Implemented

### 1. Enhanced Firebase Initialization (`firestoreConfig.ts`)

- ✅ Explicit project ID configuration
- ✅ Retry logic for initialization failures
- ✅ Periodic health checks every 30 minutes
- ✅ Automatic token refresh verification

### 2. Retry Wrapper (`withRetry` function)

- ✅ Automatically retries failed operations up to 2 times
- ✅ Detects auth errors (code 16, UNAUTHENTICATED, ACCESS_TOKEN_EXPIRED)
- ✅ Exponential backoff between retries
- ✅ Attempts to refresh access token before retry

### 3. Health Check System

New endpoints for monitoring:

- `GET /health` - Basic server health
- `GET /health/firebase` - Firebase connection status
- `GET /health/full` - Comprehensive system health

### 4. Updated Models

All critical database operations now use `withRetry`:

- ✅ `ConfigModels.updateFcmToken()`
- ✅ `UserDataModel.updateFcmToken()`
- ✅ `UserDataModel.removeFcmToken()`
- ✅ `ResidentsModel.getResidents()`

## 📊 Monitoring

### Test Firebase Connection

```bash
curl http://localhost:4000/health/firebase
```

Expected response (healthy):

```json
{
  "status": "ok",
  "firebase": "connected",
  "responseTime": "125ms",
  "timestamp": "2025-12-12T10:58:00.000Z"
}
```

Expected response (unhealthy):

```json
{
  "status": "error",
  "firebase": "disconnected",
  "message": "Firebase authentication failed",
  "timestamp": "2025-12-12T10:58:00.000Z"
}
```

### Full System Health

```bash
curl http://localhost:4000/health/full
```

Response includes:

- Server uptime
- Memory usage
- Firebase connection status
- Project ID
- Credential type
- Response time

## 🔄 Automatic Recovery

The system now:

1. **Checks health every 30 minutes** - Proactively detects auth issues
2. **Auto-retries on failure** - Up to 2 additional attempts with exponential backoff
3. **Refreshes tokens** - Attempts to get fresh access tokens before giving up
4. **Logs detailed errors** - Easier to diagnose issues

## 🚨 If Errors Still Occur

### Quick Fixes

1. **Restart the server** - Sometimes a fresh start resolves stale connections
2. **Check system clock** - Ensure server time is accurate (affects token validation)
3. **Verify network** - Ensure server can reach Google APIs (firestore.googleapis.com)

### Check Service Account Permissions

Go to [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts):

1. Navigate to your project: `lively-metrics-453114-q3`
2. Find service account: `firebase-adminsdk-fbsvc@...`
3. Ensure it has these roles:
   - ✅ Firebase Admin SDK Administrator Service Agent
   - ✅ Cloud Datastore User (or Firebase Admin)
   - ✅ Service Account Token Creator (if using impersonation)

### Monitor Logs

Watch for these log messages:

- ✅ `✅ Firebase connection verified` - Everything working
- ⚠️ `⚠️ Operation failed with auth error. Retrying...` - Auto-recovery in progress
- ❌ `🔐 Authentication error detected` - Persistent auth issue

### Generate New Key (Last Resort)

Only if the issue persists after all checks:

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Select your service account
3. Keys tab → Add Key → Create new key → JSON
4. Replace the JSON file in your backend
5. Restart the server

## 📈 Performance Impact

The retry mechanism adds minimal overhead:

- **Normal operations**: 0ms overhead (direct pass-through)
- **On auth failure**: 2-4 seconds for retries (prevents total failure)
- **Health checks**: Every 30 minutes (< 200ms per check)

## 🔒 Security Notes

- Service account key file contains sensitive credentials
- **Never commit** the JSON file to git
- Keep the file secure with restricted file permissions
- Rotate keys periodically (every 90 days recommended)

## 📝 Next Steps

1. ✅ Monitor `/health/firebase` endpoint regularly
2. ✅ Set up alerting if health checks fail
3. ✅ Consider implementing key rotation schedule
4. ✅ Test the auto-recovery by stopping/starting the server

## 🎯 Expected Behavior Now

- Server starts → Health check runs → "✅ Firebase connection verified"
- Every 30 minutes → Health check runs → Verifies connection
- On auth error → Auto-retry (up to 2 times) → Refresh token → Success
- If all retries fail → Clear error logs → Manual intervention needed

## 📞 Troubleshooting Commands

```bash
# Test basic health
curl http://localhost:4000/health

# Test Firebase connection
curl http://localhost:4000/health/firebase

# Full system diagnostics
curl http://localhost:4000/health/full

# Check server logs
# Watch for "Firebase connection verified" every 30 minutes
```

---

## ⚡ Why This Works

1. **Proactive Monitoring**: Health checks detect issues before they affect users
2. **Automatic Recovery**: Retries handle transient auth failures
3. **Token Refresh**: Forces SDK to get fresh access tokens
4. **Detailed Logging**: Easy to identify and diagnose issues
5. **No User Impact**: Retries happen transparently

The `ACCESS_TOKEN_EXPIRED` errors should now be automatically handled, and your system will recover without manual intervention!
