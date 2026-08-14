# Official Google Places API findings for Just Finds import flow

_Research captured 2026-08-15 for the requested official Google-powered business discovery and editable import-draft feature._

## Selected API surface

Use **Places API (New)** server-side only. Autocomplete is a `POST` to `https://places.googleapis.com/v1/places:autocomplete`; it accepts typed input, a session token, and either location bias or location restriction, but not both. It returns up to five combined suggestions. The UI must use the required Google attribution treatment when showing predictions without a map.

Use Place Details (New) after a user chooses a place. It is a `GET` to `https://places.googleapis.com/v1/places/{PLACE_ID}` and requires an explicit `X-Goog-FieldMask`. The production implementation must request only fields needed for the editable Just Finds draft rather than a wildcard field mask.

Text Search (New), `POST https://places.googleapis.com/v1/places:searchText`, is appropriate as a fallback where a user completes a business-name plus area query rather than selecting autocomplete. It also requires an explicit field mask.

## Implementation guardrails

- Keep the Maps/Places credential only in a server environment secret and send it through `X-Goog-Api-Key`; never expose it to the browser or local storage.
- Generate a per-discovery session token in the client and send it only to the server discovery flow; pass that same token through to the selected-place detail request when supported.
- Use a small, explicit data mask. Candidate imported facts may include place ID, display name, formatted address, address components, location, primary type/types, permitted phone number, website URI, time zone, and regular opening hours.
- Do **not** request, persist, display, or translate Google ratings and reviews as Just Finds ratings/reviews. Do **not** import Google photos into the Just Finds media gallery.
- Persist the external place ID as a dedicated identity for duplicate detection. A selected official place creates an owner-scoped private import draft only; it never publishes directly.
- Apply input length limits, debounce in the UI, server-side request throttling, bounded responses, typed error mapping, and strict ownership checks around import drafts.

## 2026-08-15 route and interface validation

The explicit `/business/add/import` route must be registered before the generic `/business/:businessId/:tool` route. Without that ordering, the `add` path segment is parsed as a business identifier and the import screen renders an owner workspace with an invalid numeric ID. The route ordering was corrected and the official Google Places discovery interface was then visually verified at the intended URL. The screen exposes a business-name field, optional locality field, server-side credential disclosure notice, debounced and rate-limited search messaging, and a clear return path to manual listing creation.

## 2026-08-15 category and About prefill

Place Details (New) exposes `primaryType` for an official primary category and `editorialSummary` as an available detail field. The field mask must name each desired field explicitly, rather than use a wildcard. Just Finds uses `primaryType` only to select an existing approved mapping and uses `editorialSummary.text` only when the official response contains it. The resulting category and About value remain editable by the owner. The implementation does not request ratings, reviews, photos, or a generative summary.

The protected `/business/add/import` entry route was also rendered at 1280×720 and 375×812 after the prefill enhancement. Both layouts preserve the official discovery heading, business-name field, optional locality field, server-side-credential notice, and return path to manual creation. The review form is reached only after a real official result is selected, so no fabricated business or import draft was created for visual validation.

## Official references

1. [Autocomplete (New) — Google for Developers](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete)
2. [Place Details (New) — Google for Developers](https://developers.google.com/maps/documentation/places/web-service/place-details)
3. [Text Search (New) — Google for Developers](https://developers.google.com/maps/documentation/places/web-service/text-search)
4. [Choose fields to return — Google for Developers](https://developers.google.com/maps/documentation/places/web-service/choose-fields)
