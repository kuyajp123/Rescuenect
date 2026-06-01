# Rescuenect Phase 6A Validation Checklist

Status: Validated; approved to move to Phase 6B
Created: 2026-05-29
Last Updated: 2026-05-30
Related docs:
- `docs/location-expansion-enhancement.md`
- `docs/phase 6.md`

Use this checklist as the go/no-go gate before moving from Phase 6A full dynamic client cutover to Phase 6B production readiness.

Validation result: Phase 6A was validated successfully, including Firestore rules deployment and confirmation that frontend and backend modules are working properly. Phase 6B production readiness is now the active next phase.

## Validation Setup

- [ ] Backend, frontend, mobile, and Supabase function changes are deployed to the target environment.
- [ ] Supabase secrets include `FIREBASE_PROJECT_ID`.
- [ ] Supabase secrets include `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_ADMIN_CREDENTIALS`.
- [ ] Optional: Supabase `CLIENT_DELETION_MAX_JOBS` is set if you want to process more than 5 due deletion jobs per invocation.
- [ ] After validating the direct Firebase processor, old Supabase deletion secrets are removed or ignored: `BACKEND_URL`, `CLIENT_DELETION_CRON_SECRET`, and `CLIENT_DELETION_PROCESS_URL`.
- [ ] Super Admin test account is available through `SUPER_ADMIN_EMAILS`.
- [ ] At least one LGU Admin test account exists through an invitation or approved LGU request.
- [ ] At least one active non-Naic client exists for dynamic coverage testing.
- [ ] A disposable draft or inactive test client exists for scheduled deletion testing.

## Build And Automated Checks

- [ ] Backend build passes.

```powershell
cd C:\Users\Paul\Rescuenect\Backend
npm run build
```

- [ ] Backend tests pass.

```powershell
cd C:\Users\Paul\Rescuenect\Backend
npm test
```

- [ ] Frontend build passes.

```powershell
cd C:\Users\Paul\Rescuenect\Frontend
npm run build
```

- [ ] Mobile TypeScript check passes.

```powershell
cd C:\Users\Paul\Rescuenect\mobile\client
npx tsc --noEmit
```

- [ ] Repository search confirms no active runtime Naic fallback remains.

```powershell
cd C:\Users\Paul\Rescuenect
rg "\|\| 'naic'|\?\? 'naic'|getResidentLocationSelectionForBarangay" Backend/src Frontend/src mobile/client -g '!node_modules'
```

Expected result: no matches.

## Dynamic Client Cutover Audit

- [ ] Super Admin can call the audit endpoint.

```powershell
GET /admin/super/migrations/dynamic-client-cutover-audit
```

Expected result:
- Response includes `summary.collections`.
- Response includes scanned, missing, invalid, eligible, updated, and error counts.
- `dryRun` is `true`.

- [ ] Dry-run cutover does not mutate data.

```powershell
POST /admin/super/migrations/dynamic-client-cutover
Body: { "dryRun": true }
```

Expected result:
- Counts are returned.
- Firestore data remains unchanged.

- [ ] Apply cutover only after audit review.

```powershell
POST /admin/super/migrations/dynamic-client-cutover
Body: { "dryRun": false }
```

Expected result:
- Eligible legacy records are backfilled to `clientId: "naic"`.
- Invalid client references are reported, not silently changed.
- After apply, rerunning the audit returns no blocking invalid references.

## Strict Client Scope Behavior

- [ ] `clients/naic` appears only if the real Firestore client document exists.
- [ ] `ClientModel.listClients()` does not auto-inject Naic.
- [ ] `ClientModel.getClientById("naic")` does not return a seed when the document is missing.
- [ ] LGU Admin routes fail clearly when the admin user has no `clientId`.
- [ ] LGU Admin reads are allowed for `active` and `deletion_scheduled` clients.
- [ ] LGU Admin writes are allowed only for `active` clients.
- [ ] Super Admin routes still work across explicit client IDs.
- [ ] Legacy `ADMIN_EMAILS` no longer grants LGU admin access.
- [ ] `SUPER_ADMIN_EMAILS` still grants Super Admin access.

## Super Admin Scheduled Deletion Flow

- [ ] Active clients cannot be scheduled for deletion.

Expected result:
- API returns a clear error instructing the user to deactivate first.
- UI disables or blocks schedule deletion for active clients.

- [ ] Draft or inactive clients can load deletion preview.

