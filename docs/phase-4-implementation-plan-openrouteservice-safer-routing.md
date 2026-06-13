# Phase 4 Implementation Plan: OpenRouteService Safer Routing With Mapbox Avoidance Fallback

## Summary

Phase 4 upgrades the existing `POST /unified/getBestEvacuationRoute` endpoint so verified active danger zones influence evacuation routing.

Routing provider order:
1. No verified active danger zones: use normal Mapbox routing.
2. Verified active danger zones: use OpenRouteService polygon avoidance.
3. If OpenRouteService fails: try Mapbox best-effort point exclusion.
4. If Mapbox point exclusion fails: fall back to normal Mapbox with a strong warning.

Important Mapbox limitation: Mapbox Directions does not support arbitrary avoid polygons like ORS. It can exclude custom point locations via `exclude=point(lon lat)` for driving profiles, up to 50 points per request, so this fallback is best-effort only.

References:
- [OpenRouteService directions requests](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/requests-and-return-types)
- [OpenRouteService avoid_polygons](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/routing-options)
- [Mapbox Directions exclude parameter](https://docs.mapbox.com/api/navigation/directions/)

## Key Changes

### Backend

- Add backend-only env config:
  - `OPENROUTESERVICE_API_KEY`
  - optional `OPENROUTESERVICE_BASE_URL`, default `https://api.openrouteservice.org`
- Add backend Turf dependencies:
  - `@turf/buffer`
  - `@turf/helpers`
- Add `OpenRouteService` service using existing `axios`.
  - Call `POST /v2/directions/driving-car/geojson`.
  - Send API key in `Authorization` header.
  - Send ORS `options.avoid_polygons` as GeoJSON `Polygon` or `MultiPolygon`.
- Add danger-zone polygon conversion for ORS:
  - Point: buffer center by `50m`.
  - Circle: buffer center by `radiusMeters`.
  - Line: buffer by `(affectedWidthMeters ?? 30) / 2`.
  - Polygon: use stored polygon after validation.
  - Multiple polygons: package as `MultiPolygon`.
  - Compute avoid geometry on demand; do not persist/backfill `avoidGeojson`.
- Extend `MapboxDirectionsService` to optionally accept `excludePoints`.
  - Encode points as Mapbox `exclude=point(lng lat),point(lng lat)`.
  - Use only for `mapbox/driving`.
  - Cap at 50 points per request.
- Add Mapbox fallback point generation:
  - Point zone: center.
  - Circle zone: center plus north/east/south/west radius points.
  - Line zone: vertices and segment midpoints.
  - Polygon zone: centroid, outer-ring vertices, and edge midpoints.
  - Deduplicate rounded coordinates.
  - If more than 50 points, keep higher severity first: `critical`, `high`, `medium`, `low`, then newest first.
- Keep same protected endpoint:
  - `POST /unified/getBestEvacuationRoute`

### Routing Flow

- For selected-center routing, evaluate only `targetCenterId`.
- For automatic best route, evaluate up to the 5 nearest available centers.
- If no verified active zones exist:
  - Use Mapbox normal routing.
  - `avoidanceMethod: "none"`.
- If verified active zones exist:
  - Try ORS polygon avoidance for all candidates.
  - If any ORS route succeeds, choose the shortest ORS duration.
  - If all ORS routes fail, try Mapbox point-exclusion routing for the same candidates.
  - If any Mapbox point-exclusion route succeeds, choose the shortest duration and warn that this is limited avoidance.
  - If Mapbox point-exclusion fails, try normal Mapbox routing.
  - If all providers fail, return `502`.

### API Contract

Request body remains unchanged:

```ts
{
  clientId: string;
  origin: { lat: number; lng: number };
  targetCenterId?: string;
  travelMode?: "driving";
}
```

Extend response metadata:

```ts
route: {
  provider: "mapbox" | "openrouteservice";
  profile: "mapbox/driving" | "driving-car";
  geometry: GeoJSON.LineString;
  distanceMeters: number;
  durationSeconds: number;
};

dangerZoneSummary: {
  verifiedActiveCount: number;
  avoidanceApplied: boolean;
  avoidanceMethod: "none" | "ors_avoid_polygons" | "mapbox_exclude_points";
  providerFallback: boolean;
};
```

Warnings:
- Always include the emergency advisory warning.
- ORS success:
  - `avoidanceApplied: true`
  - `avoidanceMethod: "ors_avoid_polygons"`
  - `providerFallback: false`
- Mapbox point-exclusion fallback:
  - `avoidanceApplied: true`
  - `avoidanceMethod: "mapbox_exclude_points"`
  - `providerFallback: true`
  - Warning: `OpenRouteService polygon avoidance is unavailable. Mapbox best-effort point exclusions were used, but this route may still enter verified danger zones.`
- Normal Mapbox fallback:
  - `avoidanceApplied: false`
  - `avoidanceMethod: "none"`
  - `providerFallback: true`
  - Warning: `Safer routing is unavailable right now. Showing a normal route that may cross verified danger zones.`

### Mobile App

- Keep using existing `GET_BEST_ROUTE`.
- Extend route response types for:
  - `provider: "mapbox" | "openrouteservice"`
  - `profile: "mapbox/driving" | "driving-car"`
  - `avoidanceMethod`
  - `providerFallback`
- Reuse existing route line rendering.
- Route summary copy:
  - ORS polygon route: show “Danger zones avoided”.
  - Mapbox point-exclusion fallback: show “Limited avoidance”.
  - Normal Mapbox fallback: show “Avoidance unavailable”.
- Display backend warnings prominently.
- Do not expose ORS key in mobile.

## Test Plan

Backend:
- `npm run build` in `Backend`.
- `npm test` in `Backend`.
- Unit test ORS avoid polygon generation for Point, Circle, Line, and Polygon.
- Unit test Mapbox exclude point generation and 50-point cap.
- Verify no danger zones uses normal Mapbox.
- Verify danger zones use ORS first.
- Verify ORS all-failure tries Mapbox point exclusions.
- Verify Mapbox point-exclusion all-failure tries normal Mapbox.
- Verify all-provider failure returns `502`.
- Verify selected-center and automatic best-route behavior remain scoped to available same-client centers.
- Verify warnings and `avoidanceMethod` values match the provider path used.

Mobile:
- `npx tsc --noEmit` in `mobile/client`.
- Targeted ESLint for touched route files.
- Confirm ORS route displays as danger-zone avoidance.
- Confirm Mapbox point-exclusion fallback displays as limited avoidance.
- Confirm normal Mapbox fallback displays as avoidance unavailable.
- Confirm route line and danger-zone overlays still render together.

## Assumptions

- Phase 4 remains driving-only.
- ORS profile is `driving-car`.
- Mapbox fallback avoidance uses point exclusions only because Mapbox does not support ORS-style avoid polygons.
- Mapbox point-exclusion routes must not be described as fully safe or polygon-avoiding.
- Generated avoid polygons and fallback points are computed on demand, not stored.
- Admin web remains unchanged in Phase 4.
