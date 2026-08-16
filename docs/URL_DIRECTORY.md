# Just Finds — Complete URL Directory

**Live base domain:** `https://justfinds-izng9njy.manus.space`

This directory lists every current URL pattern registered by the application router, plus every named owner, administrator, and business-tool URL exposed through the corresponding workspace navigation. Dynamic placeholders must be replaced with real application values; do not type the angle brackets literally. The directory is based on the current router and workspace source files.[1] [2] [3] [4]

> **Access note:** A URL can exist while still requiring authentication, ownership of the selected business, or an administrator role. These checks are enforced by the application and server procedures.

## Public discovery, authentication, and customer URLs

| No. | Complete URL / template | Purpose | Access |
|---:|---|---|---|
| 1 | `https://justfinds-izng9njy.manus.space/` | Homepage | Public |
| 2 | `https://justfinds-izng9njy.manus.space/search` | Local search results | Public |
| 3 | `https://justfinds-izng9njy.manus.space/categories` | Category directory | Public |
| 4 | `https://justfinds-izng9njy.manus.space/category/<category>` | Main category landing page | Public |
| 5 | `https://justfinds-izng9njy.manus.space/category/<category>/<subcategory>` | Subcategory landing page | Public |
| 6 | `https://justfinds-izng9njy.manus.space/category/<category>/<subcategory>/<businessType>` | Business-type category landing page | Public |
| 7 | `https://justfinds-izng9njy.manus.space/city/<city>` | City landing page | Public |
| 8 | `https://justfinds-izng9njy.manus.space/city/<city>/<locality>` | Locality landing page | Public |
| 9 | `https://justfinds-izng9njy.manus.space/jobs` | Jobs directory | Public |
| 10 | `https://justfinds-izng9njy.manus.space/saved` | Saved listings | Sign-in may be required to persist saved items |
| 11 | `https://justfinds-izng9njy.manus.space/login` | Sign-in entry | Public |
| 12 | `https://justfinds-izng9njy.manus.space/signup` | Sign-up entry | Public |
| 13 | `https://justfinds-izng9njy.manus.space/forgot-password` | Account-recovery entry | Public |
| 14 | `https://justfinds-izng9njy.manus.space/verify/<slug>` | Business-verification page | Public route; verification action is permission-controlled |
| 15 | `https://justfinds-izng9njy.manus.space/appointment/<token>` | Customer appointment page | Public to a valid appointment token |
| 16 | `https://justfinds-izng9njy.manus.space/<category>/<city>/<slug>` | Public business detail page | Public when the listing is published |
| 17 | `https://justfinds-izng9njy.manus.space/business/<identifier>/website` | Public business website for a **non-numeric** business identifier | Public when the site/listing is public |
| 18 | `https://justfinds-izng9njy.manus.space/404` | Explicit not-found page | Public |
| 19 | `https://justfinds-izng9njy.manus.space/<any-unmatched-path>` | Router fallback; renders the 404 page | Public |

## Search query parameters

Use these optional parameters only with URL 2. Multiple parameters can be combined.

| Parameter | Accepted form | Meaning |
|---|---|---|
| `q` | text | Search words |
| `city` | city slug/text | Limit results to a city |
| `locality` | locality slug/text | Limit results to a locality |
| `category` | category slug/text | Filter by main category |
| `subcategory` | subcategory slug/text | Filter by subcategory |
| `businessType` | type slug/text | Filter by business type |
| `lat` | latitude number | Use a supplied latitude for nearby distance calculation |
| `lng` | longitude number | Use a supplied longitude for nearby distance calculation |
| `sort` | `recommended`, `nearby`, or `rating` | Result ordering |
| `verified` | `1` | Show verified listings only |

> Example pattern only: `https://justfinds-izng9njy.manus.space/search?q=<searchText>&city=<city>&lat=<latitude>&lng=<longitude>&sort=nearby`

## Business platform and onboarding URLs

All URLs in this section are private owner-workspace routes. A signed-in user must have permission for the selected business where applicable.[1] [2]

| No. | Complete URL / template | Purpose |
|---:|---|---|
| 20 | `https://justfinds-izng9njy.manus.space/business` | Unified business listing manager |
| 21 | `https://justfinds-izng9njy.manus.space/business?businessId=<businessId>` | Listing manager with one business selected; this is the canonical selected-listing deep link |
| 22 | `https://justfinds-izng9njy.manus.space/business/onboarding` | Business-platform onboarding entry |
| 23 | `https://justfinds-izng9njy.manus.space/business/add` | Choose manual entry or Google import |
| 24 | `https://justfinds-izng9njy.manus.space/business/add/manual` | Manual business-entry flow |
| 25 | `https://justfinds-izng9njy.manus.space/business/add/import` | Google Places import flow |

## Individual business management tools

Replace `<businessId>` with the numeric ID of a business owned by the signed-in account. These are all handled by the registered route `business/:businessId/:tool`; each named tool below is exposed by the tool navigation.[1] [2]