```powershell
GET /admin/super/clients/{clientId}/deletion-preview
```

Expected result:
- Response includes `canScheduleDeletion`.
- Response includes dependency counts for residents, LGU admins, invitations, statuses, centers, announcements, contacts, notifications, boundaries, and client change requests.

- [ ] Draft or inactive clients can be scheduled for deletion.

```powershell
POST /admin/super/clients/{clientId}/schedule-deletion
Body: { "reason": "Phase 6A validation test" }
```

Expected result:
- Client status becomes `deletion_scheduled`.
- Client has `deletionScheduledAt`, `deletionEffectiveAt`, `deletionRequestedBy`, `deletionReason`, and `deletionStatus`.
- Default `deletionEffectiveAt` is about 30 days after scheduling.
- `clientDeletionJobs/{clientId}` is created or updated.
- Email logs show a friendly `lgu_client_deletion_scheduled` notice for LGU admins or invited admins tied to the client.
- Operation log records the schedule action.

- [ ] Scheduled deletion can be cancelled before effective date.

```powershell
POST /admin/super/clients/{clientId}/cancel-deletion
```

Expected result:
- Client status returns to `inactive`.
- Scheduled deletion fields are cleared or marked cancelled.
- Job status becomes `cancelled`.
- Operation log records the cancel action.

- [ ] `DELETE /admin/super/clients/{clientId}` no longer performs direct deletion.

Expected result:
- API returns `405`.
- UI no longer calls this endpoint for normal Super Admin deletion.

## LGU Admin Grace-Period Behavior

For a client in `deletion_scheduled`:

- [ ] LGU Admin dashboard shows a persistent deletion warning banner with the effective date.
- [ ] LGU Admin can still view scoped data.
- [ ] LGU Admin cannot create, update, or delete announcements.
- [ ] LGU Admin cannot create, update, or delete evacuation centers.
- [ ] LGU Admin cannot update/resolved resident statuses.
- [ ] LGU Admin cannot create or cancel client change proposals.
- [ ] Blocked write responses return a clear message and include deletion/client status metadata where available.

## Resident And Mobile Grace-Period Behavior

For a resident under a `deletion_scheduled` client:

- [ ] Mobile home screen shows a deletion warning banner.
- [ ] Resident status creation is blocked.
- [ ] Resident status deletion is blocked.
- [ ] Resident profile/client-dependent writes are blocked.
- [ ] Resident saved-location writes are blocked.
- [ ] Resident signup does not show clients that are not `active`.
- [ ] Mobile bootstrap does not infer Naic from a missing client.
- [ ] Mobile profile barangay choices come from `/mobile/data/locationCoverage`.
- [ ] Mobile weather subscribes using backend-provided `weatherLocationKey`, not barangay or Naic-zone fallback.
- [ ] Mobile notifications do not treat missing `clientId` as Naic.

## Scheduled Deletion Processor

Use only a disposable test client for this section.

- [ ] Supabase `client-deletions-process` processes due jobs directly with Firebase credentials.

Expected result:
- Due jobs are processed.
- Result includes `processed`, `completed`, `failed`, and `jobs`.
- Job status becomes `completed` or `failed` with errors.
- Operation log records due-job processing.
- Render/backend does not need to be awake for scheduled deletion processing.
- Function logs do not show calls to `/internal/scheduled/client-deletions/process`.

- [ ] Due deletion job is safe to retry.

Expected result:
- Re-running the processor after completion does not recreate deleted data.
- Failed jobs can be retried after fixing the cause.

- [ ] Cleanup removes client-scoped operational data.

Expected result:
- Resident `users` docs for the client are removed.
- Firebase Auth resident users are disabled/deleted where supported.
- Status history under residents is removed.
- Evacuation centers are removed.
- Announcements are removed.
- Contacts doc is removed.
- Client boundary doc is removed.
- Client notifications are removed.
- Pending client change requests are removed.
- Pending admin invitations are revoked/deleted.
- LGU admin accounts for the client are removed from the live `admin` collection after being captured in Archive.
- Client document is removed from the live `clients` collection after archive and cleanup succeed.
- `clientArchives/{clientId}` exists with summary, client setup, deletion metadata, and snapshot counts.
- Archive subcollections contain captured LGU admins, invitations, residents, statuses, centers, announcements, contacts, notifications, boundaries, change requests, and LGU request snapshots where they existed.

