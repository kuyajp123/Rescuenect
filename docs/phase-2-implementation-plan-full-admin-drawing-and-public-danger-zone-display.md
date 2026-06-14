# Phase 2 Implementation Plan: Full Admin Drawing and Public Danger Zone Display

## Summary

Phase 2 expands the Phase 1 danger-zone module from Point/Circle only into full LGU-admin geometry support and public verified-zone map display.

Deliverables:
- LGU admins can create and edit Point, Circle, Line/Road Segment, and Polygon danger zones.
- Residents still report only Point and Circle.
- Verified active danger zones render on the resident mobile evacuation map.
- Admin Leaflet maps render all danger-zone geometry types.
- No best-route computation, OpenRouteService, route avoidance, or Mapbox Directions work in Phase 2.

## Key Changes

### Backend/API

Extend the existing danger-zone model, controllers, and routes.

Add/extend types:
```ts
geometryType: "point" | "circle" | "line" | "polygon";

geojson?: {
  type: "LineString" | "Polygon";
  coordinates: unknown;
} | null;

affectedWidthMeters?: number | null; // line only, default 30
avoidGeojson?: null; // reserved for Phase 4, do not compute yet
```

Rules:
- Resident `POST /mobile/danger-zones/createReport` remains Point/Circle only.
- Admin `POST /admin/danger-zones/createOfficial` accepts Point, Circle, Line, and Polygon.
- Add `PATCH /admin/danger-zones/updateZone`.
- `updateZone` allows LGU admins to edit same-client verified active zones only.
- `updateZone` may update type, severity, description, geometry fields, and `affectedWidthMeters`.
- `updateZone` must not allow changes to `clientId`, `source`, `reportedBy`, `reportedByRole`, `createdAt`, or lifecycle audit fields.
- `GET /unified/danger-zones/public?clientId=...` keeps returning `{ zones }`, now including `geojson` for Line/Polygon.
- Public endpoint still returns only `status === "verified" && isActive === true`.
- Firestore direct client access remains denied.

Validation:
- Point requires `center`.
- Circle requires `center` and `radiusMeters`.
- Line requires GeoJSON `LineString` with at least 2 valid `[lng, lat]` coordinates.
- Polygon requires GeoJSON `Polygon` with one closed outer ring and at least 4 coordinates.
- Reject invalid coordinates outside latitude/longitude bounds.
- Default `affectedWidthMeters` for line zones to `30`, with accepted range `5..100`.

### Admin Web

Package choice:
- Add `leaflet-draw@1.0.4` and `react-leaflet-draw@0.21.0`.
- Import `leaflet-draw/dist/leaflet.draw.css` in the admin danger-zone map/editor component.

Admin behavior:
- Existing `/danger-zones` page remains the module entry.
- Official creation modal adds geometry choices: Point, Circle, Line/Road Segment, Polygon.
- Leaflet drawing controls:
  - Enable marker, circle, polyline, and polygon.
  - Disable rectangle and circle marker.
- Line drawing saves GeoJSON `LineString`.
- Polygon drawing saves GeoJSON `Polygon`.
- Circle continues saving `center` and `radiusMeters`.
- Map previews render all geometries:
  - Point: marker
  - Circle: Leaflet circle
  - Line: polyline
  - Polygon: polygon fill
- Add edit mode for verified active zones from the details modal.
- Edit mode loads the selected zone geometry into Leaflet, lets the admin redraw/edit it, then submits `PATCH /admin/danger-zones/updateZone`.
- Keep resolve/reject/verify flows unchanged.

### Mobile App

Add a public danger-zone fetch service using the existing endpoint:
```txt
GET /unified/danger-zones/public?clientId=...
```

Extend mobile danger-zone types to include:
```ts
geometryType: "point" | "circle" | "line" | "polygon";
geojson?: GeoJSON.LineString | GeoJSON.Polygon | null;
affectedWidthMeters?: number | null;
```

Evacuation map behavior:
- Extend the existing mobile `MapView` to accept `dangerZones?: DangerZoneRecord[]`.
- Fetch verified active danger zones in `mobile/client/app/(app)/evacuation.tsx` using the resident `clientId`.
- Render danger zones on Mapbox:
  - Point: marker/circle symbol
  - Circle: generated polygon fill
  - Line: line layer
  - Polygon: fill layer
- Add a selected danger-zone detail sheet/modal with type, severity, description, and status.
- Keep resident danger-zone reporting screen Point/Circle only.
- Do not draw route lines or compute routes in Phase 2.

## Test Plan

Backend:
- `npm run build` in `Backend`.
- `npm test` in `Backend`.
- Verify resident create rejects `line` and `polygon`.
- Verify admin create accepts Point, Circle, Line, Polygon.
- Verify invalid LineString and Polygon payloads return 400.
- Verify `updateZone` rejects pending, rejected, resolved, and expired records.
- Verify `updateZone` rejects cross-client updates.
- Verify public endpoint excludes pending/rejected/resolved/expired zones.

Admin web:
- `npm run build` in `Frontend`.
- Confirm LGU admin can create Point/Circle/Line/Polygon official zones.
- Confirm Line/Polygon drawing controls appear only in admin official creation/edit flows.
- Confirm all geometry types render in list/details previews.
- Confirm editing a verified active zone updates geometry and metadata.
- Confirm super admin sidebar remains unchanged.

Mobile:
- `npx tsc --noEmit` in `mobile/client`.
- Targeted ESLint for touched mobile files.
- Confirm evacuation map fetches public verified zones by `clientId`.
- Confirm Point/Circle/Line/Polygon display on Mapbox.
- Confirm tapping a danger zone opens details.
- Confirm reporting screen still exposes only Point/Circle.
- Confirm no route computation UI appears.

Regression:
- Existing status creation still works.
- Existing mobile evacuation center markers still load.
- Existing admin Point/Circle danger-zone review still works.
- Firestore rules still deny direct client access to `dangerZones`.

## Assumptions

- Phase 2 uses `react-leaflet-draw` because its current peer dependencies match React 19 and React Leaflet 5.
- `avoidGeojson` is reserved but not computed in Phase 2.
- Line zones use `affectedWidthMeters` only as stored metadata for later route avoidance; Phase 2 displays the line itself.
- Mobile public display is added to the evacuation map, not to the danger-zone reporting screen.
- No OpenRouteService, Mapbox Directions backend routing, or best-route endpoint implementation is included.
