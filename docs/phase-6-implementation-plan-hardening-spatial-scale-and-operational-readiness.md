# Phase 6 Implementation Plan: Hardening, Spatial Scale, and Operational Readiness

## Summary

Phase 6 makes the danger-zone and safer-routing system production-ready at higher LGU volume.

Deliverables:
- Spatial metadata and query pre-filtering for danger zones.
- Paginated/searchable admin danger-zone lists.
- Route telemetry, provider health monitoring, and operational dashboards.
- Improved route scoring using duration, danger-zone exposure, road conditions, and evacuation-center readiness.
- Mobile route refresh and clearer unavailable/offline states.
- No new routing provider, no autonomous safety guarantee, and no change to resident danger-zone reporting limits.

## Key Changes

### Backend/API

- Add spatial metadata to `dangerZones`:
  ```ts
  bbox: [minLng: number, minLat: number, maxLng: number, maxLat: number];
  centroid: { lat: number; lng: number };
  confidence?: "low" | "medium" | "high";
  verificationNotes?: string | null;
  affectedBarangays?: string[];
  ```
  Compute these on create, verify, update, and via a one-time backfill script for existing records.

- Extend public danger-zone reads:
  ```txt
  GET /unified/danger-zones/public?clientId=...&bbox=minLng,minLat,maxLng,maxLat&limit=...
  ```
  Keep backwards compatibility when `bbox` is omitted.

- Extend admin danger-zone list endpoints with server-side filtering and pagination:
  ```txt
  GET /admin/danger-zones/getReports
  GET /admin/danger-zones/getZones
  ```
  Supported query params: `status`, `severity`, `geometryType`, `source`, `search`, `pageSize`, `cursor`.

- Add analytics and operations endpoints:
  ```txt
  GET /admin/danger-zones/analytics
  GET /admin/evacuation-routing/operations
  ```
  Responses remain scoped by `clientId`; super admin may pass `clientId` where existing access rules allow it.

- Add `routeRequests` telemetry collection for `POST /unified/getBestEvacuationRoute`.
  Store `clientId`, travel mode, selected center, provider path, avoidance method, provider fallback, road-condition summary, latency, success/failure, warning count, and coarse origin only. Do not persist exact resident GPS.

- Extend route response:
  ```ts
  {
    requestId: string;
    routeDecision: {
      strategy: "duration_risk_capacity";
      evaluatedCandidateCount: number;
      scoreSeconds: number;
      riskPenaltySeconds: number;
      roadConditionPenaltySeconds: number;
      centerPenaltySeconds: number;
    };
  }
  ```

- Improve route candidate scoring:
  - Base score is route duration.
  - Add danger exposure penalties when avoidance is limited or unavailable.
  - Add road-condition penalties for closure, incident, severe, heavy, or moderate traffic.
  - Exclude centers with `status !== "available"` or `isSafe === false`.
  - Penalize centers close to capacity when `currentOccupancy` and `capacity` are available.
  - Keep default candidate limit at 5, configurable with a backend env value capped at 10.

- Extend evacuation-center records:
  ```ts
  currentOccupancy?: number | null;
  isSafe?: boolean; // default true
  lastCapacityUpdatedAt?: unknown | null;
  ```
  Validate `currentOccupancy >= 0` and `currentOccupancy <= capacity`.

- Add dedicated production rate limiters:
  - Route computation: per-user/IP expensive limiter.
  - Danger-zone report creation: stricter resident write limiter.
  - Keep non-production limiter behavior unchanged.

- Add structured provider logs for Mapbox Directions, Mapbox Traffic Tilequery, and OpenRouteService attempts, including provider, profile, latency, success/failure, HTTP status, and quota-related errors.

### Admin Web

- Update `/danger-zones` with server-side pagination, search, and high-volume filters.
- Add danger-zone analytics cards: pending reports, active verified zones, high/critical zones, expiring soon, resolved/expired counts, and average verification time.
- Add map performance loading by current viewport/bbox instead of rendering every zone at once.
- Add confidence, verification notes, and affected barangays to create, verify, and edit flows.
- Update evacuation-center admin forms to manage `currentOccupancy` and `isSafe`.
- Add an evacuation routing operations panel showing route volume, provider failure rate, fallback rate, average latency, worst road-condition counts, and recent provider warnings.

### Mobile App

- Fetch public danger zones by visible map bbox with a small padding and debounce map-move requests.
- Keep a safe fallback to the existing full public danger-zone fetch if bbox loading fails.
- Add route refresh behavior:
  - If the resident moves meaningfully, show a `Refresh route` action.
  - If route data is older than 5 minutes, show a stale-route notice.
  - Do not auto-spam route computation.
- Improve unavailable states:
  - Location denied.
  - Network unavailable.
  - Provider unavailable.
  - Danger-zone data unavailable.
- Keep route line, colored road-condition overlay, danger-zone overlays, and evacuation-center markers visible together.
- Add accessible labels for travel mode, best route, get route, clear route, condition segment details, and warning panels.

## Test Plan

Backend:
- `npm run build` in `Backend`.
- `npm test` in `Backend`.
- Test bbox/centroid generation for point, circle, line, and polygon.
- Test public danger-zone bbox filtering and fallback behavior.
- Test paginated admin list filters and client scoping.
- Test route scoring chooses a safer/slightly slower route when penalties justify it.
- Test unsafe/full centers are excluded and near-capacity centers are penalized.
- Test telemetry does not store exact resident GPS.
- Test provider health aggregation, rate limits, and provider failure logging.

Admin web:
- `npm run build` in `Frontend`.
- Confirm search, filters, pagination, and viewport loading work with large danger-zone sets.
- Confirm analytics and routing operations remain scoped to the LGU client.
- Confirm confidence, verification notes, affected barangays, occupancy, and safety fields can be created, edited, and displayed.
- Confirm existing verify, reject, resolve, expiry, and audit flows still work.

Mobile:
- `npx tsc --noEmit` in `mobile/client`.
- Targeted ESLint for touched mobile files.
- Confirm bbox danger-zone loading works while panning/zooming.
- Confirm route refresh appears after meaningful movement or stale route age.
- Confirm provider/network unavailable states are understandable.
- Confirm existing danger-zone reporting still allows only Point and Circle.

## Assumptions

- Phase 6 is a hardening and operational-readiness phase, not a new routing-provider phase.
- Resident exact GPS should not be retained in route telemetry.
- Driving and walking remain the only travel modes.
- Route scoring is advisory and must never claim guaranteed safety.
- Existing Mapbox, OpenRouteService, Leaflet, and Mapbox mobile map choices remain unchanged.
