# RescueNect Danger Zone Reporting and Safe Routing Implementation Plan

## Purpose

This document is the verified implementation plan for the RescueNect danger-zone and safer-routing enhancement. It updates the earlier draft so it matches the current repository structure and runtime setup.

The concept is unchanged:

- Residents and LGU admins can report or create danger zones on the map.
- Resident-submitted danger zones require LGU validation before public display or route impact.
- Verified active danger zones can be used to generate safer evacuation routes.
- Mapbox remains the resident mobile map display layer.
- Leaflet remains the LGU/admin web map stack.
- OpenRouteService is introduced only for advanced route computation that avoids verified danger polygons.

This is a planning document only. No feature implementation is included here.

## Current Setup Verification

### Repository Layout

Current application areas:

- Admin web app: `Frontend`
- Mobile app: `mobile/client`
- Backend API: `Backend`
- Supabase Edge Functions: `Backend/supabase/functions`
- Firestore rules and indexes: `firestore.rules`, `firestore.indexes.json`

### Admin Web App

Verified current setup:

- React + Vite + TypeScript
- HeroUI React
- Zustand stores
- Firebase client SDK
- Existing admin map component uses Leaflet:
  - `Frontend/src/components/ui/Map/index.tsx`
  - `Frontend/src/components/ui/Map/MapStyleSelector.tsx`
- Current admin map tiles are OpenStreetMap/CARTO through Leaflet tile URLs.
- Existing evacuation center pages:
  - `Frontend/src/pages/contents/Evacuation/index.tsx`
  - `Frontend/src/pages/contents/Evacuation/AddNewCenter.tsx`
  - `Frontend/src/components/ui/form/EvacuationCenterForm.tsx`
- Existing evacuation center store:
  - `Frontend/src/stores/useEvacuationStore.ts`
- Existing admin API config:
  - `Frontend/src/config/endPoints.ts`

Plan impact:

- The old plan's statement that the admin app should use Leaflet for new danger-zone drawing is aligned with the current system.
- Admin danger-zone operations should extend the existing Leaflet stack instead of adding Mapbox to `Frontend`.
- Leaflet supports the required admin geometries through markers, circles, polylines, polygons, and either a compatible drawing plugin or custom Leaflet controls.
- Danger-zone reporting and verification should be a new admin module, added as a new LGU sidebar item and page.
- Current admin navigation integration points are `Frontend/src/components/ui/sideBar/SideBar.tsx` and `Frontend/src/router.tsx`.
- Best-route path work should not become part of the admin danger-zone module. It should extend the evacuation-center/routing flow.

### Mobile App

Verified current setup:

- Expo React Native
- Expo Router
- Firebase client SDK and React Native Firebase Messaging
- Mapbox via `@rnmapbox/maps`
- Existing global Mapbox token setup:
  - `mobile/client/app/_layout.tsx`
  - `MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API_TOKEN!)`
- Existing reusable Mapbox map context:
  - `mobile/client/contexts/MapContext.tsx`
- Existing reusable Mapbox display component:
  - `mobile/client/components/ui/map/MapView.tsx`
- Existing generic map-bottom-sheet form component:
  - `mobile/client/components/components/Map/index.tsx`
- Current evacuation center map screen:
  - `mobile/client/app/(app)/evacuation.tsx`
- Existing mobile API config:
  - `mobile/client/config/endpoints.ts`

Plan impact:

- Mobile already has Mapbox support and should extend the existing Mapbox components.
- Do not create a disconnected map framework for danger zones.
- Route lines and danger-zone layers should be rendered with Mapbox `ShapeSource` layers.
- Mobile does not currently have route computation or OpenRouteService integration.
- The bottom navigation already has a central `+` FAB in `mobile/client/components/components/CustomTabBar/index.tsx`.
- The FAB currently routes directly to `status/createStatus`; the plan should change it to open an action sheet with "Create Status" and "Report Danger Zone".
- Danger-zone reporting should be a new mobile stack/module, while safe-route display should extend `mobile/client/app/(app)/evacuation.tsx`.

### Backend

Verified current setup:

- Express + TypeScript
- Firebase Admin SDK / Firestore
- Supabase Storage for uploaded assets
- Axios already installed in `Backend/package.json`
- Existing route layers:
  - `Backend/src/routes/admin`
  - `Backend/src/routes/mobile`
  - `Backend/src/routes/unified`
- Existing auth and access middleware:
  - `Backend/src/middlewares/AuthMiddleware.ts`
  - `Backend/src/middlewares/AdminMiddleware.ts`
  - `Backend/src/middlewares/ResidentClientMiddleware.ts`
  - `Backend/src/middlewares/RateLimitMiddleware.ts`
- Existing evacuation center backend:
  - `Backend/src/routes/admin/evacuationRoutes.ts`
  - `Backend/src/controllers/admin/Evacuation.Controller.ts`
  - `Backend/src/models/admin/EvacuationModel.ts`
  - `Backend/src/controllers/unified/Unified.Controller.ts`
  - `Backend/src/models/unified/index.ts`

Plan impact:

- There is currently no danger-zone model, controller, service, or route module.
- There is currently no OpenRouteService integration.
- There is currently no Mapbox Directions integration in the backend.
- Route computation should be implemented as backend service logic, not directly from the mobile client, so verified danger-zone checks and API keys remain centralized.
- Danger-zone reporting APIs should be new backend modules.
- Best-route computation should extend the evacuation/unified routing surface that already serves evacuation centers, instead of being placed under the danger-zone reporting module.

### Current Evacuation Center Data

The old plan used an `evacuationCenters` collection and `status: "open"`.

Current system uses:

- Firestore collection: `centers`
- Coordinate field: `coordinates: { lat, lng }`
- Status values:
  - `available`
  - `full`
  - `closed`
- Capacity is currently stored as a string.
- Images are stored in Supabase Storage and referenced from the Firestore document.
- Client scoping is handled with `clientId`.

Safe-routing filter for the first implementation should use:

```ts
center.status === "available" && center.coordinates != null
```

Do not require these fields in the first routing implementation because they do not exist yet:

```ts
isActive
isSafe
currentOccupancy
```

Those fields may be added in a later evacuation-center enhancement if needed.

