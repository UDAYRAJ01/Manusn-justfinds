# Nearby search diagnosis (session notes)

## Current behaviour
- `SearchHero` has a small crosshair button that calls `navigator.geolocation.getCurrentPosition`, but the resolved coordinates are stored in local state only. They are appended to the URL **only when the user afterwards presses Search**. Clicking "use my location" alone does nothing visible, so it feels broken.
- The crosshair is nested inside the locality `<label>`, giving it almost no visual affordance and no loading/success state.
- `SearchResults` disables the "Nearby" filter unless `lat`/`lng` are already in the URL, so a user who lands on `/search` has no way to switch to nearby.
- `getPublicSearchPage` computes `distanceKm` via a SQL haversine expression, but only when `latitude`/`longitude` are supplied. Without GPS, all cards show no distance.
- When `sort === "nearby"`, the query pushes `isNotNull(latitude)`/`ne(latitude, "")`, so businesses without verified coordinates disappear entirely — which reads as "nearby not working" when seed data lacks coordinates.
- `BusinessCard` renders `distanceKm.toFixed(1)` km, so the display path exists; it is the data path that is missing.
- `BusinessDetail` does not show distance from the user at all.

## Fix plan
1. Add a shared `useUserLocation` hook that requests GPS, persists the coordinates in `sessionStorage`, and exposes `status` (idle/requesting/granted/denied/unsupported).
2. Make "Use my location" an explicit, labelled control with pending/granted/denied states, and navigate to nearby results immediately once coordinates resolve.
3. Let `SearchResults` fall back to the stored coordinates so the Nearby filter works without re-entering the flow, and request permission when the user taps a disabled Nearby chip.
4. Keep nearby sorting but stop hard-filtering out businesses without coordinates: sort rows with coordinates first (by distance), then the remainder, so results never come back empty.
5. Show "X km away" on the business detail page when coordinates are known.

## Implementation progress
- DONE: `client/src/hooks/useUserLocation.ts` — shared hook (`request`, `clear`, `status`, `coordinates`, `message`) persisting coordinates in `sessionStorage` under `just-finds-user-coordinates` for 30 min, plus `formatDistance()` helper (m below 1 km, 1 decimal below 10 km, whole km above).
- DONE: `SearchHero` — labelled "Near me" control with spinner/granted states; resolving coordinates now navigates straight to nearby results; accuracy shown in metres.
- DONE: `SearchResults` — falls back to stored coordinates, `enableNearby` requests permission when tapped, truthful status line.
- TODO: stop hard-filtering coordinate-less businesses in `getPublicSearchPage` when `sort === "nearby"` (keep them after the located ones).
- TODO: show distance on `BusinessDetail`.
- TODO (phase 3): Indian city/locality seed + auto locality detection from GPS.
- TODO (phase 4/5): 3-level taxonomy from `category-master-list-source.md` (12 main categories, saved in repo root) and browse pages.
