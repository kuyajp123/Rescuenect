# Phase 1 Plan: Danger Zone Reporting Module MVP

## Summary

Build the new danger-zone reporting module end to end without changing evacuation routing yet.

Phase 1 delivers:

- New LGU admin **Danger Zones** sidebar module and `/danger-zones` page.
- Resident mobile **Report Danger Zone** entry from the existing bottom-nav `+` FAB.
- Resident reports limited to **Point** and **Circle radius**.
- Admin Phase 1 creation/review limited to **Point** and **Circle**.
- Resident photo evidence included as one optional uploaded image.
- No Mapbox Directions, OpenRouteService, or best-route computation in Phase 1.

## Key Changes

### Backend/API

Add a `dangerZones` Firestore collection managed through backend APIs only.

Required endpoints:

```txt
POST   /mobile/danger-zones/createReport
GET    /mobile/danger-zones/myReports

GET    /admin/danger-zones/getReports
GET    /admin/danger-zones/getZones
POST   /admin/danger-zones/createOfficial
PATCH  /admin/danger-zones/verifyReport
PATCH  /admin/danger-zones/rejectReport
PATCH  /admin/danger-zones/resolveZone

GET    /unified/danger-zones/public
```

Required behavior:

- Resident create uses `multipart/form-data` with optional `image`.
- Reuse existing multer image validation via `upload.single('image')`.
- Store resident evidence in Supabase under a new danger-zone evidence storage path/bucket.
- Save uploaded evidence URL in `photoUrls: string[]`.
- Resident reports always save as `source: "resident_report"`, `status: "pending"`, `isActive: true`.
- Admin official Point/Circle zones save as `source: "lgu_official"`, `status: "verified"`, `isActive: true`.
- Public/unified reads return only `status === "verified" && isActive === true`.
- All admin/mobile reads and writes remain scoped by `clientId`.

Minimum danger-zone fields:

```ts
{
  id: string;
  clientId: string;
  source: "resident_report" | "lgu_official";
  status: "pending" | "verified" | "rejected" | "resolved" | "expired";
  isActive: boolean;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  geometryType: "point" | "circle";
  center: { lat: number; lng: number };
  radiusMeters?: number;
  photoUrls: string[];
  reportedBy: string;
  reportedByRole: "resident" | "lgu_admin" | "super_admin";
  verifiedBy?: string | null;
  verifiedAt?: unknown | null;
  rejectedBy?: string | null;
  rejectedAt?: unknown | null;
  rejectionReason?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: unknown | null;
  createdAt: unknown;
  updatedAt: unknown;
}
```

### Admin Web

Add the new module to the LGU admin sidebar:

- Sidebar label: `Danger Zones`
- Route: `/danger-zones`
- Suggested icon: `TriangleAlert`
- Super admin sidebar is unchanged.

Admin page behavior:

- Show filters/tabs for pending, verified, rejected, resolved, expired.
- Show report details, resident evidence photo, and Leaflet Point/Circle preview.
- Allow LGU admin to verify, reject with reason, or resolve.
- Allow LGU admin to create official Point/Circle zones.
- Do not expose Line/Polygon creation in Phase 1.

### Mobile App

Update the existing bottom-nav FAB:

- Pressing `+` opens the registered `FAB` action sheet.
- Action 1: `Create Status` routes to `status/createStatus`.
- Action 2: `Report Danger Zone` routes to `danger-zone/create`.
- Existing four bottom tabs remain unchanged.

Add a new resident danger-zone stack:

- `danger-zone/_layout`
- `danger-zone/create`

Resident report form:

- Geometry selector: Point or Circle only.
- Location source: current location or map tap.
- Circle requires `radiusMeters`.
- Required fields: type, severity, description, geometry.
- Optional field: one photo evidence image.
- Submit sends `multipart/form-data` to `/mobile/danger-zones/createReport`.
- Success state clearly says the report is pending LGU verification.

### Evacuation Boundary

Do not implement best-route path in Phase 1.

- Do not install OpenRouteService.
- Do not add Mapbox Directions backend routing.
- Do not alter current evacuation-center behavior.
- Reserve the later endpoint name `GET_BEST_ROUTE` / `/unified/getBestEvacuationRoute` only in documentation, not as working behavior.

## Test Plan

Backend:

- `npm run build` in `Backend`.
- `npm test` in `Backend` if new tests are added.
- Verify resident cannot submit Line/Polygon.
- Verify resident cannot create verified reports.
- Verify admin actions require LGU admin access and same `clientId`.
- Verify public endpoint excludes pending, rejected, resolved, and expired reports.
- Verify image upload accepts image files and rejects non-image files.

Admin web:

- `npm run build` in `Frontend`.
- Confirm `Danger Zones` appears for LGU admins only.
- Confirm `/danger-zones` is protected.
- Confirm pending report list, details, Leaflet preview, verify, reject, and resolve flows.
- Confirm Point/Circle official creation works.
- Confirm Line/Polygon controls are absent in Phase 1.

Mobile:

- `npm run lint` in `mobile/client`.
- Confirm FAB opens action sheet instead of directly opening status creation.
- Confirm `Create Status` still works.
- Confirm `Report Danger Zone` opens the new screen.
- Confirm Point/Circle validation, map tap/current location selection, optional image upload, and pending success state.

Regression:

- Existing status creation still works.
- Existing mobile evacuation map still loads centers.
- Existing admin evacuation page still works.

## Assumptions

- Phase 1 admin geometry is **Point/Circle only**.
- Resident photo evidence is included in Phase 1, limited to one image.
- Line/Road Segment and Polygon/custom drawing move to Phase 2.
- Notifications, route display, Mapbox Directions, and OpenRouteService are deferred.
- Firestore direct client writes for `dangerZones` remain disabled; clients use backend APIs.