### Notifications

Verified current setup:

- Notification records are stored in Firestore collection `notifications`.
- Backend services already create records and send FCM for admin/resident use cases.
- Supabase Edge Functions handle weather and earthquake scheduled processing.
- Existing notification type unions do not yet include `danger_zone`.

Plan impact:

- Danger-zone notifications should reuse the existing notification record shape.
- Add `danger_zone` as a notification type, or use `emergency` with `data.notificationCategory = "danger_zone"` if the implementation wants the smallest type change.
- Prefer a backend notification service for verification/resolution events.
- Scheduled expiry can be implemented as a Supabase Edge Function or backend scheduled worker, depending on deployment preference.

### Package and API Gaps

Currently missing:

- Admin Leaflet drawing/editing support for danger-zone creation and review.
- OpenRouteService API key/env integration.
- Direct route geometry/safety dependency in the backend.
- Direct Turf dependency in `Backend/package.json`.

Important detail:

- Turf packages appear in `mobile/client/package-lock.json` only as transitive dependencies of `@rnmapbox/maps`.
- Do not rely on those transitive packages.
- Add explicit backend geometry dependencies during implementation.

## Provider Responsibilities

### Mapbox

Use Mapbox for the resident mobile app:

- User location display
- Evacuation center markers on the resident map
- Danger-zone shapes on the resident map
- Resident route line display
- Normal routing when no verified active danger zones exist

Current mobile Mapbox support already exists through `@rnmapbox/maps`.

Backend Mapbox Directions integration is still needed for normal route computation. Admin web should not add Mapbox for this enhancement.

### Leaflet

Use Leaflet for the LGU/admin web app:

- Evacuation center markers on admin maps
- Danger-zone markers, circles, lines, and polygons
- Pending report review and official danger-zone creation
- Optional admin route previews, if that view is added later

Current admin Leaflet support already exists through `leaflet` and `react-leaflet`. Core Leaflet supports the display geometry needed here. Interactive line and polygon drawing may require a compatible drawing/editing package, such as `leaflet-draw` with a React wrapper, or a custom control built around Leaflet primitives. Compatibility must be verified against the current `react-leaflet` version before choosing a package.

### OpenRouteService

Use OpenRouteService for:

- Advanced route computation when verified active danger zones exist
- Avoiding verified danger polygons
- Returning safer route geometry for display in the resident mobile Mapbox map

OpenRouteService `avoid_polygons` accepts GeoJSON Polygon or MultiPolygon values in the directions request options. Point, circle, and line danger zones must be converted to buffered polygons before sending them to OpenRouteService.

Official references:

- Mapbox Directions API: https://docs.mapbox.com/api/navigation/directions/
- OpenRouteService routing options: https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/routing-options

## Module Boundary Decisions

### Danger Zone Reporting Module

Danger-zone reporting is a new module. It owns:

- Resident danger-zone report creation
- LGU/admin report review
- LGU/admin official danger-zone creation
- Verification, rejection, resolution, and expiry state changes
- Public verified active danger-zone reads
- Danger-zone notification events
- Admin Leaflet danger-zone map tools

It should not own evacuation-center selection or route computation.

### Evacuation Center Routing Extension

Best route path work should extend the existing evacuation-center flow. It owns:

- Fetching available evacuation centers from `centers`
- Selecting candidate evacuation centers
- Calling Mapbox Directions when no verified active danger zones exist
- Calling OpenRouteService when verified active danger zones exist
- Returning route geometry, provider metadata, selected center, warnings, distance, and duration
- Displaying the route line in the resident mobile evacuation map

This keeps "where should I evacuate and how should I get there" inside the evacuation module, while "what danger zones exist and are they verified" stays inside the danger-zone module.

### Admin Module Boundary

Admin danger-zone reporting should be a new sidebar module:

- Add a new LGU sidebar item in `Frontend/src/components/ui/sideBar/SideBar.tsx`.
- Add a new route in `Frontend/src/router.tsx`, such as `/danger-zones`.
- Add new page files under `Frontend/src/pages/contents/DangerZones`.
- Keep route planning out of this first admin danger-zone page unless a later admin route-preview requirement is explicitly added.

### Mobile Module Boundary

Resident danger-zone reporting should be reachable from the existing bottom-navigation FAB:

- Update `mobile/client/components/components/CustomTabBar/index.tsx` so the `+` button opens the already registered `FAB` action sheet instead of going straight to `status/createStatus`.
- Keep "Create Status" as one FAB action.
- Add "Report Danger Zone" as a second FAB action.
- Add a new `danger-zone` stack under `mobile/client/app/(app)`.
- Extend the evacuation screen for best route path display instead of adding safe routing inside the danger-zone reporting screen.

## Non-Negotiable Safety Rules

Resident-submitted reports must not affect public routing until verified.

Only this state can affect public map display and route avoidance:

```ts
status === "verified" && isActive === true
```

Pending, rejected, resolved, or expired reports must not be used for public route avoidance.

All generated routes must be shown as guidance only, not as guaranteed safety instructions.

## Role and Geometry Rules

### Residents

Residents are allowed to create danger zones from the mobile map using only:

- Point
- Circle radius

Resident-created zones must start as:

```ts
source: "resident_report"
status: "pending"
isActive: true
```

Residents cannot:

- Create polygon danger zones
- Create line or road-segment danger zones
- Create verified danger zones directly
- Edit official LGU-created danger zones
- Make pending reports affect route computation

### LGU Admins

LGU admins are allowed to create and manage danger zones from the admin web map using:

- Point
- Circle
- Line / road segment
- Polygon / custom drawing

LGU-created official zones should normally start as:

```ts
source: "lgu_official"
status: "verified"
isActive: true
```

LGU admins can:

- View pending resident reports
- Verify resident reports
- Reject resident reports
- Mark danger zones as resolved
- Mark danger zones as expired when appropriate
- Create official verified danger zones directly
- Edit active official danger zones

## Recommended Firestore Collection

Use one collection for both resident reports and LGU-created official zones:

```txt
dangerZones/{dangerZoneId}
```

Reason:

- The system ultimately routes against verified active danger zones, regardless of whether the source was resident-submitted or LGU-created.
- `source` and `status` fields can distinguish pending resident reports from official zones.

