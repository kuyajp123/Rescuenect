# Phase 4.5 Implementation Plan: Multi-Mode And Road-Condition Aware Routing

## Summary

Phase 4.5 is not covered by the current Phase 4 implementation. It should extend the existing `POST /unified/getBestEvacuationRoute` endpoint with resident travel-mode selection and route-only road-condition display.

Deliverables:
- Resident can choose `Driving` or `Walking`.
- Driving uses Mapbox traffic-aware routing when Mapbox is the provider.
- Danger-zone avoidance still prioritizes verified active danger zones.
- Suggested route displays colored road-condition segments.
- Residents can tap a colored route segment to view condition details.
- No broad map-wide traffic layer in Phase 4.5.

References:
- [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/)
- [Mapbox Traffic v1 tileset](https://docs.mapbox.com/data/tilesets/reference/mapbox-traffic-v1/)
- [Mapbox Tilequery API](https://docs.mapbox.com/api/maps/tilequery/)
- [OpenRouteService routing options](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/routing-options)

## Key Changes

### Backend

- Extend request body:
```ts
{
  clientId: string;
  origin: { lat: number; lng: number };
  targetCenterId?: string;
  travelMode?: "driving" | "walking";
}
```

- Extend provider profiles:
```ts
RouteProfile =
  | "mapbox/driving-traffic"
  | "mapbox/walking"
  | "driving-car"
  | "foot-walking";
```

- Routing behavior:
  - `driving`, no verified active danger zones: use Mapbox `mapbox/driving-traffic`.
  - `driving`, with verified active danger zones: use ORS `driving-car` with `avoid_polygons`; fallback to Mapbox `driving-traffic` point exclusions; final fallback to normal Mapbox traffic route with warning.
  - `walking`, no verified active danger zones: use Mapbox `mapbox/walking`.
  - `walking`, with verified active danger zones: use ORS `foot-walking` with `avoid_polygons`; fallback to Mapbox walking with warning because Mapbox point exclusions are driving-only.
  - Automatic best route still evaluates up to 5 nearest available centers and chooses shortest duration for the selected mode.

- Mapbox road-condition parsing:
  - For `mapbox/driving-traffic`, request `overview=full` and `annotations=distance,duration,speed,congestion,congestion_numeric,closure`.
  - Parse route leg `incidents`, `closures`, and annotation arrays.
  - Build route-condition segments from geometry coordinate pairs.
  - Segment priority: `closure` > `incident` > `severe` > `heavy` > `moderate` > `low` > `unknown`.

- ORS/walking condition enrichment:
  - Since ORS does not return Mapbox traffic annotations, sample the final route geometry against Mapbox Traffic v1 via Tilequery.
  - Limit to 30 sample points per route, query `mapbox.mapbox-traffic-v1`, layer `traffic`, geometry `linestring`, radius `20m`, limit `1`.
  - Return sampled congestion/closed-road conditions as approximate route-condition segments.
  - If Tilequery fails, still return the route with a warning that road-condition details are unavailable.

### API Response

Extend success response:

```ts
{
  selectedCenter: EvacuationCenter;
  travelMode: "driving" | "walking";
  route: {
    provider: "mapbox" | "openrouteservice";
    profile: RouteProfile;
    geometry: GeoJSON.LineString;
    distanceMeters: number;
    durationSeconds: number;
    durationTypicalSeconds?: number | null;
  };
  dangerZoneSummary: {
    verifiedActiveCount: number;
    avoidanceApplied: boolean;
    avoidanceMethod: "none" | "ors_avoid_polygons" | "mapbox_exclude_points";
    providerFallback: boolean;
  };
  roadConditionSummary: {
    available: boolean;
    source: "mapbox_directions" | "mapbox_traffic_tilequery" | "none";
    worstCondition: "closed" | "incident" | "severe" | "heavy" | "moderate" | "low" | "unknown";
    closureCount: number;
    incidentCount: number;
    hasLiveTraffic: boolean;
  };
  roadConditionSegments: Array<{
    id: string;
    geometry: GeoJSON.LineString;
    condition: "closed" | "incident" | "severe" | "heavy" | "moderate" | "low" | "unknown";
    label: string;
    speedMetersPerSecond?: number | null;
    typicalDurationSeconds?: number | null;
    liveDurationSeconds?: number | null;
    congestionNumeric?: number | null;
    incidentType?: string | null;
    incidentDescription?: string | null;
    source: "mapbox_directions" | "mapbox_traffic_tilequery";
  }>;
  warnings: string[];
}
```

### Mobile App

- Add a compact mode selector on the evacuation map:
  - `Driving`
  - `Walking`
  - Default: `Driving`
- `Best Route` and selected-center `Get Route` use the selected mode.
- Route summary shows:
  - selected center
  - selected travel mode
  - expected travel time
  - distance
  - provider/avoidance label
  - worst road condition
- Render route-condition segments on top of the route line:
  - closed: dark red
  - incident: purple
  - severe: red
  - heavy: orange-red
  - moderate: amber
  - low: green
  - unknown: blue/gray
- Tapping a colored segment opens a bottom sheet with full condition details.
- Keep verified danger-zone overlays visible.
- Do not add cycling, turn-by-turn navigation, or a full map-wide traffic layer in Phase 4.5.

## Test Plan

Backend:
- `npm run build` in `Backend`.
- `npm test` in `Backend`.
- Verify `travelMode` rejects unsupported values.
- Verify driving/no-danger uses `mapbox/driving-traffic`.
- Verify walking/no-danger uses `mapbox/walking`.
- Verify danger-zone driving uses ORS `driving-car` first.
- Verify danger-zone walking uses ORS `foot-walking` first.
- Verify Mapbox driving parses congestion, closure, incident, live duration, and typical duration.
- Verify segment priority chooses closure over incident and congestion.
- Verify Tilequery enrichment is capped, cached, and failure-tolerant.
- Verify same-client, available-center filtering remains unchanged.

Mobile:
- `npx tsc --noEmit` in `mobile/client`.
- Targeted ESLint for touched route/map files.
- Confirm mode selector changes backend `travelMode`.
- Confirm Driving and Walking route durations display correctly.
- Confirm road-condition segment colors render.
- Confirm tapping a segment opens the detail sheet.
- Confirm fallback warnings appear when road-condition data is unavailable.
- Confirm existing danger-zone and evacuation center overlays still render.

## Assumptions

- Phase 4.5 supports `Driving` and `Walking` only.
- Driving road conditions are strongest because Mapbox traffic, congestion, incidents, and closures are tied to `mapbox/driving-traffic`.
- Walking can use danger-zone avoidance through ORS, but live traffic does not change walking ETA.
- Route-only colored condition display is preferred over a full traffic overlay.
- Mapbox traffic availability depends on supported geography and returned provider data.
- Road-condition data informs residents but does not override verified danger-zone avoidance.
