# Location Expansion Enhancement

Status: Proposed
Date: 2026-05-20

## Summary

Rescuenect currently focuses on Naic, with barangays and coordinates treated as mostly fixed application data. This enhancement expands the system so it can support different client LGUs in the Philippines without hardcoding one municipality.

The recommended direction is to start with municipality or city-level deployments, then scale to province-level coverage once the product and operations are more mature.

## Problem

The current location setup has several limits:

- Barangays are tied to Naic-specific data.
- Coordinates are hardcoded instead of managed as client configuration.
- Resident signup cannot adapt to different LGU clients.
- Weather, incident coverage, reports, and dashboards are difficult to reuse for another city or municipality.

If a new LGU wants to use Rescuenect, the system should not require code edits just to add their province, municipality, barangays, and coordinates.

## Goals

- Allow Rescuenect to support multiple LGU clients.
- Let residents select only the locations covered by the LGU using the system.
- Store barangays and coordinates as configurable data.
- Make Naic just one configured location, not the whole system assumption.
- Prepare the app for future province-wide coverage.

## Recommended Starting Scope

Start with one Rescuenect deployment per municipality or city.

This is the safest starter model because:

- The admin structure is simpler.
- Data cleanup is smaller.
- Incident routing is easier to understand.
- Barangay coverage is easier to verify.
- It matches how local rescue and disaster response operations often work day to day.

Province-level coverage should come later, after the system supports multiple municipalities well.

## Province vs Municipality Coverage

### Municipality or City Coverage

Best for the current stage.

Example:

- Rescuenect Naic
- Rescuenect Tanza
- Rescuenect Trece Martires

Each client LGU manages its own barangays, responders, incidents, dashboards, announcements, and weather coverage.

### Province Coverage

Better for a later phase.

Example:

- Rescuenect Cavite

This would likely require:

- Provincial administrators.
- City or municipal administrators under the province.
- Barangay-level staff or responders.
- Better role permissions.
- More careful incident routing.
- More complex dashboards and reporting.

Province coverage is powerful, but it adds operational and technical complexity.

## User Signup Flow

Residents should only see location choices covered by active Rescuenect clients.

Recommended flow:

1. User selects province.
2. User selects municipality or city under that province.
3. User selects barangay under that municipality or city.

If only one municipality is covered in a province, the app can still store the province but only show that covered municipality.

Example:

```text
Province: Cavite
Municipality: Naic
Barangay: Ibayo Silangan
```

The app should not list all Philippine provinces, cities, municipalities, or barangays as selectable options unless they are active client coverage areas.

## Location Data Model

A future data model can separate LGU clients from actual geographic locations.

Suggested entities:

```text
clients
- id
- name
- type: municipality | city | province
- status: active | inactive
- provinceCode
- municipalityCode
- cityCode

provinces
- id
- psgcCode
- name

municipalities
- id
- psgcCode
- provinceId
- name
- type: municipality | city

barangays
- id
- psgcCode
- municipalityId
- name
- latitude
- longitude
- boundaryGeoJson
- isActive

clientCoverage
- id
- clientId
- provinceId
- municipalityId
- barangayId
- isCovered
```

For the first version, this can be simplified. The important part is to stop placing barangay lists directly inside frontend or backend logic.

## Coordinate Strategy

Barangays are geographic areas, not exact points. For most system features, the app should store a representative coordinate for each barangay.

Recommended coordinate type:

- Use a barangay centroid when boundary data is available.
- Use a manually verified barangay hall or central point if centroid data is not available.
- Keep future support for barangay boundaries using GeoJSON.

For weather, a centroid or representative point is usually enough. For emergency routing, exact user incident coordinates should still come from the user device, map pin, or report location.

## Sources For Barangay Data

Possible sources:

- PSGC data for official province, city, municipality, and barangay names and codes.
- LGU-provided barangay lists, maps, shapefiles, or GeoJSON files.
- OpenStreetMap data for approximate barangay boundaries and coordinates.
- Google Maps, Mapbox, or other geocoding services for lookup assistance.
- Manual verification by the LGU for final correctness.

Important note: geocoding services may not always return exact barangay boundaries in the Philippines. The safest approach is to treat imported coordinates as draft data until verified.

## Data Import Flow

Recommended admin/import workflow:

1. Create a client LGU.
2. Select province.
3. Select municipality or city.
4. Import barangays from a trusted source.
5. Generate or assign coordinates.
6. Mark barangays as covered or not covered.
7. Verify the data before enabling resident signup.

For the MVP, this import can be developer-assisted using a script or seed file. Later, it can become an admin tool.

## Admin Roles

For municipality or city coverage:

- Super Admin: manages system-wide settings and client setup.
- LGU Admin: manages one municipality or city.
- Responder/Admin Staff: handles incidents, reports, and operational data.

For future province coverage:

- Provincial Admin: sees province-wide data.
- Municipality or City Admin: manages local incidents and barangays.
- Barangay or Responder Staff: handles local operations.

This should be added only when province-level clients are needed.

## Implementation Phases

### Phase 1: Prepare Existing Naic Data

- Move Naic barangays into a dedicated location seed/config source.
- Add province, municipality, and barangay metadata.
- Keep current behavior working.
- Avoid hardcoded Naic assumptions in frontend forms and backend logic.

### Phase 2: Dynamic Signup Locations

- Fetch active client coverage from the backend.
- Show province, municipality/city, and barangay choices based on active coverage.
- Save selected location IDs on the resident profile.

### Phase 3: Admin Managed Coverage

- Add admin screens for client LGU setup.
- Allow admins to enable or disable barangays.
- Allow coordinate edits and verification.

### Phase 4: Multi-Municipality and Province Support

- Add municipality-level admins under a province client.
- Add province-wide dashboards.
- Add filtering by province, municipality, and barangay.
- Add role-based access rules per coverage area.

## Risk And Complexity Rating

Severity: High

This affects signup, user profiles, reports, dashboards, weather coverage, incident routing, and permissions.

Cost: Medium to High

The first version is manageable if limited to municipality/city clients. Province-wide support is more expensive because it requires stronger admin hierarchy and access control.

Damage if implemented poorly: High

Bad location data can cause wrong incident grouping, incorrect weather targeting, confusing dashboards, and poor LGU trust.

Complexity: Medium for municipality/city support, High for province support

The technical work is manageable, but correctness of Philippine location data and admin permissions must be handled carefully.

## Recommended Decision

Start with dynamic municipality or city coverage.

Use Naic as the first configured client, then add the next LGU as another configured location instead of writing new hardcoded logic.

Province-level coverage should remain part of the roadmap, but it should not be the first implementation target.

