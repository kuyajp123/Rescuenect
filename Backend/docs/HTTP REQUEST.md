# HTTP Requests (Postman)

This document records common backend HTTP requests for manual testing (e.g., Postman).

## Variables (Postman Environment)

- `baseUrl` – Backend base URL (local example: `http://localhost:4000`)
- `clientId` – Firestore client document ID
- `firebaseIdToken` – Firebase Auth **ID token** for a user that is:
  - authenticated, and
  - an active admin, and
  - `role = super_admin`
- `cronSecret` – Backend cron secret value (one of these env vars):
  - `CLIENT_DELETION_CRON_SECRET`, or
  - `INTERNAL_CRON_SECRET`, or
  - `CRON_SECRET`

## Sanity Check (avoid 404s)

Before testing admin routes, confirm your `baseUrl` points to the **backend** (Express), not the frontend.

Purpose: quickly verify you’re calling the correct server/port before debugging auth or route issues.

- Method: `GET`
- URL: `{{baseUrl}}/health`
- Expected: `200 OK`

If `/health` returns `404`, you’re likely calling the wrong host/port (common mistake: frontend dev server at `http://localhost:5173`).

## Client Deletion

### Important: “Immediate delete” is disabled

The backend endpoint below does **not** delete clients right now:

- Method: `DELETE`
- URL: `{{baseUrl}}/admin/super/clients/{{clientId}}`
- Result: `405 Method Not Allowed`
- Message: `Immediate client deletion is disabled. Use scheduled deletion with preview and grace period.`

To delete a client via HTTP, use the supported flow: **schedule deletion** (with an optional grace period) and then **process due deletion jobs**.

### 1) Deactivate the client (required if client is `active`)

Purpose: changes the client status to `inactive` so it becomes eligible for scheduled deletion.

- Method: `POST`
- URL: `{{baseUrl}}/admin/super/clients/{{clientId}}/deactivate`
- Headers:
  - `Authorization: Bearer {{firebaseIdToken}}`

### 2) (Optional) Preview what will be deleted

Purpose: returns warnings + dependency counts (residents, admins, statuses, etc.) before scheduling deletion.

- Method: `GET`
- URL: `{{baseUrl}}/admin/super/clients/{{clientId}}/deletion-preview`
- Headers:
  - `Authorization: Bearer {{firebaseIdToken}}`

### 3) Schedule deletion with `graceDays: 0` (effectively immediate)

This is the closest supported equivalent to “delete now”.

Purpose: creates/updates the client deletion job and marks the client as `deletion_scheduled` with an effective date.

- Method: `POST`
- URL: `{{baseUrl}}/admin/super/clients/{{clientId}}/schedule-deletion`
- Headers:
  - `Authorization: Bearer {{firebaseIdToken}}`
  - `Content-Type: application/json`
- Body (raw JSON):

```json
{
  "reason": "manual cleanup",
  "graceDays": 0
}
```

Notes:

- Scheduling deletion only works when the client status is `draft` or `inactive`.
- If the client is currently `active`, you must deactivate it first (step 1).

### 4) Process due deletion jobs (this performs the actual deletion)

This endpoint runs the deletion processor and will delete **all due** client deletion jobs.

Purpose: performs the actual cleanup (archive + delete client-scoped data) for any jobs whose effective date is due.

- Method: `POST`
- URL: `{{baseUrl}}/internal/scheduled/client-deletions/process`
- Headers:
  - `Authorization: Bearer {{cronSecret}}`

### Expected result

After processing completes successfully:

- The live client document `clients/{{clientId}}` is deleted.
- An archive document `clientArchives/{{clientId}}` is created.
- The job `clientDeletionJobs/{{clientId}}` is updated to `completed` (or `failed` with errors).

## Migrations

### NAIC legacy migration (clientId backfill)

**Purpose**

This migration cleans up legacy/early Naic data so records consistently use the canonical Naic client id (`naic`).
It is used to prepare the database for stricter client scoping and consistent routing/queries.

What it does (high-level):

- Ensures the `clients/naic` document exists and has required seed fields.
- Scans and (when not in dry run) updates legacy Naic records across collections so they:
  - set `clientId` to `naic` when missing or legacy, and
  - add/normalize Naic location metadata where applicable (client/province/municipality/weather/barangay fields).
- Updates admin docs to ensure roles/status/permissions fields are set consistently.
- Ensures `contacts/naic` exists (may copy legacy Naic contacts if needed).

**Dry run (recommended first)**

Dry run returns a summary of how many documents would be updated, without writing any changes.

Purpose: safely estimate impact (scanned/updated counts) before running the migration for real.

- Method: `POST`
- URL: `{{baseUrl}}/admin/super/migrations/naic-client-id?dryRun=true`
- Headers:
  - `Authorization: Bearer {{firebaseIdToken}}`
  - `Content-Type: application/json` (optional)
- Body:
  - optional empty body, or:

```json
{ "dryRun": true }
```

**Execute (writes changes)**

This performs Firestore writes and will also create an operation log entry.

Purpose: apply the NAIC backfill changes (writes to Firestore) so legacy records use canonical `clientId = naic`.

- Method: `POST`
- URL: `{{baseUrl}}/admin/super/migrations/naic-client-id`
- Headers:
  - `Authorization: Bearer {{firebaseIdToken}}`
  - `Content-Type: application/json`
- Body (optional):

```json
{ "dryRun": false }
```

**Postman quick copy (URLs + headers)**

Purpose: copy/paste the request URL quickly into Postman’s address bar.

Headers (Postman → Headers → Bulk Edit):

```text
Authorization: Bearer {{firebaseIdToken}}
Content-Type: application/json
```

Dry run (no writes) — URL:

```text
POST {{baseUrl}}/admin/super/migrations/naic-client-id?dryRun=true
```

Execute (writes changes) — URL:

```text
POST {{baseUrl}}/admin/super/migrations/naic-client-id
```

Note: If you send an empty JSON body `{}` without `?dryRun=true` (or without `{ "dryRun": true }`), the backend treats it as `dryRun = false` (executes + writes).
