# Just Finds — Live Page URLs and GitHub Code Links

**Live base URL:** `https://justfinds-izng9njy.manus.space`  
**GitHub repository:** [UDAYRAJ01/Manusn-justfinds](https://github.com/UDAYRAJ01/Manusn-justfinds)  
**GitHub branch:** [`main`](https://github.com/UDAYRAJ01/Manusn-justfinds/tree/main)

This is the complete page-to-code directory for the current application router. Each **GitHub code URL** opens the React file that owns the relevant screen or route handler. Dynamic values enclosed in `<...>` must be replaced with real values; do not type the angle brackets in a browser.[1]

> **Important:** The GitHub code link opens source code. The live URL opens the website. Private owner and admin screens need an authenticated account with the required permissions.

## Public, discovery, authentication, and customer pages

| No. | Live page URL | GitHub code URL | Access |
|---:|---|---|---|
| 1 | `https://justfinds-izng9njy.manus.space/` | [Home.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/Home.tsx) | Public |
| 2 | `https://justfinds-izng9njy.manus.space/search` | [SearchResults.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/SearchResults.tsx) | Public |
| 3 | `https://justfinds-izng9njy.manus.space/categories` | [Categories.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/Categories.tsx) | Public |
| 4 | `https://justfinds-izng9njy.manus.space/category/<category>` | [DiscoveryLanding.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/DiscoveryLanding.tsx) | Public |
| 5 | `https://justfinds-izng9njy.manus.space/category/<category>/<subcategory>` | [DiscoveryLanding.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/DiscoveryLanding.tsx) | Public |
| 6 | `https://justfinds-izng9njy.manus.space/category/<category>/<subcategory>/<businessType>` | [DiscoveryLanding.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/DiscoveryLanding.tsx) | Public |
| 7 | `https://justfinds-izng9njy.manus.space/city/<city>` | [DiscoveryLanding.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/DiscoveryLanding.tsx) | Public |
| 8 | `https://justfinds-izng9njy.manus.space/city/<city>/<locality>` | [DiscoveryLanding.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/DiscoveryLanding.tsx) | Public |
| 9 | `https://justfinds-izng9njy.manus.space/jobs` | [Jobs.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/Jobs.tsx) | Public |
| 10 | `https://justfinds-izng9njy.manus.space/saved` | [Saved.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/Saved.tsx) | Sign-in may be required |
| 11 | `https://justfinds-izng9njy.manus.space/login` | [AuthEntry.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AuthEntry.tsx) | Public |
| 12 | `https://justfinds-izng9njy.manus.space/signup` | [AuthEntry.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AuthEntry.tsx) | Public |
| 13 | `https://justfinds-izng9njy.manus.space/forgot-password` | [AuthEntry.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AuthEntry.tsx) | Public |
| 14 | `https://justfinds-izng9njy.manus.space/verify/<slug>` | [VerifyBusiness.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/VerifyBusiness.tsx) | Public route; action permission-controlled |
| 15 | `https://justfinds-izng9njy.manus.space/appointment/<token>` | [CustomerAppointment.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/CustomerAppointment.tsx) | Valid token required |
| 16 | `https://justfinds-izng9njy.manus.space/<category>/<city>/<slug>` | [BusinessDetail.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessDetail.tsx) | Public for published listing |
| 17 | `https://justfinds-izng9njy.manus.space/business/<identifier>/website` | [PublicWebsite.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/PublicWebsite.tsx) | Public if identifier is non-numeric and site is public |
| 18 | `https://justfinds-izng9njy.manus.space/404` | [NotFound.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/NotFound.tsx) | Public |
| 19 | `https://justfinds-izng9njy.manus.space/<unmatched-path>` | [NotFound.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/NotFound.tsx) | Public fallback |

## Business platform and onboarding pages

| No. | Live page URL | GitHub code URL | Access |
|---:|---|---|---|
| 20 | `https://justfinds-izng9njy.manus.space/business` | [BusinessPlatform.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessPlatform.tsx) | Signed-in owner/admin |
| 21 | `https://justfinds-izng9njy.manus.space/business?businessId=<businessId>` | [BusinessPlatform.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessPlatform.tsx) | Selected business must be permitted |
| 22 | `https://justfinds-izng9njy.manus.space/business/onboarding` | [BusinessPlatform.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessPlatform.tsx) | Signed-in owner/admin |
| 23 | `https://justfinds-izng9njy.manus.space/business/add` | [BusinessPlatform.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessPlatform.tsx) | Signed-in owner/admin |
| 24 | `https://justfinds-izng9njy.manus.space/business/add/manual` | [BusinessPlatform.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessPlatform.tsx) | Signed-in owner/admin |
| 25 | `https://justfinds-izng9njy.manus.space/business/add/import` | [GoogleImportSettings.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/GoogleImportSettings.tsx) | Signed-in owner/admin |

## Individual business management pages

Every URL in this group is handled by [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx). Replace `<businessId>` with a business ID owned by the current user. URL 47 opens the private builder when the identifier is numeric; its route decision is in [App.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/App.tsx).

| No. | Live page URL | GitHub code URL | Tool |
|---:|---|---|---|
| 26 | `https://justfinds-izng9njy.manus.space/business/<businessId>/preview` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Private listing preview |
| 27 | `https://justfinds-izng9njy.manus.space/business/<businessId>/profile` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Profile editor |
| 28 | `https://justfinds-izng9njy.manus.space/business/<businessId>/duplicates` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Duplicate check |
| 29 | `https://justfinds-izng9njy.manus.space/business/<businessId>/hours` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Hours editor |
| 30 | `https://justfinds-izng9njy.manus.space/business/<businessId>/services` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Services |
| 31 | `https://justfinds-izng9njy.manus.space/business/<businessId>/facilities` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Facilities |
| 32 | `https://justfinds-izng9njy.manus.space/business/<businessId>/items` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Items |
| 33 | `https://justfinds-izng9njy.manus.space/business/<businessId>/photos` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Photos |
| 34 | `https://justfinds-izng9njy.manus.space/business/<businessId>/verification` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Verification tools |
| 35 | `https://justfinds-izng9njy.manus.space/business/<businessId>/appointments` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Appointment manager |
| 36 | `https://justfinds-izng9njy.manus.space/business/<businessId>/leads` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Lead CRM |
| 37 | `https://justfinds-izng9njy.manus.space/business/<businessId>/reviews` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Reviews manager |
| 38 | `https://justfinds-izng9njy.manus.space/business/<businessId>/offers` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Offers |
| 39 | `https://justfinds-izng9njy.manus.space/business/<businessId>/ai-content` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | AI content |
| 40 | `https://justfinds-izng9njy.manus.space/business/<businessId>/seo` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | SEO |
| 41 | `https://justfinds-izng9njy.manus.space/business/<businessId>/domain` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Custom domain |
| 42 | `https://justfinds-izng9njy.manus.space/business/<businessId>/google-import` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Google import |
| 43 | `https://justfinds-izng9njy.manus.space/business/<businessId>/certificate` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Certificate |
| 44 | `https://justfinds-izng9njy.manus.space/business/<businessId>/qr` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | QR code |
| 45 | `https://justfinds-izng9njy.manus.space/business/<businessId>/notifications` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Notifications |
| 46 | `https://justfinds-izng9njy.manus.space/business/<businessId>/settings` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | Settings |
| 47 | `https://justfinds-izng9njy.manus.space/business/<businessId>/website` | [BusinessTools.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessTools.tsx) | AI website builder |
| 48 | `https://justfinds-izng9njy.manus.space/business/<any-rest-path>` | [BusinessPlatform.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/BusinessPlatform.tsx) | Business catch-all |

## Owner workspace pages

| No. | Live page URL | GitHub code URL | Access |
|---:|---|---|---|
| 49 | `https://justfinds-izng9njy.manus.space/dashboard` | [OwnerWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/OwnerWorkspace.tsx) | Signed-in owner |
| 50 | `https://justfinds-izng9njy.manus.space/owner` | [OwnerWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/OwnerWorkspace.tsx) | Signed-in owner |
| 51 | `https://justfinds-izng9njy.manus.space/owner/profile` | [App.tsx redirect handler](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/App.tsx) | Redirects to `/business` |
| 52 | `https://justfinds-izng9njy.manus.space/owner/leads` | [OwnerWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/OwnerWorkspace.tsx) | Signed-in owner |
| 53 | `https://justfinds-izng9njy.manus.space/owner/content` | [OwnerWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/OwnerWorkspace.tsx) | Signed-in owner |
| 54 | `https://justfinds-izng9njy.manus.space/owner/jobs` | [OwnerWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/OwnerWorkspace.tsx) | Signed-in owner |
| 55 | `https://justfinds-izng9njy.manus.space/owner/settings` | [OwnerWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/OwnerWorkspace.tsx) | Signed-in owner |
| 56 | `https://justfinds-izng9njy.manus.space/owner/<any-rest-path>` | [OwnerWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/OwnerWorkspace.tsx) | Owner catch-all |

## Administrator workspace pages

Every administrator URL below is implemented in [AdminWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AdminWorkspace.tsx) and requires an administrator role.

| No. | Live page URL | GitHub code URL | Workspace section |
|---:|---|---|---|
| 57 | `https://justfinds-izng9njy.manus.space/admin` | [AdminWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AdminWorkspace.tsx) | Command centre |
| 58 | `https://justfinds-izng9njy.manus.space/admin/categories` | [AdminWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AdminWorkspace.tsx) | Categories and cities |
| 59 | `https://justfinds-izng9njy.manus.space/admin/approvals` | [AdminWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AdminWorkspace.tsx) | Listing approvals |
| 60 | `https://justfinds-izng9njy.manus.space/admin/verification` | [AdminWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AdminWorkspace.tsx) | Verification queue |
| 61 | `https://justfinds-izng9njy.manus.space/admin/imports` | [AdminWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AdminWorkspace.tsx) | Bulk imports |
| 62 | `https://justfinds-izng9njy.manus.space/admin/moderation` | [AdminWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AdminWorkspace.tsx) | Moderation |
| 63 | `https://justfinds-izng9njy.manus.space/admin/test-listings` | [AdminWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AdminWorkspace.tsx) | Test listings |
| 64 | `https://justfinds-izng9njy.manus.space/admin/ranking` | [AdminWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AdminWorkspace.tsx) | Ranking |
| 65 | `https://justfinds-izng9njy.manus.space/admin/ai` | [AdminWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AdminWorkspace.tsx) | AI governance |
| 66 | `https://justfinds-izng9njy.manus.space/admin/ai-center` | [AdminWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AdminWorkspace.tsx) | AI Intelligence Center |
| 67 | `https://justfinds-izng9njy.manus.space/admin/<any-rest-path>` | [AdminWorkspace.tsx](https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/pages/AdminWorkspace.tsx) | Admin catch-all |

## Dynamic placeholder examples

| Placeholder | Replace with | Safe example pattern |
|---|---|---|
| `<category>` | A valid category slug | `/category/restaurants` |
| `<subcategory>` | A subcategory under that category | `/category/restaurants/pizza` |
| `<businessType>` | A valid business type | `/category/restaurants/pizza/dine-in` |
| `<city>` | A city slug | `/city/delhi` |
| `<locality>` | A locality slug | `/city/delhi/rohini` |
| `<slug>` | A real public business or verification slug | `/restaurants/delhi/example-business` |
| `<identifier>` | A **non-numeric** public website identifier | `/business/example-business/website` |
| `<businessId>` | A numeric business ID that the owner/admin can access | `/business/123/profile` |
| `<token>` | A valid appointment token | `/appointment/<token>` |

## Router and source references

[1]: https://github.com/UDAYRAJ01/Manusn-justfinds/blob/main/client/src/App.tsx "Current Just Finds route registry"

