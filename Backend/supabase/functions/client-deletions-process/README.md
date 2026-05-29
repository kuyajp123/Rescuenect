# Client Deletions Process Function

Status: Phase 6A direct Firebase processor
Last Updated: 2026-05-29

## Purpose

`client-deletions-process` processes due scheduled client deletion jobs without depending on the Render backend being awake.

The function reads `clientDeletionJobs` directly from Firestore, archives due clients, removes live client-scoped data, and updates each job with completion or failure details.

## Architecture

Primary flow:

1. Super Admin schedules deletion through the backend.
2. Backend writes the client deletion fields and `clientDeletionJobs/{clientId}`.
3. Supabase schedule invokes `client-deletions-process`.
4. The function connects directly to Firebase using service account credentials.
5. Due jobs are archived into `clientArchives/{clientId}`.
6. Live client-scoped records, LGU admin docs, eligible Firebase Auth users, and the live `clients/{clientId}` doc are removed.
7. The job is marked `completed` or `failed`.

The backend internal endpoint remains available as a manual/backward fallback, but this function should be the production scheduled path.

## Required Secrets

```text
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_JSON
```

`FIREBASE_ADMIN_CREDENTIALS` can be used instead of `FIREBASE_SERVICE_ACCOUNT_JSON` if that is the configured project convention.

## Optional Secrets

```text
CLIENT_DELETION_MAX_JOBS
```

Default: `5` due jobs per invocation.

## Deprecated For This Function

These are no longer required by the primary scheduled deletion processor:

```text
BACKEND_URL
CLIENT_DELETION_CRON_SECRET
CLIENT_DELETION_PROCESS_URL
```

Remove them from Supabase only after the direct Firebase processor has deployed and invoked successfully.

## Security

`Backend/supabase/config.toml` keeps `verify_jwt = true` for this function. Scheduled or manual invocations must include a valid Supabase authorization token.

## Deploy

```powershell
cd C:\Users\Paul\Rescuenect\Backend
npx supabase functions deploy client-deletions-process --project-ref qltlmndyktxuzgpvhlid
```

## Validate

Expected successful response shape:

```json
{
  "processed": 0,
  "completed": 0,
  "failed": 0,
  "jobs": []
}
```

When due jobs exist, `processed`, `completed`, `failed`, and `jobs` should reflect the processed deletion jobs.

Validation checks:

- A completed job creates `clientArchives/{clientId}`.
- The live client no longer appears in `clients/{clientId}`.
- Archived LGU admins remain visible in the Archive module even after live admin cleanup.
- Function logs do not show backend URL or cron-secret errors.
- The processor still works when the Render backend is asleep.