- [ ] Audit/system history remains.

Expected result:
- Operation logs remain.
- Email logs remain.
- Finalized LGU request summaries remain.
- Deletion job records remain.

## Archive Module Validation

- [ ] Clients table has an `Archive` action above the table.
- [ ] Completed deleted clients no longer appear in the normal Clients table.
- [ ] Archive page lists completed deleted clients from `clientArchives`.
- [ ] Archive detail view shows client details, client setup/settings, barangay coverage count, LGU admins, snapshot counts, and raw archive JSON.
- [ ] Deleting an LGU admin from the live Admins page does not remove the archived LGU admin snapshot.
- [ ] Permanent archive deletion removes `clientArchives/{clientId}` and its archive subcollections.
- [ ] Permanent archive deletion records an operation log.

## Supabase Function Validation

- [ ] New function deploys successfully.

```powershell
cd C:\Users\Paul\Rescuenect\Backend
npx supabase functions deploy client-deletions-process --project-ref qltlmndyktxuzgpvhlid
```

- [ ] Function dependency file includes Firebase Admin imports.

Expected file:
- `Backend/supabase/functions/client-deletions-process/deno.json`

Expected imports:
- `firebase-admin/app`
- `firebase-admin/auth`
- `firebase-admin/firestore`

- [ ] Supabase secrets are set.

```powershell
npx supabase secrets set FIREBASE_PROJECT_ID="<firebase-project-id>" FIREBASE_SERVICE_ACCOUNT_JSON="<service-account-json-or-base64>" --project-ref qltlmndyktxuzgpvhlid
```

- [ ] Supabase function JWT verification remains enabled.

Expected result:
- Scheduled/manual invocations use a valid Supabase authorization token.
- Unauthenticated public calls are rejected before processing jobs.

- [ ] Function invocation reaches Firestore directly.

Expected result:
- Function returns success if no due jobs exist.
- Function returns processed job details if due jobs exist.
- Function logs do not show backend URL or cron-secret errors.
- Function still works when the Render backend is asleep.

- [ ] Daily schedule is configured in Supabase for `client-deletions-process`.
- [ ] Supabase function logs show successful scheduled runs.

## Frontend Super Admin UX

- [ ] Super Admin clients table shows all real clients, including Naic if it exists as a real client doc.
- [ ] Naic has no special deletion block.
- [ ] Deleted clients are shown in Archive, not in the normal Clients table.
- [ ] Delete button wording and modal describe scheduled deletion, not instant delete.
- [ ] Deletion modal shows dependency counts before scheduling.
- [ ] Client details page can schedule deletion for draft/inactive clients.
- [ ] Client details page can cancel scheduled deletion.
- [ ] Client details page disables status/edit actions while deletion is scheduled.
- [ ] Overview client status charts handle `deletion_scheduled` and `deleting`; completed deletions are represented in Archive instead of live client counts.

## Data And Tenant Isolation Checks

- [ ] Tenant-scoped collections have valid `clientId` after migration.
- [ ] Missing `clientId` no longer causes data to appear under Naic.
- [ ] Invalid `clientId` references are visible in migration audit errors.
- [ ] Super Admin notifications remain actionable and not polluted by client weather notifications.
- [ ] LGU Admin notifications are scoped to their own client.
- [ ] Earthquake records are shown to LGU Admins only when their `clientId` is affected.
- [ ] Weather records load by dynamic client weather key.

## Go/No-Go Decision

Move to Phase 6B only when all required items below pass:

- [ ] Backend build and tests pass.
- [ ] Frontend build passes.
- [ ] Mobile TypeScript check passes.
- [ ] Dynamic cutover audit has no blocking invalid client references.
- [ ] No runtime Naic fallback search hits remain.
- [ ] Scheduled deletion preview/schedule/cancel works.
- [ ] LGU Admin writes are blocked during deletion grace period.
- [ ] Resident writes are blocked during deletion grace period.
- [ ] Supabase scheduled deletion function deploys and invokes successfully.
- [ ] Test deletion job processes safely and idempotently.
- [ ] Phase 6B remaining work is limited to production readiness: rules review, monitoring, E2E/integration tests, retention/export planning, and build-warning cleanup.

Decision:

- [x] Approved to move to Phase 6B.
- [ ] Not approved; blockers are listed below.

Blockers:

- None recorded at Phase 6A closeout.
