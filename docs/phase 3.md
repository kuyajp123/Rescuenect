# Phase 3 Plan: Config-Driven Resident Signup Coverage

## Summary
Implement Phase 3 as a transition-safe configuration system for resident signup locations. Residents will only see active client LGUs from our hardcoded coverage config, not all PSGC regions/provinces/barangays. Naic remains the only active client for now, but the structure will allow adding future municipality/city LGUs by config.

## Key Changes
- Add a backend coverage endpoint: `GET /mobile/data/locationCoverage`.
- Response must include only active client LGUs, grouped as Province → Municipality/City → Barangays.
- Do not call PSGC from the resident app in Phase 3. PSGC can be used later for admin onboarding, but resident signup only consumes approved/active client coverage.
- Update the mobile barangay signup screen into cascading selectors:
  - Province selector: only provinces with active client LGUs.
  - Municipality/City selector: only active LGUs under selected province.
  - Barangay selector: only barangays covered by selected municipality/city.
- Use `heroui-native` UI components for mobile selectors/buttons/modals. Prefer HeroUI Native `Select` if stable in the project; otherwise build the selector from existing HeroUI Native primitives/wrappers.
- No web/admin UI is required in Phase 3. If a web UI is touched later, use the project’s HeroUI web component pattern.

## Interfaces And Data
- Add shared config shape for active clients:
  - `clientId`
  - `clientName`
  - `provinceCode`
  - `provinceName`
  - `municipalityCode`
  - `municipalityName`
  - `municipalityType`
  - `barangays`
  - `weatherLocationKey`
  - `weatherCoordinates`
  - `isActive`
- Initial active config contains only Naic.
- Update save barangay request to include:
  - `barangay`
  - `clientId`
  - `provinceCode`
  - `provinceName`
  - `municipalityCode`
  - `municipalityName`
  - `barangayCode`
  - `barangayLabel`
  - `weatherLocationKey`
- Keep `users/{uid}.barangay` unchanged for compatibility.
- Add the new location metadata fields to `users/{uid}` so future municipality clients can be handled without relying only on barangay text.

## Behavior
- If only one active province or municipality exists, preselect it but still keep the UI based on active client coverage.
- Backend must validate submitted barangay + municipality/client data against the active coverage config before saving.
- Existing Naic weather, earthquake, and notification behavior remains unchanged.
- Future LGUs are added by config during the transition phase, not by database/admin runtime registration yet.

## Test Plan
- Backend:
  - Confirm `GET /mobile/data/locationCoverage` returns only active client LGUs.
  - Confirm `/saveBarangay` accepts valid Naic payloads and rejects barangays outside active coverage.
  - Run `npm run build` from `Backend`.
- Mobile:
  - Confirm signup shows only Naic-related province/municipality/barangays for now.
  - Confirm saved user data still includes `barangay` plus the new metadata fields.
  - Run `npx tsc --noEmit` from `mobile/client`.
  - Run focused ESLint on touched mobile files.
- Regression:
  - Confirm weather reads still resolve Naic residents to `weather/naic`.
  - Confirm notification filtering still works for Naic barangays.

## Assumptions
- Phase 3 remains config-only; no Firestore/Supabase LGU registry yet.
- Resident signup must not show inactive or unsupported PSGC locations.
- Province-wide clients remain out of scope.
- Naic is the only active client until another LGU is manually added to config.