Suggested document shape:

```ts
dangerZones/{dangerZoneId} {
  clientId: string;

  source: "resident_report" | "lgu_official";
  status: "pending" | "verified" | "rejected" | "resolved" | "expired";
  isActive: boolean;

  type:
    | "flooded_road"
    | "road_blockage"
    | "heavy_traffic"
    | "landslide_or_debris"
    | "bridge_damage"
    | "fire"
    | "accident"
    | "unsafe_area"
    | "power_line_hazard"
    | "other";

  severity: "low" | "medium" | "high" | "critical";
  description: string;
  photoUrls?: string[];

  geometryType: "point" | "circle" | "line" | "polygon";

  // Required for point and circle.
  center?: {
    lat: number;
    lng: number;
  };

  // Required for circle.
  radiusMeters?: number;

  // Required for line and polygon.
  // GeoJSON coordinates must always be [longitude, latitude].
  geojson?: GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon | null;

  // Route avoidance shape generated from the chosen geometry.
  // Point, circle, and line are converted to polygons for OpenRouteService.
  avoidGeojson?: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;

  barangay?: string;
  municipality?: string;
  province?: string;

  reportedBy: string;
  reportedByRole: "resident" | "lgu_admin" | "super_admin";

  verifiedBy?: string | null;
  verifiedAt?: FirebaseFirestore.Timestamp | null;

  rejectedBy?: string | null;
  rejectedAt?: FirebaseFirestore.Timestamp | null;
  rejectionReason?: string | null;

  resolvedBy?: string | null;
  resolvedAt?: FirebaseFirestore.Timestamp | null;

  expiresAt?: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

## Geometry Handling

### Point

Use for exact incidents such as accidents, fallen poles, blocked intersections, or a precise hazard location.

Stored as:

```ts
{
  geometryType: "point",
  center: { lat: 14.2919325, lng: 120.7752839 },
  radiusMeters: null
}
```

Routing conversion:

- Convert to a small polygon buffer before sending to OpenRouteService.
- Suggested default buffer: 30 to 50 meters.
- The buffer must be visible enough to explain why a route is avoiding the point.

### Circle

Use for resident reports and LGU radius-based hazards.

Stored as:

```ts
{
  geometryType: "circle",
  center: { lat: 14.2919325, lng: 120.7752839 },
  radiusMeters: 100
}
```

Routing conversion:

- Convert to a polygon approximation for `avoidGeojson`.
- Render as a filled polygon or circle-like shape on resident mobile Mapbox and admin Leaflet.

### Line / Road Segment

LGU admin only.

Use for blocked road segments, damaged bridges, or impassable road stretches.

Stored as:

```ts
{
  geometryType: "line",
  geojson: {
    type: "LineString",
    coordinates: [
      [120.7752, 14.2919],
      [120.7760, 14.2925]
    ]
  }
}
```

Routing conversion:

- Buffer the line into a corridor polygon.
- Suggested corridor width: 15 to 30 meters unless the admin enters a custom affected width.

### Polygon

LGU admin only.

Use for larger affected areas such as flooded zones, fire zones, landslide areas, or unsafe neighborhoods.

Stored as:

```ts
{
  geometryType: "polygon",
  geojson: {
    type: "Polygon",
    coordinates: [
      [
        [120.7752, 14.2919],
        [120.7760, 14.2925],
        [120.7770, 14.2915],
        [120.7752, 14.2919]
      ]
    ]
  }
}
```

Routing conversion:

- Use the polygon directly as `avoidGeojson` after validation and normalization.

## Backend Architecture Plan

### New Backend Modules

Add danger-zone reporting modules that match the current Express structure:

```txt
Backend/src/routes/admin/dangerZoneRoutes.ts
Backend/src/routes/mobile/dangerZoneRoutes.ts
Backend/src/routes/unified/dangerZoneRoutes.ts

Backend/src/controllers/admin/DangerZone.Controller.ts
Backend/src/controllers/mobile/DangerZone.Controller.ts
Backend/src/controllers/unified/DangerZone.Controller.ts

Backend/src/models/admin/DangerZoneModel.ts
Backend/src/models/mobile/DangerZoneModel.ts
Backend/src/models/unified/DangerZoneModel.ts

Backend/src/services/DangerZoneGeometryService.ts
Backend/src/services/DangerZoneNotificationService.ts
```

Extend evacuation/unified routing for best route path:

```txt
Backend/src/controllers/unified/Unified.Controller.ts
Backend/src/models/unified/index.ts
Backend/src/routes/unified/index.ts

