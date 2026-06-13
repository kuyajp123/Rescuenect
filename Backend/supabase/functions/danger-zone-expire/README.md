# Danger Zone Expire Function

Status: Phase 5 scheduled lifecycle processor

## Purpose

`danger-zone-expire` marks due verified danger zones as expired without depending on the backend service being awake.

The function reads `dangerZones` directly from Firestore, finds active verified records where `expiresAt` has passed, marks them expired, appends an audit entry, creates one `danger_zone` notification, and sends FCM to same-client residents.

## Required Secrets

```text
FIREBASE_SERVICE_ACCOUNT_JSON
```

`FIREBASE_ADMIN_CREDENTIALS` can be used instead if that is the configured project convention.

## Optional Secrets

```text
DANGER_ZONE_EXPIRE_MAX_ZONES
```

Default: `50` zones per invocation.

## Schedule

Default production schedule: hourly.

```powershell
cd C:\Users\Paul\Rescuenect\Backend
npx supabase functions deploy danger-zone-expire --project-ref qltlmndyktxuzgpvhlid
npx supabase functions schedule danger-zone-expire --cron "0 * * * *"
```

## Validate

Expected response shape:

```json
{
  "success": true,
  "scanned": 0,
  "expired": 0,
  "notificationsCreated": 0,
  "notificationsSkipped": 0,
  "errors": []
}
```
