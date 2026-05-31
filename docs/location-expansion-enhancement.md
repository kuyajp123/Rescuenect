# Location Expansion Enhancement

Status: Phase 6A Validated; Phase 6B Production Readiness In Progress
Date: 2026-05-20
Last Updated: 2026-05-30

## Summary

Rescuenect started as a Naic-focused system, with barangays, weather keys, and several admin assumptions tied to one municipality. The location expansion enhancement turns that into a municipality or city client model so Rescuenect can onboard multiple LGU clients without code changes for every new location.

Phase 1 to Phase 3 prepared the location model, simplified weather to a municipality/city key, and made resident signup use active coverage. Phase 4 added the Super Admin layer, LGU request onboarding, client management, LGU admin management, protected admin authorization, Naic legacy migration support, and dynamic client-based weather configuration. Phase 5 completed the stability layer with client proposals, map settings, boundary imports, SMTP email delivery, Super Admin analytics, dynamic earthquake scope, role-aware notifications, and operation logs. Phase 6A removed Naic as the runtime default client and added scheduled client decommissioning with archive retention, processed directly by a Supabase Edge Function using Firebase credentials. Phase 6A validation is complete, so the active work is now Phase 6B production readiness.

The current MVP direction remains municipality or city-level deployments only. Province-wide coverage is still a future roadmap item.

Earthquake data is now client-aware for active municipality/city clients. Naic is retained only as an explicit configured or migration-seeded client, not as a runtime fallback.

## Current Implementation Status

The system is now configured around two admin levels:

- Super Admin: manages LGU requests, clients, archived clients, LGU admins, activation, protected client deletion/deactivation, and system status.
- LGU Admin: uses the existing admin dashboard modules, scoped to one client municipality/city.

The current system supports:

- `admin/{uid}` role metadata with `super_admin` and `lgu_admin`.
- Super admin allowlist through `SUPER_ADMIN_EMAILS`.
- Super Admin access through `SUPER_ADMIN_EMAILS`; LGU admins are created through approved requests or invitations.
- Protected admin middleware for super admin routes, LGU admin routes, active client checks, and client access checks.
- Public LGU request form using backend PSGC proxy endpoints.
- Official PSA PSGC API priority when `PSGC_API_TOKEN` is available.
- Rootscratch PSGC fallback when the official token is not available yet.
- Request approval into draft clients.
- Separate client activation before resident signup visibility.
- Client table view, search, details page, request snapshot display, admin list, coverage management, weather key and coordinate management.
- LGU admin table view, sorting, pagination, invite modal, and delete support.
- Resident signup visibility limited to active clients.
- Dynamic client cutover audit and migration endpoints for missing tenant `clientId` data.
- Naic legacy data migration to `clientId: 'naic'` through explicit migration utilities.
- Dynamic weather loading from active clients in Supabase weather functions.
- Weather notifications using client-aware weather configuration.
- Dynamic earthquake scoping using active clients.
- LGU Coordination proposals for client changes.
- Client map settings and GeoJSON boundary imports.
- SMTP email delivery and email logging.
- Super Admin analytics with system health.
- Super Admin operation logs with Git-style before/after changes.
- Scheduled client deletion preview, schedule, cancel, and Supabase/Firebase direct processing.
- Client archive snapshots for completed scheduled deletions, with permanent archive removal controlled by Super Admin.
- Friendly LGU admin email notice when a client deletion is scheduled.
- Deletion grace-period banners for LGU admins and residents.
- Read-only enforcement for LGU and resident writes while deletion is scheduled.

Known transition limitations:

- Firestore/security rules still need production-readiness review.
- E2E/integration coverage for full Super Admin, LGU Admin, and resident scenarios is still planned.
- Scheduled job monitoring and retention/export planning are still planned.
- Province-wide clients remain out of scope.

## Problem

The old location setup had several limits:

- Barangays were tied to Naic-specific data.
- Coordinates were hardcoded instead of managed as client configuration.
- Resident signup could not adapt to different LGU clients.
- Weather, incident coverage, reports, and dashboards were difficult to reuse for another city or municipality.
- Admin access did not distinguish between system-wide administrators and LGU-scoped administrators.

If a new LGU wants to use Rescuenect, the system should not require code edits just to add its municipality/city, barangays, admins, weather key, and coverage settings.

## Goals