Backend/src/services/SafeRoutingService.ts
Backend/src/services/MapboxDirectionsService.ts
Backend/src/services/OpenRouteService.ts
```

If the unified controller becomes too large, add a focused evacuation routing controller/model and mount it from the existing unified route layer. The important boundary is that best-route computation belongs to evacuation routing, not danger-zone reporting.

### Suggested Backend Endpoints

Use names consistent with the existing backend style.

Admin:

```txt
GET    /admin/danger-zones/getReports
GET    /admin/danger-zones/getZones
POST   /admin/danger-zones/createOfficial
PATCH  /admin/danger-zones/verifyReport
PATCH  /admin/danger-zones/rejectReport
PATCH  /admin/danger-zones/resolveZone
PATCH  /admin/danger-zones/updateZone
```

Mobile:

```txt
POST   /mobile/danger-zones/createReport
GET    /mobile/danger-zones/myReports
```

Unified/public-read:

```txt
GET    /unified/danger-zones/public
GET    /unified/danger-zones/active
```

Evacuation routing extension:

```txt
POST   /unified/getBestEvacuationRoute
```

Best-route computation should be protected because it uses user context or current location. Public danger-zone display can be unified/public-read only if it returns verified active zones and is scoped by `clientId`.

### Middleware and Access Control

Use existing middleware patterns:

- Admin danger-zone routes:
  - `AuthMiddleware.verifyToken`
  - `AdminMiddleware.requireAdmin`
  - `AdminMiddleware.requireClientAccess`
  - `AdminMiddleware.blockLguWritesWhenClientDeletionScheduled` for writes
- Resident danger-zone report routes:
  - `AuthMiddleware.verifyToken`
  - `AuthMiddleware.requireOwnUid`
  - `ResidentClientMiddleware.blockWritesWhenClientUnavailable`
- Safe route computation:
  - Use authenticated route middleware.
  - Use rate limiter category `expensive` or a new route-specific limiter.

### Backend Validation

Validate on the backend:

- `clientId` must come from the authenticated user/admin scope.
- Residents may only submit `point` or `circle`.
- Residents cannot submit `status: "verified"`.
- LGU admins may submit `point`, `circle`, `line`, or `polygon`.
- Coordinates must be finite and in valid ranges.
- GeoJSON must be valid and use `[lng, lat]`.
- Radius must be within configured min/max.
- Severity and type must be allowed values.
- Pending reports must not be returned from public endpoints.
- Route endpoints must only use verified active danger zones.

## Package and Environment Plan

### Backend Package Changes

Add explicit geometry dependencies to `Backend/package.json` during implementation.

Recommended approach:

- Use `axios`, already installed, for OpenRouteService and Mapbox Directions HTTP calls.
- Add Turf or targeted Turf packages for geometry conversion and intersection checks.

Candidate packages:

```txt
@turf/turf
```

or smaller targeted packages:

```txt
@turf/helpers
@turf/buffer
@turf/boolean-intersects
@turf/boolean-point-in-polygon
@turf/line-intersect
```

Prefer targeted packages if bundle/runtime size becomes a concern.

OpenRouteService can be called directly with `axios`. If the team prefers an SDK, evaluate an OpenRouteService JavaScript SDK during implementation and add it only to `Backend/package.json`.

### Frontend Package Changes

Admin web should keep using Leaflet for the danger-zone workflow.

Already present:

```txt
leaflet
react-leaflet
```

Candidate package options for admin drawing/editing:

```txt
leaflet-draw
react-leaflet-draw
```

Type packages may be needed depending on the selected drawing package:

```txt
@types/leaflet-draw
```

Before installing a React wrapper, verify compatibility with the current `react-leaflet` version in `Frontend/package.json` (`^5.0.0-rc.2`). If no compatible wrapper is acceptable, implement the admin drawing controls with Leaflet primitives and React state.

### Mobile Package Changes

Mobile already has:

```txt
@rnmapbox/maps
```

No OpenRouteService package should be added to mobile. Mobile should call the backend evacuation best-route endpoint and display the returned route GeoJSON on Mapbox.

### Environment Variables

Add backend env vars:

```txt
MAPBOX_DIRECTIONS_ACCESS_TOKEN=...
OPENROUTESERVICE_API_KEY=...
```

Existing mobile Mapbox env var:

```txt
EXPO_PUBLIC_MAPBOX_API_TOKEN=...
```

Do not expose the OpenRouteService API key in mobile or frontend clients.

## Routing Plan

Best route path is an evacuation-center module extension. It should be implemented from the mobile evacuation screen and backend evacuation/unified route layer, not from the danger-zone reporting module.

### Routing Decision

When a user requests a route to an evacuation center:

1. Fetch available evacuation centers from `centers`.
2. Filter to the user's active `clientId`.
3. Keep only centers with valid coordinates and `status === "available"`.
4. Fetch verified active danger zones for the same `clientId`.
5. If no verified active danger zones exist, use Mapbox Directions for normal routing.
6. If verified active danger zones exist, use OpenRouteService with `avoid_polygons`.
7. Return route geometry, distance, duration, selected center, provider used, and safety warnings.
8. Display the route line in the resident mobile Mapbox map.

### Candidate Evacuation Center Selection

Initial implementation:

- Sort available centers by straight-line distance from origin.
- Evaluate top 3 to 5 candidates.
- Choose the first successful safe route with reasonable travel time.

Later improvement:

- Score candidate routes by duration, distance, capacity, danger severity, and confidence.
- Add occupancy/current population if the evacuation center model gains those fields.

### Normal Route Flow Without Danger Zones

Use Mapbox Directions when no verified active danger zones exist.

```txt
origin
-> available evacuation center candidates
-> Mapbox Directions
-> route GeoJSON
-> display route line on resident mobile Mapbox
```

Mapbox request should ask for GeoJSON geometry:

```txt
geometries=geojson
overview=full
```

### Safe Route Flow With Danger Zones

Use OpenRouteService when verified active danger zones exist.

```txt
origin
-> available evacuation center candidates
-> verified active danger zones
-> convert all danger zones to avoid polygons
-> OpenRouteService directions request
-> safer route GeoJSON
-> display route line on resident mobile Mapbox
```

OpenRouteService avoidance body concept:

```ts
{
  coordinates: [
    [originLng, originLat],
    [destinationLng, destinationLat]
  ],
  options: {
    avoid_polygons: {
      type: "MultiPolygon",
      coordinates: [...]
    }
  }
}
```

### Travel Profiles

Map UI labels should map to provider profiles:

| UI Label | Mapbox Profile | OpenRouteService Profile |
|---|---|---|
| Driving | `mapbox/driving` or `mapbox/driving-traffic` | `driving-car` |
| Walking | `mapbox/walking` | `foot-walking` |
| Cycling | `mapbox/cycling` | `cycling-regular` |

Driving should be the first supported profile unless product requirements say otherwise.

### Fallback Behavior

If OpenRouteService fails while danger zones exist:

- Do not silently claim the Mapbox route is safe.
- Either show "safer route unavailable" or show a Mapbox fallback route with a clear warning that it may cross verified danger zones.
- Log provider failures for diagnostics.
- Preserve a user-facing safety warning.

## Map Display Plan

### Mobile Map

Extend:

- `mobile/client/components/ui/map/MapView.tsx`
- `mobile/client/contexts/MapContext.tsx` only if shared map state is needed
- `mobile/client/app/(app)/evacuation.tsx` for route request/display
- `mobile/client/config/endpoints.ts` with an evacuation best-route endpoint

Add support for:

- `dangerZones` prop
- `routeGeoJson` prop
- Mapbox filled polygon layers for danger zones
- Mapbox line layer for route geometry
- Point and circle danger-zone rendering
- Selected danger-zone details sheet/modal

Do not calculate OpenRouteService routes in the mobile app.

### Mobile FAB Entry Point

Extend the existing bottom-navigation FAB instead of adding a normal tab.

Current integration point:

```txt
mobile/client/components/components/CustomTabBar/index.tsx
mobile/client/components/components/ActionSheet/sheets.tsx
```

Required FAB behavior:

- Pressing `+` opens the existing `FAB` action sheet.
- Action 1: `Create Status`, routes to `status/createStatus`.
- Action 2: `Report Danger Zone`, routes to `danger-zone/create`.
- The FAB should not immediately route to status creation once danger-zone reporting exists.
- Keep the four existing bottom tabs unchanged.

### Mobile Danger Zone Reporting

Suggested mobile file placement:

```txt
mobile/client/app/(app)/danger-zone/_layout.tsx
mobile/client/app/(app)/danger-zone/create.tsx
mobile/client/components/components/danger-zone/DangerZoneForm.tsx
mobile/client/components/components/danger-zone/DangerZoneMapPicker.tsx
mobile/client/services/dangerZoneService.ts
mobile/client/types/dangerZone.ts
```

Mobile app layout integration:

```txt
mobile/client/app/(app)/_layout.tsx
```

Add a `danger-zone` stack screen beside the existing `status` and `evacuation` stack screens.

Resident form fields:

- Geometry type: Point or Circle only
- Location source: current location or map tap
- Radius: required only for circle
- Type
- Severity
- Description
- Optional photo evidence

### Admin Map

Add a Leaflet admin danger-zone map by extending the existing admin map stack.

Suggested admin file placement:

```txt
Frontend/src/pages/contents/DangerZones/index.tsx
Frontend/src/pages/contents/DangerZones/DangerZoneDetails.tsx
Frontend/src/components/ui/Map/AdminDangerZoneMap.tsx
Frontend/src/components/ui/danger-zone/DangerZoneForm.tsx
Frontend/src/components/ui/danger-zone/DangerZoneReviewModal.tsx
Frontend/src/stores/useDangerZoneStore.ts
Frontend/src/types/dangerZone.ts
```

Admin navigation integration:

```txt
Frontend/src/components/ui/sideBar/SideBar.tsx
Frontend/src/router.tsx
Frontend/src/config/endPoints.ts
```

Add a new LGU sidebar item and route for the danger-zone module. Suggested route:

```txt
/danger-zones
```

Admin drawing controls:

- Point marker
- Circle radius
- Line / road segment
- Polygon / custom drawing

Recommended drawing package:

- Core Leaflet layers for marker, circle, polyline, and polygon display
- A compatible Leaflet drawing/editing plugin for line and polygon creation, or custom drawing controls if wrapper compatibility is poor
- Custom radius control for circle creation if the selected drawing plugin does not cover the desired UX

## Notifications Plan

Notify users when:

- LGU admin verifies a resident danger-zone report
- LGU admin creates an official danger zone
- LGU admin marks a major road segment as blocked
- LGU admin marks a danger zone as resolved

Notification targeting:

- Same `clientId`
- Prefer affected barangays if the danger zone has barangay metadata
- Otherwise notify all residents in the client scope

Recommended notification type:

```ts
type: "danger_zone"
```

If the team wants fewer type changes in the first pass:

```ts
type: "emergency",
data: {
  notificationCategory: "danger_zone"
}
```

Notification record should include:

```ts
{
  clientId,
  dangerZoneId,
  dangerType,
  severity,
  status,
  geometryType,
  source: "resident_report" | "lgu_official"
}
```

## Firestore Rules Plan

Add rules for `dangerZones`.

Recommended initial rule posture:

- Reads:
  - Residents can read verified active danger zones for their `clientId`.
  - LGU admins can read all danger zones for their `clientId`.
  - Super admins can read all danger zones.
- Writes:
  - Prefer backend Admin SDK writes only.
  - If direct client writes are later allowed, enforce resident pending-only creation in rules.

Backend-only write posture:

```txt
match /dangerZones/{dangerZoneId} {
  allow read: if isSuperAdmin()
              || isLguAdminOf(resource.data.clientId)
              || (
                isResidentOf(resource.data.clientId)
                && resource.data.status == "verified"
                && resource.data.isActive == true
              );
  allow write: if false;
}
```

If mobile later subscribes directly to public danger zones, queries must include enough filters for Firestore rules to evaluate safely, such as:

```txt
clientId == residentClientId
status == "verified"
isActive == true
```

## Firestore Index Plan

Likely indexes:

```txt
dangerZones: clientId ASC, status ASC, isActive ASC, createdAt DESC
dangerZones: clientId ASC, source ASC, status ASC, createdAt DESC
dangerZones: clientId ASC, expiresAt ASC
```

For the first LGU-scoped release, fetching verified active zones by `clientId` and filtering in memory is acceptable if zone volume is low.

If zone volume grows:

- Add geohash or bounding-box helper fields.
- Query by route bounding box before ORS conversion.
- Paginate admin report lists.

## Implementation Phases

### Phase 1 - Danger Zone Reporting Module MVP

Goal:

- Build the danger-zone reporting module end to end.
- Do not change evacuation routing behavior yet.
- Store verified active danger zones in a shape that later phases can display and route against.

Backend scope:

- Add the `dangerZones` Firestore collection contract.
- Add backend-only APIs for resident reports, admin review, official Point/Circle creation, and public verified-active reads.
- Add Point/Circle payload validation.
- Reuse existing `upload.single("image")` validation for one optional resident evidence image.
- Store evidence in Supabase under a danger-zone evidence path or bucket.
- Save resident reports as `source: "resident_report"`, `status: "pending"`, and `isActive: true`.
- Save LGU official Point/Circle zones as `source: "lgu_official"`, `status: "verified"`, and `isActive: true`.
- Ensure all mobile/admin reads and writes are scoped by `clientId`.
- Ensure public reads return only `status === "verified" && isActive === true`.
- Deny direct Firestore client writes to `dangerZones`.

Admin web scope:

- Add LGU sidebar module `Danger Zones`.
- Add protected admin route `/danger-zones`.
- Add report list filters for pending, verified, rejected, resolved, and expired.
- Show report details, evidence photo, and Leaflet Point/Circle preview.
- Allow LGU admins to verify, reject with reason, and resolve.
- Allow LGU admins to create official Point/Circle zones.
- Do not expose Line/Polygon controls in Phase 1.

Mobile scope:

- Update the bottom-navigation `+` FAB to open the existing action sheet.
- Add FAB actions:
  - `Create Status` -> `status/createStatus`
  - `Report Danger Zone` -> `danger-zone/create`
- Add resident `danger-zone` stack and create screen.
- Resident reporting supports only Point and Circle radius.
- Location source supports current location or map tap.
- Circle requires `radiusMeters`.
- Type, severity, description, and geometry are required.
- One photo evidence image is optional.
- Success state clearly says the report is pending LGU verification.

Explicitly out of scope:

- No Line/Road Segment creation.
- No Polygon/custom drawing.
- No Mapbox Directions backend routing.
- No OpenRouteService integration.
- No best-route endpoint implementation.
- No evacuation-center behavior changes.

Exit criteria:

- Resident can submit Point/Circle reports only.
- LGU admin can review, verify, reject, resolve, and create official Point/Circle zones.
- Pending/rejected/resolved/expired zones do not appear from public APIs.
- Existing status creation and evacuation-center flows still work.

### Phase 2 - Full Admin Drawing and Public Danger Zone Display

Goal:

- Expand official LGU danger-zone geometry beyond Point/Circle.
- Display verified active danger zones on both admin Leaflet and resident mobile Mapbox maps.
- Keep route computation unchanged.

Backend scope:

- Extend danger-zone validation to support admin-only `geometryType: "line" | "polygon"`.
- Add or finalize `PATCH /admin/danger-zones/updateZone`.
- Store LineString and Polygon as GeoJSON with `[lng, lat]` coordinates.
- Add geometry normalization and validation for line and polygon records.
- Generate `avoidGeojson` for admin-created line and polygon zones, or prepare the field for Phase 4 route avoidance.
- Keep residents limited to Point/Circle.

Admin web scope:

- Add Leaflet drawing/editing for Line / road segment.
- Add Leaflet drawing/editing for Polygon / custom drawing.
- Allow LGU admins to edit active official zones.
- Render all danger-zone geometry types on the admin map.
- Add detail panels/modals for active verified zones.
- Confirm selected Leaflet drawing package compatibility with current `react-leaflet`.

Mobile scope:

- Fetch verified active danger zones through the unified/public endpoint.
- Render Point, Circle, Line, and Polygon zones on the resident Mapbox evacuation map.
- Add selected danger-zone details sheet/modal.
- Keep danger-zone reporting screen limited to Point/Circle.

Explicitly out of scope:

- No best-route computation.
- No OpenRouteService requests.
- No route avoidance yet.

Exit criteria:

- LGU admins can create and edit Point, Circle, Line, and Polygon danger zones.
- Residents can see only verified active danger zones for their client.
- Resident-created pending reports still do not appear publicly.

### Phase 3 - Evacuation Best Route Baseline

Goal:

- Extend the evacuation-center module with basic best-route behavior.
- Use Mapbox normal routing when no verified active danger zones exist.
- Keep safer avoidance routing for Phase 4.

Backend scope:

- Add `POST /unified/getBestEvacuationRoute` or the agreed evacuation-route endpoint.
- Add `MapboxDirectionsService`.
- Select candidate evacuation centers from the existing `centers` collection.
- Use `center.status === "available" && center.coordinates != null`.
- Evaluate nearest available centers by straight-line distance.
- Return selected center, route GeoJSON, distance, duration, provider metadata, and warnings.
- Return explicit warnings that route guidance is advisory.

Mobile scope:

- Extend `mobile/client/app/(app)/evacuation.tsx` to request best route.
- Add route line display on Mapbox.
- Add route loading, success, empty, and failure states.
- Show selected evacuation center information.
- Show safety warning near route guidance.

Admin web scope:

- No required admin changes.
- Optional read-only route diagnostics can be deferred.

Explicitly out of scope:

- No OpenRouteService.
- No `avoid_polygons`.
- Do not claim a route is danger-zone avoiding.

Exit criteria:

- Resident can request a normal route to an available evacuation center.
- Route line renders on mobile Mapbox.
- If no verified active danger zones exist, Mapbox is used.
- If verified active danger zones exist, the endpoint either returns a clear not-yet-safer warning or waits for Phase 4 behavior, depending on product choice.

### Phase 4 - OpenRouteService Safer Routing

Goal:

- Add advanced route computation that avoids verified active danger-zone polygons.
- Use OpenRouteService only from the backend.

Backend scope:

- Add OpenRouteService API key/env configuration.
- Add `OpenRouteService` backend service.
- Add explicit backend geometry dependencies as needed, such as Turf packages.
- Convert Point, Circle, and Line danger zones into polygon buffers.
- Normalize Polygon zones for ORS `avoid_polygons`.
- Merge or package verified active danger zones as GeoJSON Polygon/MultiPolygon.
- Use ORS when verified active danger zones exist.
- Keep Mapbox as the normal route provider when no verified active zones exist.
- Add provider fallback behavior:
  - Do not silently claim a fallback route is safer.
  - Return warnings when ORS fails.
  - Preserve provider failure diagnostics.

Mobile scope:

- Display safer route geometry returned by the backend.
- Display provider and safety warning copy.
- Show fallback warning if ORS fails and Mapbox route is used.
- Render verified active danger zones with the route line.

Admin web scope:

- Optional route-preview diagnostics remain deferred unless explicitly required.

Explicitly out of scope:

- No offline routing.
- No advanced route scoring beyond nearest available candidates unless needed for correctness.

Exit criteria:

- With verified active danger zones, backend requests ORS with valid `avoid_polygons`.
- Returned route avoids avoidable verified danger zones when ORS succeeds.
- ORS failure returns clear user-facing warnings.
- API keys stay server-side.

### Phase 5 - Notifications and Expiry

Goal:

- Notify affected users about important danger-zone lifecycle changes.
- Add lifecycle automation so stale hazards do not stay active forever.

Backend scope:

- Add `DangerZoneNotificationService`.
- Add notification type `danger_zone`, or use `type: "emergency"` with `data.notificationCategory = "danger_zone"`.
- Create notification records for:
  - Resident report verified
  - Official LGU danger zone created
  - Major road segment blocked
  - Danger zone resolved
- Send FCM through the existing notification delivery flow.
- Add audit metadata for verification, rejection, resolution, expiry, and edits.
- Add `expiresAt` handling.

Scheduled processing scope:

- Add a Supabase Edge Function or backend scheduled worker for expiry.
- Mark expired zones as `status: "expired"` and `isActive: false`.
- Avoid notifying repeatedly for the same expired zone.

Admin web scope:

- Add expiry controls and audit details.
- Add filter visibility for expired zones.
- Add notification confirmation states where useful.

Mobile scope:

- Render danger-zone notifications in existing notification views.
- Deep link or route users to relevant map/report context if supported.

Explicitly out of scope:

- No advanced geofenced push targeting unless barangay/affected-area metadata is reliable.
- No separate resident inbox redesign.

Exit criteria:

- Verification, official creation, major road blockage, and resolution can notify affected residents.
- Expired danger zones stop appearing publicly and stop affecting routing.
- Admins can audit who changed a danger zone and when.

### Phase 6 - Hardening, Spatial Scale, and Operational Readiness

Goal:

- Make the danger-zone and safer-routing system production-ready at larger volume.
- Improve reliability, observability, testing, and route quality.

Backend scope:

- Add focused unit/integration tests for danger-zone validation, client scoping, status transitions, and routing provider fallback.
- Add Firestore indexes based on real query patterns.
- Add spatial pre-filtering, such as geohash or bounding-box helper fields, before ORS conversion.
- Add pagination for admin report and zone lists.
- Add backend rate limits for route computation and report creation.
- Add structured logs for route provider calls and danger-zone lifecycle actions.
- Add monitoring for ORS/Mapbox failures, latency, and quota pressure.
- Add route scoring improvements using distance, duration, severity, confidence, and center status.

Admin web scope:

- Add bulk filters, search, and operational views for high-volume LGU use.
- Add better edit history and rollback/reopen flows if needed.
- Add map performance improvements for many zones.

Mobile scope:

- Add route refresh behavior when user location changes meaningfully.
- Add clearer offline/unavailable provider states.
- Add route/danger-zone map performance optimization.
- Add accessibility and copy review for emergency guidance.

Data/model scope:

- Consider evacuation-center fields such as `currentOccupancy`, `isSafe`, and capacity normalization if routing quality requires them.
- Consider danger-zone confidence, verification notes, and affected barangays.

Explicitly out of scope:

- No autonomous safety guarantees.
- No replacement for LGU/emergency responder instructions.

Exit criteria:

- Core flows have automated coverage.
- Route computation is rate-limited, observable, and resilient to provider failures.
- Admin and mobile maps remain usable with realistic danger-zone volume.
- Operational docs and deployment notes are ready for production handoff.

## Phase 1 Implementation Plan

### Phase 1 Goal

Build the danger-zone reporting module end to end without changing evacuation routing behavior yet.

Phase 1 should prove:

- Residents can reach danger-zone reporting from the existing mobile `+` FAB.
- Residents can submit only Point or Circle danger-zone reports.
- Submitted resident reports are saved as pending.
- LGU admins have a new sidebar module and page for danger-zone reports.
- LGU admins can review, verify, reject, and resolve reports.
- Verified active danger zones are stored correctly for later public display and safe routing.
- Existing status creation and evacuation-center behavior continues to work.

### Phase 1 Backend Tasks

Add danger-zone reporting modules:

```txt
Backend/src/routes/mobile/dangerZoneRoutes.ts
Backend/src/routes/admin/dangerZoneRoutes.ts
Backend/src/routes/unified/dangerZoneRoutes.ts
Backend/src/controllers/mobile/DangerZone.Controller.ts
Backend/src/controllers/admin/DangerZone.Controller.ts
Backend/src/controllers/unified/DangerZone.Controller.ts
Backend/src/models/mobile/DangerZoneModel.ts
Backend/src/models/admin/DangerZoneModel.ts
Backend/src/models/unified/DangerZoneModel.ts
Backend/src/services/DangerZoneGeometryService.ts
```

Phase 1 backend endpoints:

```txt
POST   /mobile/danger-zones/createReport
GET    /mobile/danger-zones/myReports
GET    /admin/danger-zones/getReports
GET    /admin/danger-zones/getZones
PATCH  /admin/danger-zones/verifyReport
PATCH  /admin/danger-zones/rejectReport
PATCH  /admin/danger-zones/resolveZone
GET    /unified/danger-zones/public
```

Validation requirements:

- Resident create allows only `geometryType: "point" | "circle"`.
- Resident create always writes `source: "resident_report"`, `status: "pending"`, and `isActive: true`.
- Admin verify changes `status` to `verified` and records `verifiedBy` and `verifiedAt`.
- Admin reject requires `rejectionReason`.
- Admin resolve records `resolvedBy`, `resolvedAt`, `status: "resolved"`, and `isActive: false`.
- Public/unified reads return only `status === "verified" && isActive === true`.
- All reads and writes remain scoped by `clientId`.

Phase 1 should add data contracts and endpoint constants, but not add Mapbox Directions or OpenRouteService behavior.

### Phase 1 Admin Web Tasks

Add a new LGU admin module:

```txt
Frontend/src/pages/contents/DangerZones/index.tsx
Frontend/src/pages/contents/DangerZones/DangerZoneDetails.tsx
Frontend/src/components/ui/Map/AdminDangerZoneMap.tsx
Frontend/src/components/ui/danger-zone/DangerZoneForm.tsx
Frontend/src/components/ui/danger-zone/DangerZoneReviewModal.tsx
Frontend/src/stores/useDangerZoneStore.ts
Frontend/src/types/dangerZone.ts
```

Integrate it into:

```txt
Frontend/src/components/ui/sideBar/SideBar.tsx
Frontend/src/router.tsx
Frontend/src/config/endPoints.ts
```

Admin page requirements:

- Add `Danger Zones` to the LGU sidebar.
- Add route `/danger-zones`.
- Show tabs or filters for pending, verified, rejected, resolved, and expired.
- Show report details with type, severity, description, source, reporter metadata, created date, status, and map preview.
- Render Point and Circle on Leaflet in Phase 1.
- Support verify, reject, and resolve actions.
- Keep Line and Polygon creation behind a later Phase 2 task if drawing plugin compatibility is not settled.

### Phase 1 Mobile Tasks

Update the existing FAB entry point:

```txt
mobile/client/components/components/CustomTabBar/index.tsx
mobile/client/components/components/ActionSheet/sheets.tsx
```

Required mobile FAB behavior:

- Pressing `+` opens the registered `FAB` action sheet.
- `Create Status` keeps routing to `status/createStatus`.
- `Report Danger Zone` routes to `danger-zone/create`.
- Existing bottom tabs remain unchanged.

Add the danger-zone mobile module:

```txt
mobile/client/app/(app)/danger-zone/_layout.tsx
mobile/client/app/(app)/danger-zone/create.tsx
mobile/client/components/components/danger-zone/DangerZoneForm.tsx
mobile/client/components/components/danger-zone/DangerZoneMapPicker.tsx
mobile/client/services/dangerZoneService.ts
mobile/client/types/dangerZone.ts
```

Integrate it into:

```txt
mobile/client/app/(app)/_layout.tsx
mobile/client/config/endpoints.ts
```

Resident report requirements:

- Geometry type selector offers only Point and Circle.
- Location can come from current location or map tap.
- Circle requires `radiusMeters`.
- Required fields: type, severity, description, geometry.
- Optional field: photo evidence, if upload support is included in Phase 1.
- Submit shows pending status feedback and does not show the report as verified public data.

### Phase 1 Evacuation Routing Boundary

Do not implement best-route computation in Phase 1.

Phase 1 should only reserve the extension point:

- Add or document `API_ROUTES.EVACUATION.GET_BEST_ROUTE` for later use.
- Keep `mobile/client/app/(app)/evacuation.tsx` behavior unchanged except for harmless type/service preparation.
- Keep backend Mapbox Directions and OpenRouteService services out of Phase 1 unless the team explicitly expands scope.

### Phase 1 Verification Checklist

- LGU sidebar shows the new `Danger Zones` item for LGU admins.
- `/danger-zones` loads behind protected admin routing.
- Mobile `+` opens an action sheet with both `Create Status` and `Report Danger Zone`.
- Existing status creation still opens correctly.
- Resident danger-zone form does not expose Line or Polygon.
- Resident submissions create pending records only.
- Admin can see pending reports for the same `clientId`.
- Admin can verify, reject, and resolve reports.
- Public danger-zone reads exclude pending, rejected, resolved, and expired records.
- Existing evacuation center list and mobile evacuation map still work.

## Testing and Verification Checklist

Backend:

- Resident cannot create verified zones.
- Resident cannot submit line or polygon geometry.
- LGU admin can create point, circle, line, and polygon zones.
- Danger-zone reporting endpoints do not own best-route computation.
- Best-route endpoint is mounted through the evacuation/unified routing flow.
- Pending zones never appear from public endpoints.
- Only verified active zones are used for routing.
- OpenRouteService receives only Polygon or MultiPolygon avoid shapes.
- Mapbox normal route is used when no verified active zones exist.
- ORS route is used when verified active zones exist.
- Route fallback does not claim safety when ORS fails.

Frontend admin:

- LGU sidebar includes the new `Danger Zones` module.
- `/danger-zones` loads as a protected admin page.
- Admin danger-zone tools render on Leaflet without requiring a Mapbox web token.
- Point, circle, line, and polygon drawing work.
- Pending/verified/rejected/resolved filters work.
- LGU admins see only their client scope.

Mobile:

- Bottom-navigation `+` opens an action sheet instead of routing directly to status creation.
- FAB actions include `Create Status` and `Report Danger Zone`.
- Existing status creation still works from the FAB.
- Resident report UI exposes only Point and Circle.
- Current location and map tap both work as origins.
- Verified danger zones render on Mapbox.
- Route line renders on Mapbox.
- Safety warning is always visible near route guidance.

Rules:

- Firestore rules reject direct writes if backend-only posture is used.
- Residents cannot read pending/rejected reports from Firestore.
- LGU admin and super admin reads remain scoped correctly.

## Recommended First Implementation Scope

Phase 1 release should include:

- `dangerZones` backend model
- Backend validation and Firestore rules for pending resident reports and admin actions
- Mobile FAB action sheet with `Create Status` and `Report Danger Zone`
- Resident Point/Circle pending reports
- New mobile danger-zone reporting stack
- New admin `Danger Zones` sidebar module and page
- LGU admin verification
- LGU admin official Point/Circle creation
- Admin Leaflet Point/Circle preview for submitted reports
- Public verified-active read contract for later display
- Evacuation best-route endpoint contract documented but not implemented

Defer:

- LGU admin Line/Polygon drawing if Leaflet drawing compatibility is not settled
- Verified active danger-zone display on resident mobile Mapbox
- Evacuation best-route endpoint implementation
- Mapbox normal routing when no danger zones exist
- OpenRouteService routing when verified active danger zones exist
- Basic danger-zone notifications
- Evacuation center occupancy tracking
- `isSafe` evacuation center field
- Advanced route scoring
- Geohash/spatial indexing
- Offline routing
- Multi-route comparison UI
- Full redesign of existing admin maps outside the danger-zone workflow

## Final Expected Behavior

When a resident requests a route:

1. Mobile sends origin, travel mode, and client context to the backend.
2. Backend finds available evacuation centers from `centers`.
3. Backend checks verified active `dangerZones`.
4. If no danger zones exist, backend computes normal route using Mapbox.
5. If danger zones exist, backend computes safer route using OpenRouteService avoid polygons.
6. Backend returns route geometry, provider, warnings, and selected evacuation center.
7. Mobile displays evacuation markers, danger zones, and route line on Mapbox.
8. Mobile shows a safety warning that routes are guidance only.

Suggested warning:

```txt
This is a suggested route based on available map data and verified RescueNect reports. During emergencies, follow LGU officials and emergency responders. Avoid visibly flooded, blocked, or unsafe roads.
```
