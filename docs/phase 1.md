# Phase 1 Plan: Prepare Existing Naic Location Data

## Summary
Implement Phase 1 as a **code-level location seed refactor**, not a Firestore migration. Keep current user documents and weather behavior working, but move Naic barangay data into dedicated typed location config modules so the app stops treating hardcoded barangay arrays as the location model.

Use the official PSA PSGC values for Cavite and Naic where available: Cavite `0402100000`, Naic `0402115000` from [PSA PSGC](https://psa.gov.ph/classification/psgc/citimuni/0402100000?vcode=31).

## Key Changes
- Add typed Naic client/location config in mobile and backend:
  - Client id: `naic`
  - Client type: `municipality`
  - Province: Cavite, PSGC `0402100000`, correspondence code `0421`
  - Municipality: Naic, PSGC `0402115000`, correspondence code `042115000`
  - Weather location key: `naic`
  - Draft municipality coordinate: `14.2919325, 120.7752839`
  - Barangays: copy the existing 30 barangays exactly, with `psgcCode`, `latitude`, and `longitude` nullable for now.
- Preserve current public user data shape:
  - Continue storing `users/{uid}.barangay` as the existing lowercase string value.
  - Do not add user `provinceId`, `municipalityId`, or `barangayId` fields in Phase 1.
- Preserve current weather behavior:
  - Do not change Firestore weather documents to `weather/naic` yet.
  - Keep legacy barangay-to-weather-zone mapping, but derive it from the Naic seed using a temporary `legacyWeatherZoneKey`.
  - Add a clearer helper such as `getLegacyWeatherZoneKey(barangay)` and keep `getUsersBarangay()` as a backward-compatible wrapper.
- Update mobile forms to consume location config:
  - Signup barangay picker and profile barangay picker should read options from `getBarangayOptionsForClient('naic')`.
  - Keep `constants/variables.ts` exporting `barangays` as a compatibility re-export until old imports are removed.
- Update backend validation:
  - `saveBarangay` request shape remains `{ uid, barangay }`.
  - Validate `barangay` against the Naic seed before saving.
  - Return `400` for unknown barangay values.
  - Do not create Firestore `clients`, `provinces`, `municipalities`, or `barangays` collections in Phase 1.

## Interfaces
- Add shared-style runtime-local types:
  - `LocationClient`
  - `ProvinceMetadata`
  - `MunicipalityMetadata`
  - `BarangayMetadata`
  - `BarangayOption`
- Add helper functions:
  - `getActiveClient()`
  - `getBarangaysForClient(clientId)`
  - `getBarangayOptionsForClient(clientId)`
  - `getBarangayByValue(value)`
  - `isCoveredBarangay(value)`
  - `getLegacyWeatherZoneKey(value)`

## Test Plan
- Run mobile lint: `npm run lint` from `mobile/client`.
- Run backend build: `npm run build` from `Backend`.
- Manual mobile checks:
  - Signup barangay modal still shows the same 30 Naic barangays, sorted by label.
  - Selecting and saving a barangay still moves the user to the next signup step.
  - Profile edit still shows and saves barangay correctly.
  - Existing users with saved barangays still subscribe to weather successfully through legacy zone mapping.
- Backend checks:
  - `saveBarangay` accepts a valid existing barangay like `ibayo silangan`.
  - `saveBarangay` rejects an invalid barangay with `400`.
  - Existing sign-in response remains backward compatible.

## Assumptions
- Phase 1 uses code seed modules only.
- Barangay coordinates are metadata placeholders for now and may be `null`.
- Weather migration to `weather/naic` belongs to Phase 2.
- Dynamic signup locations and Firestore-backed client coverage belong to Phase 3.
