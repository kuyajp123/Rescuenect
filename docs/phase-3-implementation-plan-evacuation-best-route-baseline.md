# Phase 3 Implementation Plan: Evacuation Best Route Baseline

## Summary

Phase 3 extends the resident evacuation module with baseline route guidance using Mapbox Directions only.

Deliverables:
- Backend protected endpoint: `POST /unified/getBestEvacuationRoute`.
- Mapbox normal route computation from resident current location to evacuation centers.
- Mobile evacuation map route-line display.
- Two mobile entry points:
  - `Best Route` button chooses the best available center automatically.
  - `Get Route` from a selected evacuation center routes to that center.
- If verified active danger zones exist, still return a Mapbox route, but show a clear warning that Phase 3 does not avoid danger zones yet.
- No OpenRouteService, `avoid_polygons`, route avoidance, or safer-route claim in Phase 3.

## Key Changes

Backend:
- Add `MAPBOX_DIRECTIONS_TOKEN` to backend env config. Do not expose this token to mobile or admin web.
- Add `MapboxDirectionsService` using existing `axios`.
- Use Mapbox Directions v5:
  `GET https://api.mapbox.com/directions/v5/mapbox/{profile}/{originLng},{originLat};{destLng},{destLat}`
  with `geometries=geojson`, `overview=full`, `steps=false`, and `access_token`.
- Add `SafeRoutingService` or `EvacuationRoutingService` under the unified/evacuation boundary, not under danger-zone reporting.
- Add protected route after `AuthMiddleware.verifyToken`:
  `POST /unified/getBestEvacuationRoute`.
- Add route-specific expensive rate limiting for this endpoint.
- Candidate centers come from `centers`, scoped by `clientId`, active client only, with:
  `status === "available"` and valid `coordinates`.
- For automatic best route, evaluate up to the 5 nearest available centers by straight-line distance, call Mapbox for each, and choose the successful route with shortest duration.
- For selected-center routing, accept `targetCenterId` and route only to that available center.
- Check verified active danger zones for the same `clientId` only to produce warning metadata. Do not avoid them.

API contract:
```ts
POST /unified/getBestEvacuationRoute

Request body:
{
  clientId: string;
  origin: { lat: number; lng: number };
  targetCenterId?: string;
  travelMode?: "driving";
}

Success response:
{
  selectedCenter: EvacuationCenter;
  route: {
    provider: "mapbox";
    profile: "mapbox/driving";
    geometry: GeoJSON.LineString;
    distanceMeters: number;
    durationSeconds: number;
  };
  dangerZoneSummary: {
    verifiedActiveCount: number;
    avoidanceApplied: false;
  };
  warnings: string[];
}
```

Failure behavior:
- `400` invalid origin/clientId/payload.
- `401` missing or invalid auth token.
- `404` no available evacuation centers, or selected center unavailable/out of client scope.
- `502` Mapbox route computation failed for all candidates.
- Always include a warning on success:
  `This is suggested route guidance only. During emergencies, follow LGU officials and emergency responders.`
- If verified active danger zones exist, also include:
  `Verified danger zones exist, but this Phase 3 route does not avoid them yet.`

Mobile:
- Add `API_ROUTES.EVACUATION.GET_BEST_ROUTE`.
- Add a mobile service, for example `evacuationRouteService.ts`, that gets Firebase ID token and posts to the backend endpoint.
- Use existing `getCurrentPositionOnce()` as the Phase 3 route origin.
- Extend `mobile/client/app/(app)/evacuation.tsx` with route state:
  loading, route result, selected center, error, warnings, and clear-route action.
- Extend `MapView` to accept:
  `routeGeoJson?: GeoJSON.LineString | null`,
  `selectedRouteCenterId?: string | null`,
  `onRequestBestRoute?: () => void`,
  `onRequestRouteToCenter?: (center: EvacuationCenter) => void`,
  `isRouteLoading?: boolean`,
  `routeWarnings?: string[]`.
- Render route with Mapbox `ShapeSource` + `LineLayer`, using a blue route style distinct from red danger zones.
- Add a floating `Best Route` button on the evacuation map.
- Add `Get Route` to the selected evacuation center details card for available centers only.
- Show route summary: selected center name, distance, estimated duration, provider, warnings, and a `Clear route` action.
- Keep verified danger-zone display from Phase 2 unchanged.

Admin Web:
- No required admin changes in Phase 3.

## Test Plan

Backend:
- `npm run build` in `Backend`.
- `npm test` in `Backend`.
- Unit test center filtering: only same-client, available centers with valid coordinates are candidates.
- Unit test nearest-candidate selection and shortest-duration winner.
- Mock Mapbox success, partial failure, and all-failure cases.
- Verify selected-center route rejects full/closed/cross-client/missing centers.
- Verify active danger zones add warning metadata but do not change provider or route request.
- Verify endpoint requires auth and validates origin/clientId.

Mobile:
- `npx tsc --noEmit` in `mobile/client`.
- Targeted ESLint for touched evacuation/map/service files.
- Confirm `Best Route` requests current location, calls backend, and displays route line.
- Confirm selected center `Get Route` targets that center.
- Confirm full/closed centers do not expose `Get Route`.
- Confirm route loading, success, no-center, location-denied, and provider-failure states.
- Confirm warning appears when verified danger zones exist.
- Confirm danger-zone overlays and evacuation center markers still render.

Regression:
- Existing evacuation centers still load.
- Existing danger-zone overlays still load.
- Existing resident danger-zone reporting remains Point/Circle only.
- Existing admin danger-zone module remains unchanged.
- No OpenRouteService package or API key is added in Phase 3.

## Assumptions

- Phase 3 default travel mode is driving only, mapped to `mapbox/driving`.
- Current GPS location is the only route origin in Phase 3; saved-location origins can be a later enhancement.
- Mapbox route guidance is advisory and not a safety guarantee.
- Verified danger zones are visible and warned about, but not avoided until Phase 4.
- Official references: [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/) and [Mapbox API access tokens](https://docs.mapbox.com/api/guides/).
