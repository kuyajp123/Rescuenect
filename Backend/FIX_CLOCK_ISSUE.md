# 🔧 Fix: Invalid JWT Token Error

## ❌ Error

```
Invalid JWT: Token must be a short-lived token (60 minutes) and in a reasonable timeframe.
Check your iat and exp values in the JWT claim.
```

## 🔍 Root Cause

Your **system clock is out of sync** with Google's servers. Even a few seconds difference can cause JWT token generation to fail.

## ✅ Quick Fix (Choose ONE method)

### Method 1: Synchronize System Clock (RECOMMENDED - Run as Administrator)

1. **Open PowerShell as Administrator** (Right-click → Run as Administrator)
2. Run these commands:

```powershell
# Stop Windows Time service
net stop w32time

# Unregister and re-register the service
w32tm /unregister
w32tm /register

# Start Windows Time service
net start w32time

# Force immediate synchronization
w32tm /resync /force

# Check if successful
w32tm /query /status
```

### Method 2: Manual Time Sync (If Method 1 fails)

1. Press `Win + I` to open Settings
2. Go to **Time & Language** → **Date & Time**
3. Turn OFF "Set time automatically"
4. Wait 5 seconds
5. Turn ON "Set time automatically"
6. Click "Sync now" button
7. **Restart your computer**

### Method 3: Generate New Service Account Key

If clock sync doesn't work, the service account key might be corrupted:

1. Go to [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts?project=lively-metrics-453114-q3)
2. Find service account: `firebase-adminsdk-fbsvc@lively-metrics-453114-q3.iam.gserviceaccount.com`
3. Click the three dots (⋮) → **Manage Keys**
4. Delete OLD key (the one you're currently using)
5. Click **Add Key** → **Create new key** → **JSON**
6. Download the new JSON file
7. Replace `lively-metrics-453114-q3-firebase-adminsdk-fbsvc-dba3bff89c.json` in your Backend folder
8. Restart your server

## 🧪 Verify Fix

After applying the fix, restart your backend server:

```bash
cd Backend
npm run dev
```

You should see:

```
✅ Firebase Admin SDK initialized successfully
✅ Firebase connection verified
```

Instead of:

```
❌ Invalid JWT: Token must be a short-lived token
```

## 🔄 Prevention

To prevent this issue in the future:

1. **Enable automatic time sync** in Windows settings
2. **Check time zone** is set correctly (Asia/Manila for Philippines)
3. **Restart server weekly** to get fresh tokens
4. **Monitor health checks** at `/health/firebase` endpoint

## 🚨 Still Not Working?

If the error persists after trying all methods:

1. **Check your internet connection** - JWT validation requires internet access
2. **Check firewall** - Ensure your server can reach `www.googleapis.com`
3. **Try different network** - Some networks have strict firewall rules
4. **Contact your system admin** - They may need to configure NTP servers

## 📞 Quick Diagnostic Commands

Run these to diagnose the issue:

```powershell
# Check current system time
Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"

# Check Windows Time service status
w32tm /query /status

# Check time source
w32tm /query /source

# Test time server connectivity
w32tm /stripchart /computer:time.windows.com /samples:3
```

## 💡 Why This Happens

JWT (JSON Web Tokens) include:

- `iat` (issued at) - When token was created
- `exp` (expires at) - When token expires (60 minutes later)

If your system clock says it's 2:00 PM but it's actually 2:05 PM:

- Server creates JWT with `iat: 2:00 PM`
- Google sees JWT 5 minutes in the "past"
- Google rejects it as invalid or expired

**Even 30 seconds difference can cause issues!**

---

## 🎯 Expected Result

After fixing the clock:

```
✅ Firebase Admin SDK initialized successfully
📋 Project ID: lively-metrics-453114-q3
✅ Database connected successfully.
server running at http://localhost:4000
🔍 Running initial Firebase health check...
✅ Firebase connection verified
```

Your app will work normally again! 🚀
