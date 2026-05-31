# Rescuenect Phase 6B Production Readiness Checklist

Status: In progress
Created: 2026-05-30
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

- [ ] Super Admin can review, approve, reject, and inspect LGU access requests.
- [ ] Super Admin can create draft clients from approved requests.
- [ ] Super Admin can update client coverage, weather coordinates, map settings, boundaries, and activation status.
- [ ] Super Admin can invite and remove LGU admins.
- [ ] Super Admin can view analytics, operation logs, email logs, health status, archives, and deletion jobs.
- [ ] LGU Admin sees only their assigned client dashboard data.
- [ ] LGU Admin cannot access Super Admin routes or another client's data.
- [ ] Resident signup shows multiple active clients correctly.
- [ ] Resident signup handles zero active clients with an unavailable state.
- [ ] Resident signup excludes draft, inactive, deletion-scheduled, deleting, and deleted clients.
- [ ] Mobile bootstrap does not infer Naic from missing client context.
- [ ] Mobile weather uses backend-provided `weatherLocationKey`.
- [ ] Mobile notifications do not treat missing `clientId` as Naic.
- [ ] Scheduled deletion preview, schedule, cancel, due processing, archive review, and permanent archive deletion have E2E coverage.

## 3. Scheduled Job Monitoring

- [ ] Supabase scheduled weather job has success/failure monitoring.
- [ ] Supabase earthquake monitor job has success/failure monitoring.
- [ ] Supabase `client-deletions-process` has success/failure monitoring.
- [ ] Due deletion job failures alert the operator with job id, client id, and error summary.
- [ ] SMTP/email failures are tracked with alert thresholds.
- [ ] Backend health endpoint monitoring is configured.
- [ ] Firebase/Firestore service health checks are documented.
- [ ] Monitoring dashboards identify stale job runs.
- [ ] Manual retry steps are documented for failed client deletion jobs.

## 4. Retention, Export, And Cleanup

- [ ] Operation log retention policy is documented.
- [ ] Email log retention policy is documented.
- [ ] Client archive retention policy is documented.
- [ ] Permanent archive deletion policy is documented.
- [ ] Export process exists for operation logs.
- [ ] Export process exists for email logs.
- [ ] Export process exists for client archives before permanent deletion.
- [ ] Cleanup jobs or manual procedures are documented for old logs.
- [ ] Legal/privacy review is completed for retained resident snapshots in archives.

## 5. Backup And Restore Runbooks

- [ ] Firestore backup procedure is documented.
- [ ] Firestore restore procedure is documented.
- [ ] Client-scoped restore procedure is documented.
- [ ] Archive restore or extraction procedure is documented.
- [ ] Firebase Auth recovery limitations are documented.
- [ ] Supabase function secrets backup and rotation procedure is documented.
- [ ] Rollback steps are documented for bad rules deployment.
- [ ] Rollback steps are documented for bad frontend/backend deployment.

## 6. Performance And Build Readiness

- [ ] Frontend Recharts circular chunk warnings are reviewed.
- [ ] Frontend large chunk warnings are reviewed and addressed where practical.
- [ ] Clients table performs acceptably with many clients.
- [ ] LGU admins table performs acceptably with many admins.
- [ ] Notifications perform acceptably with many client-scoped records.
- [ ] Operation logs perform acceptably with high log volume.
- [ ] Archive detail view performs acceptably with large snapshots.
- [ ] Backend pagination is available for large operational collections where needed.

## 7. Production Gate

- [x] Backend build passes.
- [x] Backend tests pass.
- [x] Firestore rules tests pass.
- [ ] Frontend build passes.
- [ ] Mobile TypeScript check passes.
- [ ] Supabase functions deploy successfully.
- [ ] Supabase schedules are active.
- [ ] Required secrets are present and deprecated secrets are removed or ignored.
- [ ] Phase 6B risks and remaining known limitations are documented.
- [ ] Approved for broader production rollout.

Decision:

- [ ] Approved for broader production rollout.
- [ ] Not approved; blockers are listed below.

Blockers:

- [ ]
- [ ]
- [ ]
