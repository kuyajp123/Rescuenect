# Location Expansion Enhancement

Status: Accepted for MVP Implementation
Date: 2026-05-20

## Summary

Rescuenect currently focuses on Naic, with barangays and coordinates treated as mostly fixed application data. This enhancement expands the system so it can support different client LGUs in the Philippines without hardcoding one municipality.

The final MVP direction is to support municipality or city-level deployments only. Province-level coverage remains a future roadmap item and should not be implemented in the first location expansion work.

For weather, the MVP should use one shared weather location per municipality or city. Barangays inside the same municipality or city do not need to be grouped into separate weather zones unless a future LGU specifically needs more granular weather targeting.

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
- Keep province-wide coverage as a future roadmap option, not an MVP requirement.
- Simplify weather coverage so all barangays in one municipality or city can share the same weather data.

## Final MVP Scope

Start with one Rescuenect deployment per municipality or city.

This is the safest starter model because:

- The admin structure is simpler.
- Data cleanup is smaller.
- Incident routing is easier to understand.
- Barangay coverage is easier to verify.
- It matches how local rescue and disaster response operations often work day to day.

Province-level coverage should come later, after the system supports multiple municipalities well.

Out of scope for the MVP:

- Province-wide client coverage.
- Provincial admin hierarchy.
- Municipality or city admins under a province client.
- Required barangay weather zones inside one municipality or city.
- Barangay boundary GeoJSON management.

## Province vs Municipality Coverage

### Municipality or City Coverage

This is the selected MVP scope.

Example:

- Rescuenect Naic
- Rescuenect Tanza
- Rescuenect Trece Martires

Each client LGU manages its own barangays, responders, incidents, dashboards, announcements, and shared municipality or city weather coverage.

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

Decision: defer province coverage until Rescuenect already supports multiple municipality or city clients cleanly.

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

## Weather Coverage Decision

The current system groups Naic barangays into weather zones such as `coastal_west`, `coastal_east`, `central_naic`, `sabang`, `farm_area`, and `naic_boundary`. That grouping was mainly useful for reducing Tomorrow.io API usage while still giving several weather points inside Naic.

For the MVP location expansion, this grouping should not be required. If the product decision is that one municipality or city uses one shared weather feed, then all barangays under that municipality or city should read from the same weather location key.

Recommended MVP weather model:

```text
Client: Naic
Weather location key: naic
Weather coordinate: one verified Naic representative coordinate
Barangays: all Naic barangays
Weather data: shared by all Naic barangays
```

The same pattern applies to future clients:

```text
Client: Tanza
Weather location key: tanza
Barangays: all covered Tanza barangays
Weather data: shared by all Tanza barangays
```

Barangay weather zones can remain a future feature. Add them only if an LGU needs targeted weather alerts for coastal areas, upland areas, flood-prone zones, or other geographic differences.

## Weather Database Strategy

The existing Firestore weather structure does not need a major redesign for the MVP.

Current structure:

```text
weather/{weatherLocationKey}/realtime/data
weather/{weatherLocationKey}/hourly/{000..}
weather/{weatherLocationKey}/daily/{000..}
```

Current meaning of `weatherLocationKey`:

```text
coastal_west
coastal_east
central_naic
sabang
farm_area
naic_boundary
```

MVP meaning of `weatherLocationKey`:

```text
naic
tanza
trece_martires
```

So the database collection shape can stay the same. The implementation should change the document keys from barangay weather zones to municipality or city weather keys.

Example MVP structure:

```text
weather/naic/realtime/data
weather/naic/hourly/000
weather/naic/daily/000
```

Old zone documents can be left in Firestore during rollout and deleted later after confirming that mobile clients, backend functions, and notifications no longer read them.

## Location Data Model

A future data model can separate LGU clients from actual geographic locations. For the MVP, the client type should be limited to `municipality` or `city`.

Suggested entities:

```text
clients
- id
- name
- type: municipality | city
- status: active | inactive
- provinceCode
- municipalityCode
- cityCode
- weatherLocationKey
- weatherLatitude
- weatherLongitude

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

For the first version, this can be simplified. The important part is to stop placing barangay lists directly inside frontend or backend logic and to stop treating Naic weather zones as the required model for every LGU.

## Coordinate Strategy

Barangays are geographic areas, not exact points. For most system features, the app should store a representative coordinate for each barangay.

Recommended coordinate type:

- Use a barangay centroid when boundary data is available.
- Use a manually verified barangay hall or central point if centroid data is not available.
- Keep future support for barangay boundaries using GeoJSON.

For weather in the MVP, use one verified municipality or city representative coordinate. A municipal hall, city hall, disaster risk reduction office, or agreed central point is enough as the first weather coordinate.

Barangay representative coordinates are still useful for resident location metadata, dashboards, maps, and future routing features. For emergency routing, exact user incident coordinates should still come from the user device, map pin, or report location.

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

MVP weather setup should be part of client setup:

1. Create a client LGU.
2. Assign a municipality or city weather location key, such as `naic`.
3. Assign one verified weather coordinate for that municipality or city.
4. Fetch Tomorrow.io data once for that weather location key.
5. Let all covered barangays under that client share the same weather document.

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
- Add a Naic client configuration with a municipality weather key, such as `naic`.

### Phase 2: Simplify Weather To Municipality Or City Key

- Replace Naic weather zone keys with one municipality weather key.
- Write Tomorrow.io realtime, hourly, and daily data to `weather/naic`.
- Update mobile weather reads so every Naic barangay resolves to `naic`.
- Update weather notification targeting so Naic weather alerts can target all Naic users.
- Keep old weather zone documents temporarily during rollout.
- Rename misleading helper concepts such as `getUsersBarangay()` to something closer to `getWeatherLocationKey()` when touching that code.

### Phase 3: Dynamic Signup Locations

- Fetch active client coverage from the backend.
- Show province, municipality/city, and barangay choices based on active coverage.
- Save selected location IDs on the resident profile.

### Phase 4: Admin Managed Coverage

- Add admin screens for client LGU setup.
- Allow admins to enable or disable barangays.
- Allow coordinate edits and verification.

### Phase 5: Multi-Municipality Support

- Add additional municipality or city clients.
- Add filtering by municipality or city and barangay where needed.
- Ensure reports, dashboards, announcements, responders, and notifications are scoped to the active client.

### Phase 6: Future Province Support

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

For the MVP weather simplification, the main risk is losing sub-municipality weather granularity. This is acceptable for the first implementation because the product decision is one shared weather feed per municipality or city.

Complexity: Medium for municipality/city support, High for province support

The technical work is manageable, but correctness of Philippine location data and admin permissions must be handled carefully.

## Final Decision

Start with dynamic municipality or city coverage.

Use Naic as the first configured client, then add the next LGU as another configured location instead of writing new hardcoded logic.

Province-level coverage should remain part of the roadmap, but it should not be the first implementation target.

Do not require barangay weather zone grouping for the MVP. Use one shared municipality or city weather key and keep the existing Firestore weather collection shape.

