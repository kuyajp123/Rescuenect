# Phase 6 Plan: Full Dynamic Client Cutover And Production Readiness

Status: Phase 6A validated; Phase 6B production readiness in progress.
Implemented: 2026-05-29
Phase 6B Started: 2026-05-30

## Summary

Phase 6 removes Naic as Rescuenect's runtime default client and makes all municipality/city clients fully dynamic. Province-wide client support remains out of scope.

Phase 6A used a **strict-after-audit rollout**: first scan and fix missing `clientId` data, then remove runtime Naic fallbacks. Naic is now a normal client and uses the same scheduled decommissioning flow as every other municipality/city client. Phase 6A validation has passed, so Phase 6B now owns the remaining production-readiness gate.

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

### 6D: Scheduled Client Decommissioning

- Remove backend and frontend hard blocks that say Naic cannot be deleted.
- Apply the same decommissioning rules to Naic as every other client.
- Replace instant hard-delete with scheduled cascade deletion:
  - Super Admin schedules deletion only after the client is inactive or draft.
  - Client becomes `deletion_scheduled`.
  - Store `deletionScheduledAt`, `deletionEffectiveAt`, `deletionRequestedBy`, `deletionReason`, and `deletionStatus`.
  - Default grace period is 30 days.
  - Super Admin can cancel deletion before `deletionEffectiveAt`.
- During the grace period:
  - LGU admins see a persistent dashboard banner with the deletion date.
  - Residents under that client see a home-screen warning banner.
  - Resident signup for that client remains disabled.
  - LGU admin write operations are blocked; read/export access can remain until deletion.
  - Resident write operations are blocked where they depend on the client, including status creation and client notifications.
- On the effective date:
  - Snapshot the client and client-scoped records into the Archive collection before live cleanup.
  - Disable resident accounts under the client before deleting data.
  - Revoke or clear resident FCM tokens.
  - Delete Firebase Auth resident users where supported by the scheduled processor.
  - Delete Firestore user docs and client-scoped resident data/history for that client.
  - Delete or archive client operational data: statuses, evacuation centers, announcements, contacts, active client notifications, client boundaries, pending proposals, pending invitations, and runtime client config.
  - Remove LGU admin accounts/invitations for the client after preserving them in the archive snapshot.
  - Remove the client document after archive and cleanup succeed.
- Super Admin Archive:
  - List archived client snapshots outside the normal Clients table.
  - Show client details, setup/settings, LGU admins, and captured client-scoped data counts.
  - Allow Super Admin to permanently delete the archive snapshot.
- Notify LGU admins by email as soon as deletion is scheduled, not after the grace period completes.
- Keep audit/system history:
  - operation logs,
  - email logs,
  - finalized LGU request summaries,
  - finalized client request summaries,
  - deletion job records.
- Add `GET /admin/super/clients/:clientId/deletion-preview` so the UI can show affected data counts before scheduling deletion.
- Add `POST /admin/super/clients/:clientId/schedule-deletion`.
- Add `POST /admin/super/clients/:clientId/cancel-deletion`.
- Keep `DELETE /admin/super/clients/:clientId` unavailable for normal Super Admin use or reserve it for internal scheduled cleanup only.
- Use a Supabase scheduled function to process due deletion jobs daily by connecting directly to Firebase/Firestore with service account credentials. This avoids depending on Render uptime for scheduled cleanup.
- Deletion jobs must be idempotent and batch-based so they can resume safely if interrupted.

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
  - Supabase scheduled client deletion job.
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
  - `POST /admin/super/clients/:clientId/schedule-deletion`
  - `POST /admin/super/clients/:clientId/cancel-deletion`
  - `GET /admin/super/client-archives`
  - `GET /admin/super/client-archives/:archiveId`
  - `DELETE /admin/super/client-archives/:archiveId`
  - `POST /internal/scheduled/client-deletions/process` remains available for backend/manual fallback, but the Supabase scheduled function processes due jobs directly through Firebase.
- Extend client deletion preview response shape with affected data counts:
  - `canDelete`
  - `canScheduleDeletion`
  - `warnings`
  - `dependencies`
