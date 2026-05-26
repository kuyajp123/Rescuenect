# Phase 5 Plan: Stability, Client Settings, Email, Analytics, And Dynamic Earthquake Scope

## Summary

Phase 5 should be split into stability-first subphases. The goal is to harden Phase 4, then add LGU client configuration workflows, email delivery, Super Admin analytics, and finally make the earthquake module client-aware.

Key decisions locked:
- LGU admins submit **proposals**; Super Admin approval applies changes.
- City map bounds use **external boundary/GeoJSON data**, imported and stored.
- Phase 5 order is **stability first**.
- LGU admins still receive weather notifications for their own client.
- Super admins do not receive client weather notifications.

## Key Changes

### 5A: Stability And Tenant Hardening

- Add stronger tenant isolation checks for all LGU-scoped CRUD routes, Firestore reads, notifications, and frontend data subscriptions.
- Keep Super Admin access system-wide; keep LGU Admin access limited to `admin.clientId`.
- Remove remaining temporary Naic behavior only where safe; keep Naic protected until all fallback paths are replaced.
- Add audit fields for Super Admin actions and approved LGU proposals: `createdBy`, `reviewedBy`, `reviewedAt`, `reviewNote`, `appliedAt`.
- Add backend tests for Super Admin versus LGU Admin access, inactive clients, deleted clients, and cross-client denial.

### 5B: Client Map Settings And Boundaries

- Add `clients/{clientId}.mapSettings`:
  - `centerLatitude`, `centerLongitude`
  - `minZoom`, default `13`, allowed `12..13`
  - `zoom`, default `15`, allowed `minZoom..17`
  - `maxZoom`, default `18`, allowed `zoom..18`
  - `maxBounds: { north, south, east, west }`
  - `boundarySource`, `boundaryVerified`, `boundaryUpdatedAt`
- Add `clientBoundaries/{clientId}` or a Storage-backed GeoJSON reference for imported city/municipality boundaries.
- Super Admin imports/reviews external GeoJSON boundary data, and the backend computes the client `maxBounds`.
- LGU Admin maps use their client `mapSettings`; Super Admin maps can view all clients.

### 5C: Email Delivery And Role-Aware Notifications

- Add backend email service using provider-agnostic SMTP through `nodemailer`.
- Required env:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
  - `SMTP_USER`, `SMTP_PASS`
  - `SMTP_FROM`
  - `APP_BASE_URL`
  - `EMAIL_DELIVERY_ENABLED`
- Send email for:
  - LGU access request received.
  - LGU request approved/rejected.
  - LGU admin invitation.
  - LGU change proposal submitted.
  - LGU change proposal approved/rejected.
- Store delivery attempts in `emailLogs` or `emailOutbox`.
- LGU admins continue receiving weather notifications for their assigned `clientId`.
- Super admins are excluded from client weather notifications, including Naic weather notifications.
- Super admins receive only management/system notifications: `system`, `client_request`, `client_change_request`, `admin_invite`, `system_health`.
- Notification subscription logic should filter by role:
  - `super_admin`: no `weather`; system-wide management notifications only.
  - `lgu_admin`: weather and operational notifications where `notification.clientId === admin.clientId`.

### 5D: LGU Client Communication Module

- Add LGU Admin module: **Client Requests** or **LGU Coordination**.
- LGU admins can submit proposals for their own client only:
  - Weather latitude/longitude change.
  - Map settings change.
  - Barangay coverage enable/disable.
  - Submitted client information changes.
  - Invite another LGU admin.
- Store proposals in `clientChangeRequests/{requestId}`:
  - `clientId`
  - `type: weather_coordinates | map_settings | barangay_coverage | client_info | admin_invite | boundary_update`
  - `status: pending | approved | rejected | cancelled`
  - `currentSnapshot`
  - `proposedChanges`
  - `requestedBy`, `requestedAt`
  - review/apply metadata
- Super Admin reviews proposals and approval applies the change to the client record or admin invitation record.

### 5E: Super Admin Analytics And Unified Overview

- Merge **System Status** into the Super Admin **Overview** page.
- Replace `/super/system-status` with a redirect or remove it from the sidebar.
- Add backend `GET /admin/super/overview` returning analytics plus health:
  - client counts by status
  - LGU request counts by status
  - client proposal counts by status/type
  - LGU admin counts
  - active resident counts by client where available
  - backend/Firebase/PSGC/weather/earthquake status
  - latest scheduled-job timestamps where available
- Use Recharts for overview visualizations.
- Keep HeroUI layout and current Super Admin visual style.

### 5F: Dynamic Earthquake Scope

- Replace Naic-only earthquake logic with active-client earthquake scope.
- Load active clients and their earthquake settings:
  - center from client/map settings
  - default radius `150km`
  - default min magnitude `1.5`
  - notification thresholds from current logic
- Fetch USGS earthquakes per active client or through a merged query strategy, dedupe by earthquake id, and compute affected clients.
- Store earthquake records with `affectedClientIds` and per-client distance/relevance metadata.
- Super Admin sees all earthquake events.
- LGU Admin sees only earthquakes where `affectedClientIds` contains their `clientId`.
- Resident and LGU admin earthquake notifications target affected active clients only.
- Replace `distanceFromNaic` display with client-relative distance.

## Public APIs, Types, And Interfaces

- Add backend LGU endpoints:
  - `GET /admin/lgu/client`
  - `GET /admin/lgu/change-requests`
  - `POST /admin/lgu/change-requests`
  - `POST /admin/lgu/change-requests/:id/cancel`
- Add Super Admin endpoints:
  - `GET /admin/super/overview`
  - `GET /admin/super/client-change-requests`
  - `POST /admin/super/client-change-requests/:id/approve`
  - `POST /admin/super/client-change-requests/:id/reject`
  - `POST /admin/super/clients/:clientId/boundary`
- Extend shared types:
  - `ClientMapSettings`
  - `ClientBoundary`
  - `ClientChangeRequest`
  - `EmailDeliveryLog`
  - `SuperAdminOverview`
  - `ClientEarthquakeImpact`
- Extend `ClientLgu` with `mapSettings`, boundary status, and optional earthquake settings.
- Extend notification types with role-aware targeting metadata.

## Test Plan

- Backend: `npm test` from `Backend`.
- Backend build: `npm run build` from `Backend`.
- Frontend build: `npm run build` from `Frontend`.
- Mobile type check: `npx tsc --noEmit` from `mobile/client`.
- Test LGU admins cannot create/read/update proposals for another `clientId`.
- Test proposal approval applies changes only after Super Admin approval.
- Test invalid map zoom settings are rejected.
- Test map bounds are loaded from verified client boundary data.
- Test email service logs attempts when SMTP is disabled and sends through mocked SMTP when enabled.
- Test Super Admin does not receive weather notifications for Naic or any client.
- Test LGU Admin receives weather notifications only for their assigned client.
- Test Super Admin overview returns analytics and health data.
- Test LGU earthquake view only includes affected client events.
- Test Super Admin earthquake view includes all events.
- Test resident signup still shows only active clients.

## Assumptions And Defaults

- LGU client changes are proposal-first for Phase 5 stability.
- External city boundary data is imported and stored by Super Admin; the app should not depend on a live external boundary API at runtime.
- Naic remains protected until all dynamic client fallback behavior is proven stable.
- SMTP is provider-agnostic; any free SMTP-capable provider can be used through env settings.
- LGU admins receive client weather and operational notifications for their own scope.
- Super admins receive management/system notifications only.
- Province-wide coverage remains out of scope.
