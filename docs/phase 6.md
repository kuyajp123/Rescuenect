# Phase 6 Plan: Full Dynamic Client Cutover And Production Readiness

## Summary

Phase 6 removes Naic as Rescuenect’s runtime default client and makes all municipality/city clients fully dynamic. Province-wide client support remains out of scope.

Phase 6 will use **strict-after-audit rollout**: first scan and fix missing `clientId` data, then remove runtime Naic fallbacks. Naic becomes a normal client and can be deleted only when inactive/draft and free of blocking operational dependencies.

## Key Changes

### 6A: Dynamic Client Cutover Audit

- Add protected Super Admin migration endpoints:
  - `GET /admin/super/migrations/dynamic-client-cutover-audit`
  - `POST /admin/super/migrations/dynamic-client-cutover`
- Audit tenant-scoped collections for missing or invalid `clientId`:
  - LGU admins, residents/users, statuses, evacuation centers, announcements, contacts, weather/client notifications, client change requests.
- Do not require `clientId` for system-wide logs, system notifications, email logs, Super Admin records, or pending LGU requests before client creation.
- Migration should support `dryRun=true` and return scanned/updated/error counts per collection.
- Existing legacy Naic records may be migrated to `clientId: 'naic'`; after migration, runtime code must stop assuming missing means Naic.

### 6B: Remove Runtime Naic Defaults

- Remove backend runtime fallbacks like `clientId || 'naic'`.
- LGU-scoped operations must require a valid authenticated `admin.clientId`.
- Super Admin operations must use explicit `clientId` params/body where needed.
- `ClientModel` must stop auto-seeding or auto-returning Naic during normal list/get operations.
- Keep Naic creation only as an explicit seed/migration utility, not as runtime fallback behavior.
- Remove temporary LGU admin setup through `ADMIN_EMAILS`; LGU admins should come from request approval or invitations. `SUPER_ADMIN_EMAILS` remains env-based.
- Missing client context should return clear `400` or `403` responses, not silently use Naic.

### 6C: Frontend And Mobile Dynamic Coverage

- Remove runtime static Naic fallbacks from admin and mobile location/map/notification flows.
- Use active client coverage from backend for resident signup, map settings, weather location, and barangay choices.
- If no active clients are available, show an empty/unavailable state instead of Naic.
- Notification filtering must not treat missing `clientId` as Naic.
- Remove old `central_naic` / Naic-zone special-case behavior from active notification and weather matching paths.
- Keep static Naic constants only if needed for legacy migration scripts or inactive compatibility code, not user-facing runtime behavior.

### 6D: Naic Becomes A Normal Client

- Remove backend and frontend hard blocks that say Naic cannot be deleted.
- Apply the same deletion rules to Naic as every other client.
- Client deletion policy:
  - Client must be `draft` or `inactive`.
  - Delete is blocked if operational data still exists: residents, statuses, evacuation centers, announcements, contacts, active weather/earthquake notifications, or pending client requests.
  - LGU admin accounts/invitations may be deactivated/revoked during deletion.
  - Historical logs, finalized LGU requests, finalized client requests, and email logs may remain for audit history.
- Add `GET /admin/super/clients/:clientId/deletion-preview` so the UI can show why deletion is blocked.
- `DELETE /admin/super/clients/:clientId` should return `409` with dependency counts when deletion is blocked.

### 6E: Production Readiness

- Review Firestore/security rules for tenant isolation.
- Add E2E or integration coverage for:
  - Super Admin request/client/admin/log flows.
  - LGU Admin tenant-scoped dashboard flows.
  - Resident signup with multiple active clients.
  - No-Naic-default behavior.
- Add operation log retention/export planning.
- Add monitoring checks for:
  - Supabase scheduled weather job.
  - Supabase earthquake monitor job.
  - SMTP/email failures.
  - Backend health and Firebase health.
- Address existing frontend Recharts circular chunk warnings and large chunk warnings where practical.
- Update docs:
  - Add `docs/phase 6.md`.
  - Update `docs/location-expansion-enhancement.md`.
  - Mark Phase 6A/6B status clearly during rollout.

## Public APIs, Types, And Interfaces

- Add:
  - `GET /admin/super/migrations/dynamic-client-cutover-audit`
  - `POST /admin/super/migrations/dynamic-client-cutover`
  - `GET /admin/super/clients/:clientId/deletion-preview`
- Extend client deletion response shape with dependency counts:
  - `canDelete`
  - `blockingReasons`
  - `dependencies`
- Add shared type:
  - `ClientDeletionPreview`
  - `DynamicClientCutoverAudit`
- Existing `/mobile/data/locationCoverage` remains the active source for mobile/resident location choices.

## Test Plan

- Backend:
  - `npm test`
  - `npm run build`
- Frontend:
  - `npm run build`
- Mobile:
  - `npx tsc --noEmit`
- Required scenarios:
  - Audit detects missing tenant `clientId` values.
  - Migration dry run does not mutate data.
  - Migration apply fixes eligible legacy Naic records.
  - LGU-scoped backend routes fail when `clientId` is missing instead of using Naic.
  - Super Admin can still access all clients explicitly.
  - Resident signup shows only active clients and handles zero active clients.
  - Naic appears as a normal client in Super Admin UI.
  - Naic delete is allowed only when inactive/draft and dependency preview passes.
  - Deleting any client with operational dependencies returns `409`.
  - Mobile map/location/weather flows work for non-Naic clients without Naic fallback.
  - Super Admin notifications and Logs still work after strict client cutover.

## Assumptions And Defaults

- Province-wide clients remain out of scope for Phase 6.
- Strict-after-audit rollout is required; no immediate strict cutover.
- Block delete is the chosen deletion policy for clients with operational dependencies.
- Naic remains protected until the Phase 6 audit/migration passes.
- After Phase 6 cutover, Naic is just another municipality/city client.
- Super Admin access remains controlled by `SUPER_ADMIN_EMAILS`.
- LGU admins are dynamic through approved requests or invitations, not `ADMIN_EMAILS`.