- Add deletion scheduling fields to `clients/{clientId}`:
  - `status: 'deletion_scheduled' | 'deleting'`; completed deletions move to `clientArchives/{clientId}` and remove the live client document.
  - `deletionScheduledAt`
  - `deletionEffectiveAt`
  - `deletionRequestedBy`
  - `deletionCancelledAt`
  - `deletionStatus`
- Add `clientDeletionJobs/{jobId}` for scheduled cleanup progress.
- Add `clientArchives/{clientId}` for completed deleted-client snapshots and archive review.
- Add shared types:
  - `ClientDeletionPreview`
  - `ClientDeletionJob`
  - `DynamicClientCutoverAudit`
  - `ClientArchiveSummary`
  - `ClientArchive`
- Existing `/mobile/data/locationCoverage` remains the active source for mobile/resident location choices.

## Current Phase 6A Implementation Notes

Phase 6A is now archive-first and no-backend-wakeup for scheduled cleanup.

- The live backend still owns Super Admin actions such as preview, schedule, cancel, archive list/detail, and permanent archive deletion.
- The scheduled deletion processor runs in Supabase as `client-deletions-process`.
- The Supabase function reads `clientDeletionJobs` directly from Firestore, archives due clients into `clientArchives`, deletes live client-scoped data, removes LGU admin docs/Auth users where supported, and marks jobs completed or failed.
- The internal backend route `POST /internal/scheduled/client-deletions/process` remains as a manual/backward fallback, but it is no longer the primary scheduled architecture.
- Deleted clients should no longer remain in the normal `clients` collection after successful processing. They should appear in Archive until Super Admin permanently removes the archive snapshot.

Required Supabase secrets for `client-deletions-process`:

```text
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_JSON
```

`FIREBASE_ADMIN_CREDENTIALS` may be used instead of `FIREBASE_SERVICE_ACCOUNT_JSON` if that is the existing project convention.

Optional Supabase secret:

```text
CLIENT_DELETION_MAX_JOBS
```

Deprecated for the primary Supabase processor:

```text
BACKEND_URL
CLIENT_DELETION_CRON_SECRET
CLIENT_DELETION_PROCESS_URL
```

Those backend URL/cron secrets can be removed from Supabase after the direct Firebase processor is deployed and validated.

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
  - Naic can be scheduled for deletion only when inactive or draft.
  - Deletion preview shows affected residents, admins, statuses, centers, announcements, contacts, notifications, requests, and boundaries.
  - Scheduled deletion can be cancelled before the effective date.
  - LGU admins see deletion warning banner during the grace period.
  - Residents see deletion warning banner during the grace period.
  - Resident and LGU admin write operations are blocked during scheduled deletion.
  - Supabase due deletion job processes directly through Firebase/Firestore while the Render backend is asleep.
  - Due deletion job snapshots client details, setup/settings, LGU admins, and client-scoped records into `clientArchives/{clientId}`.
  - Completed deleted clients disappear from the normal Clients table and appear in Archive.
  - Permanent archive deletion removes the archive snapshot and records an operation log.
  - Due deletion job disables/deletes resident accounts before deleting client-scoped data.
  - Due deletion job revokes FCM tokens and removes client-scoped notifications.
  - Due deletion job is safe to retry after partial failure.
  - Mobile map/location/weather flows work for non-Naic clients without Naic fallback.
  - Super Admin notifications and Logs still work after strict client cutover.

## Assumptions And Defaults

- Province-wide clients remain out of scope for Phase 6.
- Strict-after-audit rollout was required before removing runtime Naic fallbacks.
- Scheduled cascade deletion is the chosen client deletion policy.
- Default deletion grace period is 30 days.
- Resident accounts tied to the deleted client are disabled/deleted on the effective date; residents must create a new account for another active LGU client.
- Audit/system history remains after client operational data is deleted.
- After Phase 6 cutover, Naic is just another municipality/city client and follows the same scheduled deletion/archive flow.
- Super Admin access remains controlled by `SUPER_ADMIN_EMAILS`.
- LGU admins are dynamic through approved requests or invitations, not `ADMIN_EMAILS`.