| No. | Complete URL / template | Tool |
|---:|---|---|
| 26 | `https://justfinds-izng9njy.manus.space/business/<businessId>/preview` | Private public-listing preview |
| 27 | `https://justfinds-izng9njy.manus.space/business/<businessId>/profile` | Profile and location editor |
| 28 | `https://justfinds-izng9njy.manus.space/business/<businessId>/duplicates` | Duplicate check |
| 29 | `https://justfinds-izng9njy.manus.space/business/<businessId>/hours` | Regular and special hours |
| 30 | `https://justfinds-izng9njy.manus.space/business/<businessId>/services` | Services and items |
| 31 | `https://justfinds-izng9njy.manus.space/business/<businessId>/facilities` | Facilities |
| 32 | `https://justfinds-izng9njy.manus.space/business/<businessId>/items` | Item manager |
| 33 | `https://justfinds-izng9njy.manus.space/business/<businessId>/photos` | Photo manager |
| 34 | `https://justfinds-izng9njy.manus.space/business/<businessId>/verification` | Verification tools |
| 35 | `https://justfinds-izng9njy.manus.space/business/<businessId>/appointments` | Appointment calendar manager |
| 36 | `https://justfinds-izng9njy.manus.space/business/<businessId>/leads` | Lead CRM |
| 37 | `https://justfinds-izng9njy.manus.space/business/<businessId>/reviews` | Reviews manager |
| 38 | `https://justfinds-izng9njy.manus.space/business/<businessId>/offers` | Offers manager |
| 39 | `https://justfinds-izng9njy.manus.space/business/<businessId>/ai-content` | AI content workspace |
| 40 | `https://justfinds-izng9njy.manus.space/business/<businessId>/seo` | SEO manager |
| 41 | `https://justfinds-izng9njy.manus.space/business/<businessId>/domain` | Custom-domain settings |
| 42 | `https://justfinds-izng9njy.manus.space/business/<businessId>/google-import` | Google import settings |
| 43 | `https://justfinds-izng9njy.manus.space/business/<businessId>/certificate` | Certificate trust asset |
| 44 | `https://justfinds-izng9njy.manus.space/business/<businessId>/qr` | QR-code trust asset |
| 45 | `https://justfinds-izng9njy.manus.space/business/<businessId>/notifications` | Business notification settings |
| 46 | `https://justfinds-izng9njy.manus.space/business/<businessId>/settings` | Business settings |
| 47 | `https://justfinds-izng9njy.manus.space/business/<businessId>/website` | AI website builder; a numeric identifier in URL 17 routes here as well |
| 48 | `https://justfinds-izng9njy.manus.space/business/<any-rest-path>` | Business-platform catch-all route; unsupported paths return the business platform rather than a distinct public page |

## Owner workspace URLs

All owner workspace URLs require sign-in. Their data is scoped to the authenticated owner.[1] [3]

| No. | Complete URL | Purpose |
|---:|---|---|
| 49 | `https://justfinds-izng9njy.manus.space/dashboard` | Alias for the owner workspace |
| 50 | `https://justfinds-izng9njy.manus.space/owner` | Owner overview |
| 51 | `https://justfinds-izng9njy.manus.space/owner/profile` | Redirects to the unified `/business` listing manager |
| 52 | `https://justfinds-izng9njy.manus.space/owner/leads` | Owner lead inbox |
| 53 | `https://justfinds-izng9njy.manus.space/owner/content` | AI content and voice introduction workspace |
| 54 | `https://justfinds-izng9njy.manus.space/owner/jobs` | Employer job workflow |
| 55 | `https://justfinds-izng9njy.manus.space/owner/settings` | Owner custom-domain and landing settings |
| 56 | `https://justfinds-izng9njy.manus.space/owner/<any-rest-path>` | Owner-workspace catch-all route |

## Administrator workspace URLs

All URLs in this section require a signed-in user with an administrator role.[1] [4]

| No. | Complete URL | Purpose |
|---:|---|---|
| 57 | `https://justfinds-izng9njy.manus.space/admin` | Administrator command centre |
| 58 | `https://justfinds-izng9njy.manus.space/admin/categories` | Category schemas and city management |
| 59 | `https://justfinds-izng9njy.manus.space/admin/approvals` | Detailed listing approval queue |
| 60 | `https://justfinds-izng9njy.manus.space/admin/verification` | Business verification review queue |
| 61 | `https://justfinds-izng9njy.manus.space/admin/imports` | Bulk CSV/Excel imports |
| 62 | `https://justfinds-izng9njy.manus.space/admin/moderation` | Review moderation |
| 63 | `https://justfinds-izng9njy.manus.space/admin/test-listings` | Internal test-listing management |
| 64 | `https://justfinds-izng9njy.manus.space/admin/ranking` | Ranking controls |
| 65 | `https://justfinds-izng9njy.manus.space/admin/ai` | AI governance and generated-content review |
| 66 | `https://justfinds-izng9njy.manus.space/admin/ai-center` | AI Intelligence Center |
| 67 | `https://justfinds-izng9njy.manus.space/admin/<any-rest-path>` | Admin-workspace catch-all; unknown sections currently fall through to the ranking view rather than a standalone page |

## Placeholder rules

| Placeholder | Replace with |
|---|---|
| `<category>` | A real category URL slug |
| `<subcategory>` | A real subcategory URL slug valid under the selected category |
| `<businessType>` | A real business-type URL slug valid under the selected taxonomy |
| `<city>` | A real city URL slug |
| `<locality>` | A real locality URL slug within the city |
| `<slug>` | A real business or verification slug, depending on the route |
| `<identifier>` | A non-numeric public website identifier; numeric values open the private website builder |
| `<businessId>` | A positive numeric business ID visible to the signed-in owner/admin |
| `<token>` | A valid appointment token |

## References

[1]: https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/App.tsx "Just Finds route registry"
[2]: https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx "Business management tool navigation"
[3]: https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/OwnerWorkspace.tsx "Owner workspace navigation"
[4]: https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AdminWorkspace.tsx "Administrator workspace navigation"
