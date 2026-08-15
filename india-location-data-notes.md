# India location data + nearby search work notes

## External data source (keep for attribution)
- **GeoNames postal export for India**: `https://download.geonames.org/export/zip/IN.zip` (file `IN.txt`, 155,570 rows). Licence: **CC-BY 4.0 — must credit geonames.org**.
- Alternative reference (no coordinates): `https://raw.githubusercontent.com/kishorek/India-Codes/master/csv/pincodes.csv`.
- `IN.txt` columns (tab separated): 0 country, 1 postalcode, 2 place name, 3 admin1(state), 4 admin1 code, 5 admin2(district), 6 admin2 code, 7 admin3(taluk/city), 8 admin3 code, 9 lat, 10 lng, 11 accuracy.

## Generated artifacts
- `scripts/build-india-locations.py` → writes `/home/ubuntu/india-data/seed/{cities.csv,localities.csv,summary.json}`.
- Build result: **10,061 cities**, **154,842 localities**, 35 states.
- `scripts/seed-india-locations.mjs` → idempotent upsert seeder (matches cities on slug, localities on cityId+slug).
- Seed applied: database now has **cities = 10,063**, **localities = 154,842**.

## Schema change applied
- Migration `drizzle/0021_true_roxanne_simpson.sql`: added `localities.pincode varchar(12)`, plus `locality_name_idx` and `locality_pincode_idx`. Already executed successfully.

## Nearby search diagnosis (fixed)
- Root cause: geolocation coords were held in local component state only, were lost on navigation, and coordinate-less businesses were dropped from nearby results.
- Fixes made: shared `client/src/hooks/useUserLocation.ts` (persisted coords + permission states), SearchHero + SearchResults wired to it, `server/db.ts` search query no longer drops coordinate-less rows and always computes distance when user coords are known, distance shown on `BusinessCard` and `BusinessDetail`.

## Remaining in this task
- Locality auto-detect from GPS via new `findNearestLocality` helper + tRPC procedure and UI.
- 3-level category taxonomy (category → subcategory → business type) seeded from `category-master-list.txt` (copied into project root from the user's attachment).
- Category → subcategory → detail browse flow.