- Allow Rescuenect to support multiple LGU clients.
- Keep each LGU admin scoped to one municipality or city client.
- Let residents select only the locations covered by active LGU clients.
- Store barangays, coordinates, weather keys, and activation status as configurable data.
- Make Naic one configured client, not the whole system assumption.
- Keep province-wide coverage as a future roadmap option.
- Use one shared weather feed per municipality or city for the MVP.
- Keep earthquake, weather, notifications, and maps scoped by active municipality/city clients.

## Final MVP Scope

Start with one Rescuenect client per municipality or city.

This is the safest starter model because:

- The admin structure is simpler.
- Data cleanup is smaller.
- Incident routing is easier to understand.
- Barangay coverage is easier to verify.
- It matches how local rescue and disaster response operations often work day to day.

Province-level coverage should come later, after the system supports multiple municipalities and cities cleanly.

Out of scope for the MVP:

- Province-wide client coverage.
- Provincial admin hierarchy.
- Municipality or city admins under a province client.
- Required barangay weather zones inside one municipality or city.
- Province-wide boundary hierarchy.

## Admin Roles

### Super Admin

Super admins are system-level administrators. They are controlled through the `SUPER_ADMIN_EMAILS` backend allowlist.

Current Super Admin responsibilities:

- Review LGU access requests.
- Approve requests into draft clients.
- Reject requests with review notes.
- Manage client records.
- Activate or deactivate clients.
- Schedule deletion for inactive or draft clients.
- Review and permanently remove archived client snapshots.
- Manage LGU admin accounts.
- View system status and API health.
- Access all client scopes when needed.

### LGU Admin

LGU admins are scoped administrators for one client municipality or city.

Current LGU Admin responsibilities:

- Access the existing dashboard modules for their assigned client.
- Manage client-scoped residents, statuses, evacuation centers, announcements, contacts, and notifications.
- View weather for their configured municipality/city weather key.
- View earthquake data scoped to their assigned client.

LGU admins cannot access Super Admin pages and cannot manage other clients.

## LGU Request Onboarding

Client onboarding starts from the public Request Rescuenect Access form.

The form collects:

- LGU name.
- Office or department.
- Requester name.
- Position.
- Email and phone.
- Region.
- Province.
- Municipality or city.
- Barangay coverage.
- Barangay verification confirmation.
- Notes or supporting details.

Location choices come from backend PSGC proxy endpoints:

```text
GET /public/psgc/regions
GET /public/psgc/regions/:regionCode/provinces
GET /public/psgc/regions/:regionCode/municipalities
GET /public/psgc/provinces/:provinceCode/municipalities
GET /public/psgc/municipalities/:municipalityCode/barangays
```

The backend prefers the official PSA PSGC API when `PSGC_API_TOKEN` is available. When the token is not available, it falls back to the Rootscratch PSGC API so development and early onboarding can continue while waiting for official API approval.

Submitted requests are stored in `lguRequests/{requestId}` with requester details, PSGC metadata snapshots, selected barangay snapshots, status, and review metadata.

Approval flow:

1. Public requester submits an LGU access request.
2. Super admin reviews the request and selected barangays.
3. Super admin approves the request.
4. The system creates a draft `clients/{clientId}` record.
5. The system creates or prepares an LGU admin onboarding record for the requester email.
6. Super admin reviews final configuration.
7. Super admin activates the client.
8. Resident signup starts showing that municipality/city.

Draft and inactive clients are not exposed to resident signup.

## Client Management

The Super Admin Clients page now uses a table view instead of rendering all client details at once. This keeps the page usable as the number of clients grows.

The Clients page supports:

- Search.
- Status display.
- Basic client metadata.
- Manage action to open the client details page.
- Schedule deletion action for eligible inactive or draft clients.
- Archive entry point for completed deleted-client snapshots.

The client details page supports:

- Request information snapshot.
- PSGC region, province, municipality/city, and barangay snapshots.
- Client status.
- Weather location key.
- Weather latitude and longitude.
- Barangay coverage enable/disable.
- Activation and deactivation.
- Client admin list.
- Deletion preview, scheduled deletion, and cancellation before the effective date.

Naic now follows the same client lifecycle rules as every other municipality/city client. It is no longer a runtime fallback and no longer has a special deletion block.

## Client Decommissioning And Archive

Client deletion is intentionally delayed and archive-first.

Current flow:

