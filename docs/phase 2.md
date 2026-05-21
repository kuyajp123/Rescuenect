# Phase 2 Plan: Switch Weather And Weather Notifications To Municipality Key

## Summary
Hard-switch Naic weather from zone documents to one municipality document: `weather/naic`. Use the Naic center coordinate `14.2919325,120.7752839`. Do not add a fallback to old zone weather docs. Leave old Firestore zone documents in place, but stop writing to and reading from them.

## Key Changes
- Weather ingestion:
  - Change Supabase weather location config so `WEATHER_LOCATIONS` contains only Naic: key `naic`, name `Naic`, coordinates `14.2919325, 120.7752839`.
  - Realtime, hourly, and daily jobs will write only:
    - `weather/naic/realtime/data`
    - `weather/naic/hourly/{000..}`
    - `weather/naic/daily/{000..}`
  - Report `processedLocations: 1` after the switch.

- Mobile weather reads:
  - Replace active use of `getLegacyWeatherZoneKey()` with `getWeatherLocationKey(barangay)`.
  - For any covered Naic barangay, `getWeatherLocationKey()` returns `naic`.
  - `subscribeToWeatherData(userData.barangay)` reads only from `weather/naic`.
  - Keep `users/{uid}.barangay` unchanged.

- Weather notifications:
  - Replace zone iteration with municipality weather key iteration: only `naic` for now.
  - `getUserTokens(targetAudience, 'naic')` should target all users whose barangay is covered by the Naic client.
  - Weather notification documents should use `location: 'naic'`.
  - `barangays` on weather notifications should include all covered Naic barangay values so existing barangay-based notification filtering still works.
  - Remove mobile special-case filtering for `central_naic`; weather notifications should match by `location === 'naic'` or by `barangays.includes(userLocation)`.

- Compatibility cleanup:
  - Keep legacy zone metadata in config only as historical/future reference, not active weather behavior.
  - Do not delete old Firestore documents like `weather/coastal_west` in this phase.
  - Update comments/types that say “weather zone” when the active concept is now “weather location key”.

## Interfaces
- Add or update helpers in mobile and Edge shared config:
  - `getWeatherLocationKey(barangay: string): string`
  - `getBarangaysForWeatherLocationKey(weatherLocationKey: string): string[]`
  - `isCoveredBarangay(value: string): boolean`
- Active weather key values:
  - Current: `naic`
  - Future municipalities can add keys like `tanza` or `trece_martires`.
- Firestore shape remains unchanged:
  - `weather/{weatherLocationKey}/realtime/data`
  - `weather/{weatherLocationKey}/hourly/{docId}`
  - `weather/{weatherLocationKey}/daily/{docId}`

## Test Plan
- Backend:
  - Run `npm run build` from `Backend`.
  - Confirm no active Supabase shared code iterates `coastal_west`, `coastal_east`, `central_naic`, `sabang`, `farm_area`, or `naic_boundary` for weather jobs/notifications.
- Mobile:
  - Run `npx tsc --noEmit` from `mobile/client`.
  - Run focused ESLint on touched mobile files.
  - Confirm any Naic barangay resolves to `naic` for weather subscription.
- Manual/Firestore:
  - Trigger realtime, hourly, and daily weather functions.
  - Verify Firestore receives fresh data under `weather/naic`.
  - Verify the mobile weather card loads from `weather/naic`.
  - Trigger a weather notification and verify `location: 'naic'`, `barangays` includes all Naic barangays, and users from different Naic barangays receive it.

## Assumptions
- This is a hard switch: no mobile fallback to old zone documents.
- The shared Naic weather coordinate is `14.2919325,120.7752839`.
- Existing user profile shape remains unchanged.
- Old zone weather documents are retained temporarily for safety but are no longer part of active behavior.
