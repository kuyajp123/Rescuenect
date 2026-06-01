# Phase 4 Plan: Super Admin, LGU Admins, And LGU Request Onboarding

## Summary

Phase 4 should be implemented as subphases. The current admin dashboard becomes the **LGU Admin** dashboard scoped to one municipality/city client, starting with Naic. A new **Super Admin** role manages LGU requests, client setup, admin accounts, coverage activation, and system/API health.

LGU request onboarding will use a **public form**. The form will fetch official PSGC location data from the backend using the PSA PSGC API, which provides region/province/municipality/barangay data and requires a token: [PSA PSGC API docs](https://psa.gov.ph/classifications-api/psgc). Municipality/city scope only; province-wide client scope remains out of scope.

## Key Changes

- Add admin role and tenant fields to existing `admin/{uid}` records:
  - `role: 'super_admin' | 'lgu_admin'`
  - `clientId: string | null`
  - `status: 'active' | 'inactive'`
  - `permissionsVersion`, `createdAt`, `updatedAt`
- Existing admin users become `lgu_admin` for `clientId: 'naic'`.
- Super admins come from a new `SUPER_ADMIN_EMAILS` backend allowlist.
- Add backend admin authorization middleware:
  - `requireAdmin`
  - `requireSuperAdmin`
  - `requireActiveLguAdmin`
  - `requireClientAccess`
- Keep current LGU admin modules available, but scope data by `clientId`:
  - dashboard, residents, status, weather, earthquakes, evacuation centers, announcements, contacts, notifications.
- Backfill/default legacy Naic data as `clientId: 'naic'` when missing, without breaking existing mobile user fields.

## LGU Request And Client Setup

- Add public PSGC proxy endpoints through the backend:
  - `GET /public/psgc/regions`
  - `GET /public/psgc/regions/:regionCode/provinces`
  - `GET /public/psgc/provinces/:provinceCode/municipalities`
  - `GET /public/psgc/municipalities/:municipalityCode/barangays`
- Backend reads from the official PSA PSGC API using `PSGC_API_TOKEN` and caches responses in Firestore or memory with a TTL.
- Add public LGU request endpoint:
  - `POST /public/lgu-requests`
- LGU request form collects:
  - LGU name, office/department, requester name, position, email, phone
  - region, province, municipality/city
  - selected barangays for coverage
  - barangay verification confirmation
  - notes/supporting details
- Store requests in `lguRequests/{requestId}`:
  - `status: 'pending' | 'approved' | 'rejected' | 'cancelled'`
  - PSGC metadata snapshot
  - selected barangays snapshot
  - requester/contact fields
  - review fields: `reviewedBy`, `reviewedAt`, `reviewNote`
- Super admin approval creates an **approved draft client**, not an active resident signup client yet.
- Approved draft client creates:
  - `clients/{clientId}` with `status: 'draft'`
  - initial `clientCoverage` or embedded barangay coverage data
  - LGU admin invitation for the requester email
- Super admin separately activates the client after final review:
  - `clients/{clientId}.status = 'active'`
  - resident signup coverage begins showing that municipality/city.

## Super Admin UI

- Add role-aware routing/sidebar in the web admin.
- LGU admins see the existing dashboard modules only for their assigned client.
- Super admins see a separate Super Admin area:
  - Overview
  - LGU Requests
  - Clients
  - LGU Admins
  - System Status
- Super Admin LGU Requests page supports:
  - view pending/approved/rejected requests
  - inspect requester info and selected barangays
  - approve as draft client
  - reject with note
- Super Admin Clients page supports:
  - view draft/active/inactive clients
  - edit weather key and municipality weather coordinates
  - enable/disable barangays
  - activate/deactivate client
- Super Admin System Status page uses existing health endpoints plus added checks:
  - backend health
  - Firebase health
  - PSGC proxy health
  - weather API/function status
  - earthquake monitor status
  - latest successful scheduled-job timestamps where available.

## Public APIs, Types, And Data Flow

- Add `AdminRole`, `AdminUser`, `ClientLgu`, `LguRequest`, `ClientCoverageBarangay`, and `SystemStatus` shared backend/frontend types.
- Update admin signin response to include:
  - `role`
  - `clientId`
  - `clientName`
  - `status`
  - `permissions`
- Update frontend auth store to persist role/client metadata.
- Add admin endpoints:
  - `GET /admin/me`
  - `GET /admin/super/lgu-requests`
  - `POST /admin/super/lgu-requests/:id/approve`
  - `POST /admin/super/lgu-requests/:id/reject`
  - `GET /admin/super/clients`
  - `PATCH /admin/super/clients/:clientId`
  - `POST /admin/super/clients/:clientId/activate`
  - `POST /admin/super/clients/:clientId/deactivate`
  - `GET /admin/super/system-status`
- Keep `/mobile/data/locationCoverage` public, but change its source from hardcoded active config to active client coverage once activation is implemented.
- Do not expose draft or inactive clients to resident signup.

## Implementation Order

1. **Phase 4A: Role And Client Foundation**
   - Add admin roles, client assignment, auth middleware, signin response updates, and Naic admin migration/defaults.
2. **Phase 4B: LGU Admin Scoping**
   - Scope existing admin data reads/writes by `clientId`; preserve current Naic behavior.
3. **Phase 4C: Public LGU Request Flow**
   - Add PSGC proxy, public request form, request storage, and request review list.
4. **Phase 4D: Super Admin Client Management**
   - Add approve/reject, draft client creation, admin invitation, barangay coverage review, and activation.
5. **Phase 4E: System Status Dashboard**
   - Add super-admin operational status checks and UI.

## Test Plan

- Backend build: `npm run build` from `Backend`.
- Frontend build: `npm run build` from `Frontend`.
- Auth tests:
  - super admin can access super admin routes.
  - LGU admin cannot access super admin routes.
  - inactive admin cannot access protected admin routes.
- LGU admin scoping tests:
  - Naic LGU admin sees only Naic residents/statuses/announcements/centers.
  - missing legacy `clientId` data is treated as Naic during transition.
- LGU request tests:
  - public PSGC selectors load region → province → municipality/city → barangays.
  - request submission validates required contact and location fields.
  - approval creates draft client only.
  - draft client does not appear in resident signup.
  - activation makes client appear in `/mobile/data/locationCoverage`.
- Super admin tests:
  - approve/reject flows update request status and review metadata.
  - client activation/deactivation changes signup visibility.
  - system status page reports backend/Firebase/PSGC health.

## Assumptions And Defaults

- Municipality/city clients only; province-wide clients stay out of scope.
- Existing admins become Naic LGU admins.
- Super admins are controlled by `SUPER_ADMIN_EMAILS`.
- Accepted LGU requests create approved draft clients first; activation is a separate super-admin action.
- Official PSA PSGC API is the canonical location source, accessed only from the backend with `PSGC_API_TOKEN`.
- Barangay coordinates remain optional in this phase unless the LGU provides verified values.
- Email invitation can be implemented as a simple pending admin record first; full email delivery can be added later if SMTP/provider setup is not ready.