1. Super Admin schedules deletion for an inactive or draft client.
2. The client status becomes `deletion_scheduled`, and `clientDeletionJobs/{clientId}` stores the due job.
3. LGU admins and invited admins tied to the client receive a friendly deletion-scheduled email immediately.
4. During the grace period, LGU admins and residents keep read access where allowed, but client-dependent writes are blocked.
5. When the effective date arrives, the Supabase `client-deletions-process` function connects directly to Firebase/Firestore and processes due jobs.
6. The processor snapshots the live client and related client-scoped data into `clientArchives/{clientId}` before cleanup.
7. The processor removes live client-scoped data, LGU admin docs, relevant Firebase Auth users where supported, and the live `clients/{clientId}` document.
8. Super Admin can review the archived client from the Archive module and choose whether to permanently delete the archive snapshot.

Archive is the long-term review area for deleted clients. It preserves the client setup, settings, barangay coverage, LGU admin snapshots, dependency counts, and captured client-scoped records even if those records are later removed from live collections.

## LGU Admin Management

The Super Admin LGU Admins page now uses a table view.

It supports:

- LGU admins only; super admins are excluded from this list.
- Search.
- Sorting.
- Pagination with 10, 20, and 50 item page sizes.
- Refresh as an icon-only action.
- Invite LGU Admin through a modal.
- Delete LGU admin.

The invite feature is for adding additional admins under an existing client. The requester-approved admin and invited admins have the same LGU admin scope unless a future permissions model adds finer-grained roles.

## User Signup Flow

Residents only see location choices covered by active Rescuenect clients.

Current flow:

1. User selects province.
2. User selects municipality or city under that province.
3. User selects barangay under that municipality or city.

The app does not expose draft or inactive clients.

Example:

```text
Province: Cavite
Municipality: Naic
Barangay: Ibayo Silangan
```

If only one municipality is active in a province, the app can still store the province but only show the covered municipality.

## Weather Coverage Decision

The earlier Naic implementation grouped barangays into weather zones such as `coastal_west`, `coastal_east`, `central_naic`, `sabang`, `farm_area`, and `naic_boundary`.

The MVP location expansion uses one weather location per municipality or city.

Example:

```text
Client: Naic
Weather location key: naic
Weather coordinate: one verified Naic representative coordinate
Barangays: all covered Naic barangays
Weather data: shared by all Naic barangays
```

Example for another client:

```text
Client: General Trias
Weather location key: gentri
Weather coordinate: one verified General Trias representative coordinate
Barangays: all covered General Trias barangays
Weather data: shared by all General Trias barangays
```

Barangay weather zones can remain a future feature. Add them only if an LGU needs targeted weather alerts for coastal areas, upland areas, flood-prone zones, or other geographic differences.

## Weather Database Strategy

The Firestore weather collection shape remains:

```text
weather/{weatherLocationKey}/realtime/data
weather/{weatherLocationKey}/hourly/{000..}
weather/{weatherLocationKey}/daily/{000..}
```

Current MVP meaning of `weatherLocationKey`:

```text
naic
gentri
tanza
trece_martires
```

Supabase weather functions now load active clients dynamically and process weather for each active client with a valid `weatherLocationKey`, `weatherLatitude`, and `weatherLongitude`.

Old zone documents can be left in Firestore during rollout and deleted later after confirming that mobile clients, backend functions, and notifications no longer read them.

## Current Data Model

The current Phase 6A model uses these main collections.

### `clients/{clientId}`

Stores one municipality or city LGU client.

Important fields:

```text
id
name
type: municipality | city
status: draft | active | inactive | deletion_scheduled | deleting
provinceCode
provinceName
municipalityCode
municipalityName
regionCode
regionName
weatherLocationKey
weatherLatitude
weatherLongitude
barangays[]
requestId
createdAt
updatedAt
activatedAt
deactivatedAt
deletionScheduledAt
deletionEffectiveAt
deletionRequestedBy
deletionReason
deletionCancelledAt
deletionStatus
```

Barangay coverage is currently embedded in the client record. A separate `clientCoverage` collection can still be added later if coverage data becomes too large or needs independent history.

Completed deletions remove the live `clients/{clientId}` document after the archive snapshot and cleanup succeed.

### `clientDeletionJobs/{clientId}`

Tracks scheduled cleanup work for deleted clients.

Important fields:

```text
clientId
clientName
status: scheduled | running | completed | failed | cancelled
deletionScheduledAt
deletionEffectiveAt
deletionRequestedBy
deletionReason
progress
errors[]
createdAt
updatedAt
```

The Supabase `client-deletions-process` function is the primary scheduled processor. It reads due jobs directly from Firestore and does not require the Render backend to be awake.

### `clientArchives/{clientId}`

Stores the retained snapshot for a completed client deletion.

Important fields:

