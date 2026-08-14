# Google Category, City, and About Prefill Validation

## 2026-08-15

The official Google Places import route at `/business/add/import` was validated in the running application at desktop (1280×720) and mobile (375×812) viewports. The entry experience renders without route capture or visual overflow, keeps the business-name and optional locality inputs usable, and clearly communicates server-side credentials, rate-limited discovery, and private editable draft creation.

The Category, City, and About review values are populated only after a real official-place selection. Automated coverage verifies that a Google locality selects an exact existing Just Finds city, recognizes `postal_town` where present, and leaves City unset when no active existing city matches. The system does not create or guess a city from external data.
