# Location Expansion Enhancement

Status: Phase 4 Implemented; Phase 5 Planning Next
Date: 2026-05-20
Last Updated: 2026-05-25

## Summary

Rescuenect started as a Naic-focused system, with barangays, weather keys, and several admin assumptions tied to one municipality. The location expansion enhancement turns that into a municipality or city client model so Rescuenect can onboard multiple LGU clients without code changes for every new location.

Phase 1 to Phase 3 prepared the location model, simplified weather to a municipality/city key, and made resident signup use active coverage. Phase 4 has now added the Super Admin layer, LGU request onboarding, client management, LGU admin management, protected admin authorization, Naic legacy migration support, and dynamic client-based weather configuration.

The current MVP direction remains municipality or city-level deployments only. Province-wide coverage is still a future roadmap item.

Earthquake data is still treated as a global module. Making earthquakes client-aware is intentionally moved to Phase 5.

## Current Implementation Status

Phase 4 is now configured around two admin levels:

- Super Admin: manages LGU requests, clients, LGU admins, activation, protected client deletion/deactivation, and system status.
- LGU Admin: uses the existing admin dashboard modules, scoped to one client municipality/city.

The current system supports:

- `admin/{uid}` role metadata with `super_admin` and `lgu_admin`.
- Super admin allowlist through `SUPER_ADMIN_EMAILS`.
- Optional legacy admin fallback through `ENABLE_LEGACY_ADMIN_EMAILS`.
- Protected admin middleware for super admin routes, LGU admin routes, active client checks, and client access checks.
- Public LGU request form using backend PSGC proxy endpoints.
- Official PSA PSGC API priority when `PSGC_API_TOKEN` is available.
- Rootscratch PSGC fallback when the official token is not available yet.
- Request approval into draft clients.
- Separate client activation before resident signup visibility.
- Client table view, search, details page, request snapshot display, admin list, coverage management, weather key and coordinate management.
- LGU admin table view, sorting, pagination, invite modal, and delete support.
- Resident signup visibility limited to active clients.
- Naic legacy data migration to `clientId: 'naic'`.
- Naic retained as the protected initial/default client during transition.
- Dynamic weather loading from active clients in Supabase weather functions.
- Weather notifications using client-aware weather configuration.

Known Phase 4 limitations:

- Naic is still protected from deletion as the initial fallback client.
- LGU admin invitation is still a simple admin onboarding mechanism; full email delivery can be added later.
- Earthquake data remains global and is not yet filtered by client, municipality, radius, or LGU coverage.
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
- Move earthquake client scoping into Phase 5.

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
- Barangay boundary GeoJSON management.
- Client-specific earthquake filtering and notifications, now planned for Phase 5.

## Admin Roles

### Super Admin

Super admins are system-level administrators. They are controlled through the `SUPER_ADMIN_EMAILS` backend allowlist.

Current Super Admin responsibilities:

- Review LGU access requests.
- Approve requests into draft clients.
- Reject requests with review notes.
- Manage client records.
- Activate or deactivate clients.
- Delete eligible clients.
- Manage LGU admin accounts.
- View system status and API health.
- Access all client scopes when needed.

### LGU Admin

LGU admins are scoped administrators for one client municipality or city.

Current LGU Admin responsibilities:

- Access the existing dashboard modules for their assigned client.
- Manage client-scoped residents, statuses, evacuation centers, announcements, contacts, and notifications.
- View weather for their configured municipality/city weather key.
- View earthquake data as a global module until Phase 5 makes it client-aware.

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
- Delete action for eligible clients.

The client details page supports:

- Request information snapshot.
- PSGC region, province, municipality/city, and barangay snapshots.
- Client status.
- Weather location key.
- Weather latitude and longitude.
- Barangay coverage enable/disable.
- Activation and deactivation.
- Client admin list.
- Protected deletion when safe.

Naic is intentionally non-deletable for now because it is the initial migrated client and transition fallback.

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

The current Phase 4 model uses these main collections.

### `clients/{clientId}`

Stores one municipality or city LGU client.

Important fields:

```text
id
name
type: municipality | city
status: draft | active | inactive
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
```

Barangay coverage is currently embedded in the client record. A separate `clientCoverage` collection can still be added later if coverage data becomes too large or needs independent history.

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

Existing non-super admins are treated as Naic LGU admins during transition when needed.

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

Used to prepare LGU admin onboarding for requester emails and additional invited LGU admins. Full email delivery can be added later.

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

### Phase 5: Dynamic Earthquake Scope And Production Hardening

Status: Planned Next

Phase 5 should focus on modules that still behave globally or need deeper production hardening.

Planned earthquake work:

- Make the earthquake module client-aware.
- Let Super Admin view system-wide earthquake data.
- Let LGU admins view earthquakes relevant to their assigned client only.
- Use each client's municipality/city coordinates as the default earthquake relevance center.
- Add configurable radius or relevance rules per client.
- Scope earthquake notifications by affected client coverage.
- Store earthquake notification metadata with `clientId` where applicable.
- Review earthquake map behavior so it centers and filters correctly per LGU admin.
- Decide whether residents should receive earthquake alerts by client, barangay, radius, or device location.

Planned hardening work:

- Remove remaining temporary Naic fallbacks when they are no longer needed.
- Replace temporary LGU admin environment setup with fully dynamic request-approved onboarding.
- Add more backend tests for Super Admin versus LGU Admin access.
- Add frontend smoke tests for client switching and role-aware routing.
- Add mobile tests for active client signup visibility.
- Review Firestore rules and direct client reads for tenant isolation.
- Add safer audit/history fields for Super Admin actions.
- Add stronger operational checks for scheduled weather and earthquake jobs.

### Phase 6: Future Province Support

Status: Future

- Add province-wide client support.
- Add municipality-level admins under a province client.
- Add province-wide dashboards.
- Add filtering by province, municipality, city, and barangay.
- Add role-based access rules per coverage area.

Province coverage should wait until municipality/city clients are stable in production.

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

Phase 4 confirms that Rescuenect can now onboard LGU clients through a Super Admin flow, activate coverage for resident signup, and run client-aware weather using one municipality/city weather key.

Naic remains the initial protected client during transition, but it should continue moving toward being just one configured client among many.

Province-level coverage remains on the roadmap, but it should not be implemented until multiple municipality/city clients are stable.

Phase 5 should make the earthquake module dynamic and client-aware, then continue hardening tenant isolation, tests, auditability, and operational monitoring.