```text
id
clientId
clientName
clientStatus
client
request
deletionJob
deletionReason
deletionRequestedBy
deletionScheduledAt
deletionEffectiveAt
archivedAt
snapshotCounts
createdAt
updatedAt
```

Archive subcollections preserve captured client-scoped records:

```text
lguRequests
lguAdmins
adminInvitations
residents
statuses
evacuationCenters
announcements
contacts
notifications
clientBoundaries
clientChangeRequests
```

Super Admin can permanently delete the archive document and its subcollections from the Archive module.

### `admin/{uid}`

Stores admin identity and access scope.

Important fields:

```text
role: super_admin | lgu_admin
clientId: string | null
status: active | inactive
permissionsVersion
createdAt
updatedAt
```

LGU admins must have an explicit `clientId`. Missing client context is treated as an access problem instead of falling back to Naic.

### `lguRequests/{requestId}`

Stores public LGU onboarding requests.

Important fields:

```text
status: pending | approved | rejected | cancelled
requesterName
position
email
phone
officeOrDepartment
lguName
psgc snapshot fields
selectedBarangays[]
barangayVerificationConfirmed
notes
reviewedBy
reviewedAt
reviewNote
createdAt
updatedAt
```

### Admin Invitations Or Pending Admin Records

Used to prepare LGU admin onboarding for requester emails and additional invited LGU admins. Invitation and deletion-scheduled notifications are delivered through the email service and recorded in email logs.

## Coordinate Strategy

Barangays are geographic areas, not exact points. For most system features, the app should store a representative coordinate for each barangay when available.

Recommended coordinate type:

- Use a barangay centroid when boundary data is available.
- Use a manually verified barangay hall or central point if centroid data is not available.
- Keep future support for barangay boundaries using GeoJSON.

For weather in the MVP, use one verified municipality or city representative coordinate. A municipal hall, city hall, disaster risk reduction office, or agreed central point is enough as the first weather coordinate.

Barangay representative coordinates are still useful for resident location metadata, dashboards, maps, and future routing features. For emergency routing, exact user incident coordinates should still come from the user device, map pin, or report location.

## Sources For Barangay Data

Current sources:

- Official PSA PSGC API when `PSGC_API_TOKEN` is available.
- Rootscratch PSGC API fallback while waiting for the official token.
- LGU verification through the request form.

Possible future sources:

- LGU-provided barangay lists, maps, shapefiles, or GeoJSON files.
- OpenStreetMap data for approximate barangay boundaries and coordinates.
- Google Maps, Mapbox, or other geocoding services for lookup assistance.
- Manual coordinate verification by the LGU.

Important note: geocoding services may not always return exact barangay boundaries in the Philippines. The safest approach is to treat imported coordinates as draft data until verified.

## Implementation Phases

### Phase 1: Prepare Existing Naic Data

Status: Completed

- Moved Naic barangays into a dedicated location data source.
- Added province, municipality, and barangay metadata.
- Kept current behavior working.
- Added Naic as the initial configured client.
- Started removing hardcoded Naic assumptions from forms and location logic.

### Phase 2: Simplify Weather To Municipality Or City Key

Status: Completed

- Replaced Naic barangay weather zones with one municipality weather key.
- Standardized Naic weather reads around `weather/naic`.
- Updated mobile and admin weather logic to resolve by weather location key.
- Kept the existing Firestore weather collection shape.
- Preserved old weather zone documents during rollout.

### Phase 3: Dynamic Signup Locations

Status: Completed

- Added active client coverage as the source of resident signup choices.
- Showed province, municipality/city, and barangay choices from active coverage.
- Saved selected client and location metadata on resident profiles.
- Prevented draft and inactive clients from appearing in resident signup.

### Phase 4: Super Admin, LGU Admins, And Request Onboarding

Status: Implemented

- Added role-aware admin auth for `super_admin` and `lgu_admin`.
- Added Super Admin pages for overview, LGU requests, clients, LGU admins, and system status.
- Added public LGU request form.
- Added PSGC proxy endpoints with official PSA priority and Rootscratch fallback.
- Added request approval/rejection.
- Added draft client creation from approved requests.
- Added separate client activation/deactivation.
- Added client table and client details page.
- Added client coverage, weather key, and weather coordinate management.
- Added LGU admin table, sorting, pagination, invite modal, and delete support.
- Scoped LGU admin modules by `clientId`.
- Migrated legacy Naic data to `clientId: 'naic'`.
- Added hardening around protected routes, CRUD operations, client deletion, and client activation.
- Updated Supabase weather functions to load active client weather locations dynamically.
- Verified backend tests and frontend build after Phase 4 work.

