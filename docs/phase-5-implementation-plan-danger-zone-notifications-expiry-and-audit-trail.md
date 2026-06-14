# Phase 5 Implementation Plan: Danger-Zone Notifications, Expiry, and Audit Trail

## Summary

Phase 5 adds lifecycle awareness to danger zones without changing routing logic.

Deliverables:
- Danger-zone lifecycle notifications for same-client residents.
- Optional admin-controlled expiry for verified danger zones.
- Scheduled expiry processing through Supabase Edge Function.
- Admin audit visibility for verify, reject, edit, resolve, and expire actions.
- Mobile notification support for `danger_zone` alerts with a “View on map” action.
- No new routing provider, no geofenced targeting, and no resident inbox redesign.

## Key Changes

### Backend and Data Model

Extend `dangerZones` records with optional lifecycle fields:

```ts
expiresAt?: FirebaseFirestore.Timestamp | null;
expiredBy?: string | null;
expiredAt?: FirebaseFirestore.Timestamp | null;
expiryNotifiedAt?: FirebaseFirestore.Timestamp | null;
lastEditedBy?: string | null;
lastEditedAt?: FirebaseFirestore.Timestamp | null;
notificationAudit?: Record<string, FirebaseFirestore.Timestamp | null>;
auditTrail?: Array<{
  action: "created" | "verified" | "rejected" | "updated" | "resolved" | "expired";
  actorId: string;
  actorRole: "resident" | "lgu_admin" | "super_admin" | "system";
  at: FirebaseFirestore.Timestamp;
  note?: string | null;
  changes?: Record<string, unknown>;
}>;
```

Extend existing admin danger-zone APIs:
- `POST /admin/danger-zones/createOfficial` accepts `expiresAt?: string | null`.
- `PATCH /admin/danger-zones/verifyReport` accepts `expiresAt?: string | null`.
- `PATCH /admin/danger-zones/updateZone` accepts `expiresAt?: string | null`.
- Existing `rejectReport` and `resolveZone` keep their route shape but append audit entries.
- `expiresAt` is optional, must be future-dated when provided, and can be cleared with `null` while a zone is still verified and active.

Add `DangerZoneNotificationService`:
- Use notification type `danger_zone`.
- Store records in the existing `notifications` collection.
- Send FCM through the existing Firebase Admin messaging pattern.
- Target all residents with the same `clientId`.
- Do not perform barangay or geometry-based geofencing in Phase 5.

Notification events:
- `report_verified`: resident report becomes verified.
- `official_created`: LGU creates an official zone, except major road-segment cases.
- `road_segment_blocked`: line/road-segment zone is created or updated as `high` or `critical`.
- `resolved`: verified active zone is marked resolved.
- `expired`: scheduled expiry marks the zone expired.

Notification payload shape:

```ts
{
  type: "danger_zone";
  audience: "users";
  clientId: string;
  location: string;
  barangays: [];
  data: {
    notificationCategory: "danger_zone";
    eventType: "report_verified" | "official_created" | "road_segment_blocked" | "resolved" | "expired";
    dangerZoneId: string;
    status: DangerZoneStatus;
    severity: DangerZoneSeverity;
    geometryType: DangerZoneGeometryType;
    dangerType: string;
    expiresAt?: string | null;
    actionPath: "/evacuation";
  };
}
```

Use deterministic notification IDs or `notificationAudit` checks so the same lifecycle event is not sent twice.

### Scheduled Expiry

Add Supabase Edge Function `danger-zone-expire`.
- Follow the direct Firebase processor pattern used by `client-deletions-process`.
- Query verified active zones where `expiresAt <= now`.
- Mark each due zone as `status: "expired"` and `isActive: false`.
- Set `expiredBy: "system"`, `expiredAt`, `updatedAt`, and append an `expired` audit entry.
- Send one `danger_zone` expired notification and set `expiryNotifiedAt`.
- Default schedule: hourly.
- Add/confirm Firestore composite index for `dangerZones: status ASC, isActive ASC, expiresAt ASC`.

Zones with no `expiresAt` remain active until an LGU admin resolves them.

### Admin Web

Update the existing `/danger-zones` module:
- Add optional expiry controls to create, verify, and edit flows.
- Presets: `6 hours`, `12 hours`, `24 hours`, `3 days`, `7 days`, `Custom`, and `No expiry`.
- Show expiry state in list/details: no expiry, active until date, expired date.
- Show audit timeline in details modal.
- Show notification confirmation states after verify, create, resolve, and expiry-related actions when available.
- Keep existing expired filter and ensure expired zones cannot be edited or resolved again.

### Mobile App

Update notification types and screens:
- Add `danger_zone` to mobile notification type unions.
- Use a warning/triangle-style icon and danger-zone-specific colors.
- Notification list meta text should show danger type or LGU location instead of raw `clientId`.
- Notification details should show event type, severity, status, description snippet if present, and expiry date if present.
- Add `View on map` action that routes to `/evacuation?dangerZoneId=...`.
- Extend evacuation screen/map to focus and open the selected verified danger zone when `dangerZoneId` is provided and the zone is still public.
- If the zone is resolved or expired, show a friendly message that it is no longer active.

## Test Plan

Backend:
- `npm run build` in `Backend`.
- `npm test` in `Backend`.
- Verify invalid/past `expiresAt` is rejected and `null` clears expiry.
- Verify create, verify, update, reject, resolve, and expire append correct audit entries.
- Verify same-client resident targeting and FCM invalid-token cleanup.
- Verify duplicate lifecycle events do not create duplicate notifications.
- Verify expired zones disappear from public danger-zone reads and routing danger-zone inputs.
- Verify zones without `expiresAt` are ignored by the expiry processor.

Admin web:
- `npm run build` in `Frontend`.
- Confirm expiry controls appear in create, verify, and edit flows.
- Confirm optional expiry can be set, changed, cleared, and displayed.
- Confirm audit timeline renders lifecycle actions clearly.
- Confirm expired zones appear in the expired filter and cannot be edited as active zones.

Mobile:
- `npx tsc --noEmit` in `mobile/client`.
- Targeted ESLint for touched notification and evacuation files.
- Confirm `danger_zone` notifications render in list/detail views.
- Confirm `View on map` opens evacuation map and focuses the zone when active.
- Confirm resolved/expired notification map action handles inactive zones gracefully.
- Confirm existing weather, earthquake, announcement, and status notifications still work.

## Assumptions

- Expiry is optional, per user choice.
- Notifications go to all residents in the same LGU client, per user choice.
- No barangay targeting, map-radius targeting, or geofenced push targeting in Phase 5.
- `danger_zone` is a new explicit notification type, not an `emergency` subtype.
- Supabase Edge Function is preferred for expiry so scheduled processing does not depend on backend uptime.
- Phase 5 does not change Mapbox, OpenRouteService, route scoring, or road-condition behavior except that expired zones stop appearing publicly and stop affecting route avoidance.
