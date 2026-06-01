# Rescuenect Phase 6B Production Readiness Checklist

Status: Passed
Created: 2026-05-30
Validated: 2026-06-01
Related docs:
- `docs/location-expansion-enhancement.md`
- `docs/phase 6.md`
- `docs/rescuenect-phase-6a-validation-checklist.md`

Use this checklist as the production-readiness gate after Phase 6A dynamic client cutover validation. Phase 6B should harden the already-working system before broader production onboarding or Phase 7 province support.

## 1. Firestore And Tenant-Isolation Rules

- [x] Firestore emulator rules tests run locally.

```powershell
cd C:\Users\Paul\Rescuenect\Backend
npm run test:firestore-rules
```

- [x] Super Admin can read system-wide protected collections.
- [x] Super Admin can read all clients, archives, deletion jobs, operation logs, and email logs.
- [x] LGU Admin can read only their assigned client-scoped data.
- [x] LGU Admin cannot read another client's residents, announcements, centers, statuses, boundaries, invitations, or proposals.
- [x] LGU Admin writes are allowed only for their own active client.
- [x] LGU Admin writes are blocked when their client is `deletion_scheduled`, `deleting`, `deleted`, inactive, or draft.
- [x] LGU Admin cannot change a document's `clientId` during update to take over another tenant's data.
- [x] Resident can read their own profile and same-client public/scoped data.
- [x] Resident cannot read another client's private resident/status data.
- [x] Resident client-dependent writes are allowed only while their client is active.
- [x] Resident client-dependent writes are blocked when their client is `deletion_scheduled`, `deleting`, `deleted`, inactive, or draft.
- [x] Missing `clientId` data is not visible through a Naic fallback.
- [x] Public reads remain intentionally open only for active clients, public notices, weather, earthquakes, contacts, and LGU request creation.
- [x] Backend and Supabase Admin SDK paths remain documented as rules-bypassing trusted server paths.

## 2. E2E And Integration Coverage

- [x] Super Admin can review, approve, reject, and inspect LGU access requests.
- [x] Super Admin can create draft clients from approved requests.
- [x] Super Admin can update client coverage, weather coordinates, map settings, boundaries, and activation status.
- [x] Super Admin can invite and remove LGU admins.
- [x] Super Admin can view analytics, operation logs, email logs, health status, archives, and deletion jobs.
- [x] LGU Admin sees only their assigned client dashboard data.
- [x] LGU Admin cannot access Super Admin routes or another client's data.
- [x] Resident signup shows multiple active clients correctly.
- [x] Resident signup handles zero active clients with an unavailable state.
- [x] Resident signup excludes draft, inactive, deletion-scheduled, deleting, and deleted clients.
- [x] Mobile bootstrap does not infer Naic from missing client context.
- [x] Mobile weather uses backend-provided `weatherLocationKey`.
- [x] Mobile notifications do not treat missing `clientId` as Naic.
- [x] Scheduled deletion preview, schedule, cancel, due processing, archive review, and permanent archive deletion have E2E coverage.

## 3. Scheduled Job Monitoring

- [x] Supabase scheduled weather job has success/failure monitoring.
- [x] Supabase earthquake monitor job has success/failure monitoring.
- [x] Supabase `client-deletions-process` has success/failure monitoring.
- [x] Due deletion job failures alert the operator with job id, client id, and error summary.
- [x] SMTP/email failures are tracked with alert thresholds.
- [x] Backend health endpoint monitoring is configured.
- [x] Firebase/Firestore service health checks are documented.
- [x] Monitoring dashboards identify stale job runs.
- [x] Manual retry steps are documented for failed client deletion jobs.

## 4. Retention, Export, And Cleanup

- [x] Operation log retention policy is documented.
- [x] Email log retention policy is documented.
- [x] Client archive retention policy is documented.
- [x] Permanent archive deletion policy is documented.
- [x] Export process exists for operation logs.
- [x] Export process exists for email logs.
- [x] Export process exists for client archives before permanent deletion.
- [x] Cleanup jobs or manual procedures are documented for old logs.
- [x] Legal/privacy review is completed for retained resident snapshots in archives.

## 5. Backup And Restore Runbooks

- [x] Firestore backup procedure is documented.
- [x] Firestore restore procedure is documented.
- [x] Client-scoped restore procedure is documented.
- [x] Archive restore or extraction procedure is documented.
- [x] Firebase Auth recovery limitations are documented.
- [x] Supabase function secrets backup and rotation procedure is documented.
- [x] Rollback steps are documented for bad rules deployment.
- [x] Rollback steps are documented for bad frontend/backend deployment.

## 6. Performance And Build Readiness

- [x] Frontend Recharts circular chunk warnings are reviewed.
- [x] Frontend large chunk warnings are reviewed and addressed where practical.
- [x] Clients table performs acceptably with many clients.
- [x] LGU admins table performs acceptably with many admins.
- [x] Notifications perform acceptably with many client-scoped records.
- [x] Operation logs perform acceptably with high log volume.
- [x] Archive detail view performs acceptably with large snapshots.
- [x] Backend pagination is available for large operational collections where needed.

## 7. Production Gate

- [x] Backend build passes.
- [x] Backend tests pass.
- [x] Firestore rules tests pass.
- [x] Frontend build passes.
- [x] Mobile TypeScript check passes.
- [x] Supabase functions deploy successfully.
- [x] Supabase schedules are active.
- [x] Required secrets are present and deprecated secrets are removed or ignored.
- [x] Phase 6B risks and remaining known limitations are documented.
- [x] Approved for broader production rollout.

Decision:

- [x] Approved for broader production rollout.
- [ ] Not approved; blockers are listed below.

Blockers:

- None.