Phase 4 retained Naic as the protected initial client. This is expected during transition and can be revisited after production data and fallback behavior are fully stable.

### Phase 5: Stability, Client Settings, Email, Analytics, Earthquake Scope, And Logs

Status: Completed and verified

Phase 5 completed the stability-first layer for municipality/city clients.

Completed work:

- Added stronger tenant isolation and role-aware notification filtering.
- Added client `mapSettings`.
- Added GeoJSON boundary upload and computed map bounds.
- Added LGU Coordination proposals for client changes.
- Added Super Admin Client Requests review flow.
- Added SMTP email delivery and email logs.
- Added Super Admin analytics and unified system health overview.
- Added dynamic earthquake scope for active clients.
- Added client-relative earthquake distance and notifications.
- Added Super Admin operation logs.
- Split actionable notifications from audit/operation logs.
- Applied client map settings to admin and mobile map modules.
- Verified the Phase 5 checklist after implementation.

Phase 5 retained Naic as a protected fallback client at that time. Phase 6A has since removed the runtime default-client assumptions, so Naic now follows the same lifecycle as any other configured municipality/city client.

### Phase 6A: Full Dynamic Client Cutover

Status: Validated

Phase 6A removed Naic as the system's runtime default client and introduced scheduled client decommissioning.

Implemented work:

- Added dynamic client cutover audit and migration endpoints.
- Removed runtime `clientId || 'naic'` behavior from tenant-scoped backend, admin, and mobile flows.
- Removed automatic Naic seeding/returning from normal client list/get operations.
- Kept Naic creation only as an explicit migration seed utility.
- Replaced instant client deletion with scheduled preview, schedule, cancel, archive-first cleanup, and due-job processing.
- Made Naic follow the same scheduled decommissioning flow as other clients.
- Added deletion warning banners for LGU admins and residents.
- Blocked LGU and resident client-dependent writes during scheduled deletion.
- Added Archive for completed deleted clients, including client setup, settings, LGU admins, and captured client-scoped data.
- Added a Supabase scheduled function that processes due deletion jobs directly through Firebase/Firestore, avoiding Render free-plan uptime dependency.
- Verified backend, frontend, mobile, Firestore rules, and Supabase scheduled deletion behavior for the cutover.

### Phase 6B: Production Readiness

Status: In progress

- Review Firestore/security rules for tenant isolation.
- Add E2E tests for Super Admin and LGU Admin flows.
- Add operation log retention, export, and cleanup rules.
- Add backup and restore documentation.
- Add monitoring for scheduled weather and earthquake jobs.
- Add monitoring for scheduled client deletion jobs.
- Add monitoring for SMTP/email failures.
- Address frontend Recharts/chunk-size build warnings.
- Review performance for large clients, many notifications, and many logs.

### Phase 7: Future Province Support

Status: Future

- Add province-wide client support.
- Add municipality-level admins under a province client.
- Add province-wide dashboards.
- Add filtering by province, municipality, city, and barangay.
- Add role-based access rules per coverage area.

Province coverage should wait until municipality/city clients are stable in production and Naic is no longer a default runtime dependency.

## Risk And Complexity Rating

Severity: High

This affects signup, user profiles, reports, dashboards, weather coverage, incident routing, notifications, and permissions.

Cost: Medium to High

The municipality/city model is manageable. Province-wide support is more expensive because it requires a stronger admin hierarchy and more complex access control.

Damage if implemented poorly: High

Bad location data can cause wrong incident grouping, incorrect weather targeting, confusing dashboards, data leaks between clients, and poor LGU trust.

Complexity: Medium for municipality/city support, High for province support

The technical work is manageable, but correctness of Philippine location data and admin permissions must be handled carefully.

## Final Decision

Use dynamic municipality or city client coverage as the production direction.

Phase 4 confirmed that Rescuenect can onboard LGU clients through a Super Admin flow, activate coverage for resident signup, and run client-aware weather using one municipality/city weather key. Phase 5 extended that foundation with proposal-first client changes, map boundaries, email delivery, analytics, dynamic earthquake scope, role-aware notifications, and operation logs.

Naic remains the initial protected client during transition, but it should continue moving toward being just one configured client among many.

Province-level coverage remains on the roadmap, but it should not be implemented until multiple municipality/city clients are stable and Phase 6A removes Naic as a runtime default.

The next enhancement move should be Phase 6B: production readiness, monitoring, rules review, and broader E2E coverage.
