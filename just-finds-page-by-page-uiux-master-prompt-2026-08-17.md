# Just Finds — Page-by-Page Modern UI/UX Master Prompt

## How to use this document

Use this document as the **single source of truth** for the next visual redesign of Just Finds. Apply it page by page; do not replace a working product flow merely to make the interface look different. The desired result is an **original local-discovery product**: the calm clarity and structured productivity of a modern Google dashboard, combined with the speed, editorial hierarchy, and conversion discipline of leading Indian local-discovery and commerce interfaces. It must not copy the branding, layouts, illustrations, or proprietary visual language of Google, Swiggy, Zomato, or any other product.

> **Non-negotiable:** Preserve every existing route, role gate, tRPC contract, ownership boundary, database workflow, approved India Tier-1/Tier-2 city rule, booking/CRM flow, Google import policy, and published listing. This is a UX redesign, not a feature reset.

## 1. Master design prompt — apply before changing any page

**Prompt:**

> Redesign Just Finds as a premium India-first local search and business-management product. The public experience must feel fast, helpful, trustworthy, and local; the owner and administrator experiences must feel like clear, capable software. Use a bright off-white canvas, a deep ink/navy text system, a confident but restrained cobalt-blue primary action, one warm discovery accent, soft slate borders, and sparse elevation. Build hierarchy with spacing, typography, and real data—not decorative gradients, oversized shadows, excessive pill shapes, or arbitrary illustrations. Keep all information factual. Never fabricate customer ratings, reviews, testimonials, photos, business claims, booking availability, leads, or analytics.

### 1.1 Visual tokens

| Token | Direction | Usage |
|---|---|---|
| Canvas | `#F8FAFC` / near-white | Page backgrounds and roomy public sections |
| Surface | `#FFFFFF` | Cards, sheets, search controls, tables |
| Ink | `#0F172A` | Headings, high-priority actions, dashboard navigation |
| Muted text | `#64748B` | Supporting facts, metadata, helper copy |
| Primary | `#2563EB` | Search, primary save/continue/submit actions, active navigation |
| Primary hover | `#1D4ED8` | Hover/pressed action state |
| Discovery accent | `#F97316` | Limited use for offers, urgency, or a single highlighted secondary CTA |
| Positive | `#16A34A` | Verified, confirmed, active only when factually true |
| Warning | `#D97706` | Pending approval, change requested, incomplete profile |
| Danger | `#DC2626` | Reject, cancel, destructive actions and validation errors |
| Borders | `#E2E8F0` | Dividers, inputs, table separation |

Use a friendly but highly legible sans-serif typeface such as **Inter**, **Manrope**, or a comparable UI font. Heading scale should be deliberate: 32–40px desktop page title, 24–28px mobile title, 18–20px section heading, 14–16px body, and 12–13px metadata. Keep line-height generous. Use 8px spacing increments, 12–16px control radii, 16–24px card radii, and subdued shadows only on floating or elevated surfaces.

### 1.2 Shared interaction and content rules

| Area | Required behaviour |
|---|---|
| Actions | One visually dominant primary action per section. Secondary actions are outlined or text links. Destructive actions remain visually separated. |
| Search | Search fields are direct, keyboard-friendly, visibly focused, and never lose the user’s typed query when filters change. |
| Loading | Use lightweight skeletons that match final layout; do not blank the entire page. |
| Empty states | Explain what is absent, why it matters, and one clear next action. Do not create fake sample records. |
| Errors | Show the failed action, a useful recovery action, and preserve valid form inputs. |
| Accessibility | Maintain 4.5:1 contrast for normal text, visible focus rings, semantic headings, labels, keyboard reachability, and 44px minimum touch targets. |
| Motion | Use 120–220ms transform/opacity transitions; respect reduced motion; no slow decorative animation. |
| Mobile | Design mobile as an app-like sequence with sticky important actions, compact cards, safe-area spacing, and no horizontal scroll. |

### 1.3 Functional safeguards

Keep the public marketplace factual. Google imports may prefill only the permitted editable listing facts; **never** import Google ratings, reviews, or photos. City controls must only expose the approved India Tier-1 and Tier-2 catalogue. Owner workspace and admin workspace must remain separate and role-gated. The website builder may change presentation only and must never overwrite core business facts.

---

## 2. Public discovery pages

### 2.1 Home page — `/`

**Prompt:**

> Create a confident local-discovery home screen whose first viewport answers one question instantly: “What are you looking for, and where?” Use a clean sticky top bar with the Just Finds mark, a location-aware search entry, “List your business,” and a calm sign-in affordance. Place a focused search hero on the left with keyword/category input, approved-city search, and a single blue “Search” action. Pair it with a restrained discovery panel on the right: recent/saved searches when genuinely available, otherwise popular factual categories. Below, use a compact horizontal category rail, an editorial “Explore by category” grid, and a real-data “Recently added / verified / nearby” section only when data exists. Avoid a generic marketing hero, fake statistics, or duplicated CTAs.

**Desktop layout:** 12-column content container. Header 72px; hero uses 7/5 columns; cards retain air but not excessive empty space. Category cards are icon-led, white, lightly bordered, and include only category name plus real listing count if present.

**Mobile layout:** A compact 56–64px header. Stack the keyword and city inputs into one readable search sheet. Keep the primary search action sticky at the bottom of the sheet when the keyboard is open. Show category chips as a horizontal scroll with visible affordance, not a crowded grid.

### 2.2 Search results — `/search`

**Prompt:**

> Design search as a high-confidence decision workspace, not a loose list of cards. Keep a compact search bar at the top showing query and approved city. On desktop, use a left filter rail and a right results column; on mobile, use a sticky summary bar with “Filters” and “Sort” bottom sheets. Surface filters only when supported by data: category, locality, open now, verified, distance, and service type. Display a factual result count, applied filter chips, loading skeletons, and an honest empty state. Every result card must prioritize business identity, category, city/locality, real verification state, real open/closed information, and relevant actions such as call, directions, booking, quote, or website—only when available.

Do not show invented ratings or review totals. Use a modest map/list toggle only when map data is available; preserve the existing graceful map-unavailable state. Keep list cards scannable: photo only if owner-provided, name, two supporting fact lines, badges based on actual status, and a clear chevron or action cluster.

### 2.3 Category, city, and locality landing pages — `/category/*`, `/city/*`

**Prompt:**

> Turn each landing page into a useful SEO-friendly local exploration page without looking like an article dump. Begin with breadcrumb, concise factual title, location/category context, and the same compact search control used on results. Follow with genuine subcategories or localities, then a ranked real listing grid/list. When data is insufficient, show a constructive discovery state and links back to supported cities/categories. Keep the page visually lighter than the home hero and avoid claims such as “best,” “top-rated,” or “most trusted” unless backed by an explicit ranking model and data.

### 2.4 Categories browser — `/categories`

**Prompt:**

> Build an efficient category directory with a page title, one-line explanation, search-within-categories field, and grouped category cards. On desktop use a responsive 3–4 column layout; on mobile use a two-column compact grid with large touch targets. Each card has a simple neutral icon, category name, optional truthful listing count, and a subtle directional cue. Do not use large image tiles or decorative gradients. Include meaningful empty and no-results states.

### 2.5 Business detail — `/:category/:city/:slug`

**Prompt:**

> Design the business detail page as the product’s trust and conversion screen. Lead with a clear information panel: business name, category, verified/pending state only if factual, location, availability, and owner-supplied images. On desktop, use a two-column layout: content/gallery left, sticky action panel right. On mobile, keep the identity section compact, make the action row horizontally reachable, and use a sticky bottom action bar only for real contact/booking/quote actions. Organize content into Overview, Services, Hours, Location, Photos, and Website sections—hiding sections with no real data. Make phone, directions, booking, quote, and website actions distinct but never competing.

Add a transparent source/status cue where useful, such as “Owner verified” or “Hours provided by business,” but never imitate third-party review products. Map failures must degrade to a clear location summary and a directions link. Use galleries only for real owner-provided media and do not stretch small images.

### 2.6 Public business website — `/business/:slug/website`

**Prompt:**

> Render the owner-published website as a polished mini-site that reflects its selected design, while preserving factual business content. Use a simple site header, a legible hero with business name/category/location, a service section, an about section, contact/hours, and booking/contact CTA only when enabled. Keep a visible route back to the Just Finds listing. The website must feel bespoke through layouts, spacing, and approved color/theme choices—not through misleading claims or arbitrary content. If unpublished, show a calm not-published state with the right owner/admin path only to authorized users.

### 2.7 Saved listings — `/saved`

**Prompt:**

> Create a personal saved-listings page with a clear title, lightweight grouping or sort, and compact real listing cards. Empty state should say that saved places appear here and link back to discovery. Provide remove affordance with undo feedback. Do not display placeholder saved businesses.

### 2.8 Jobs — `/jobs`

**Prompt:**

> Use the same discovery language as search but adapt it to job exploration: role/title search, city, job type, and a clean listing stack. Identify employer, location, employment details, and freshness only from real records. On mobile, filters open as a bottom sheet. No fictional salary, company rating, or urgency labels.

### 2.9 Authentication entry — `/login`, `/signup`, `/forgot-password`

**Prompt:**

> Present authentication as a focused, low-distraction identity screen. Use a compact top logo, a centered but not oversized card, a simple “Continue to secure sign-in” action, privacy/support microcopy, and a clear route back to public discovery. Never visually mix administrator access into the normal user sign-in path. On mobile, remove unnecessary chrome and preserve safe-area spacing.

### 2.10 Customer appointment page — `/appointment/:token`

**Prompt:**

> Design the customer appointment screen as a clear status tracker. Show business identity, selected request time, current request status, and only the actions the token permits: accept proposed time, request reschedule, cancel, or download/add to calendar after confirmation. Use a small timeline to explain requested → proposed/approved → confirmed/cancelled. Prevent accidental cancellation with confirmation. Do not reveal owner-only details, internal notes, or unrelated customer data.

### 2.11 Verification and utility pages — `/verify/:slug`, `/404`

**Prompt:**

> Keep verification simple and serious: business identity, why verification is needed, permitted steps, evidence guidance, secure upload status, and a clear submission state. For 404, use a friendly recovery card with search, home, and category links. Neither page needs decorative illustrations; trust and recovery matter more.

---

## 3. Business owner pages

### 3.1 Owner workspace and business platform — `/business`, `/business/onboarding`, `/dashboard`, `/owner/*`

**Prompt:**

> Redesign the owner area as a modern software workspace. On desktop use a calm left sidebar with business switcher at the top, primary destinations in the middle, and account/support at the bottom. Use a white content surface on a pale canvas; reserve dark navy for the sidebar only if it improves hierarchy. On mobile replace the dense sidebar with a compact top bar plus a bottom navigation for the 4–5 most-used destinations. The first screen should show the selected business, publication/verification state, profile completeness, immediate next action, and genuinely available summary metrics—never dummy analytics.

Each dashboard card must answer one operational question: “What needs attention?”, “What is published?”, “What has changed?”, or “What can I do next?” Put incomplete business facts and verification requests ahead of decorative charts. Maintain strict business ownership isolation; switching businesses must never expose another owner’s data.

### 3.2 Add business choice — `/business/add/*`

**Prompt:**

> Create a deliberate decision page between “Import from Google” and “Create manually.” Use two balanced option cards with short factual explanations, a privacy/data note, and a visible back path. Make manual creation the dependable default path, and make Google import clearly state that Category, City, and About may be prefilled but remain editable. State that ratings, reviews, and photos are not imported. Avoid a modal-style decision that hides navigation.

### 3.3 Manual onboarding — `/business/add/manual`, `/business/onboarding`

**Prompt:**

> Build a 10-step, save-safe onboarding flow with a left stepper on desktop and a top progress indicator on mobile. Every step contains one short title, one sentence of guidance, clearly labeled fields, field-level validation, and Back/Save and continue actions. Use a persistent “Saved” status only when it is true. Group business identity, category, approved city/location, contact, hours, services, facilities/offers, media, AI content, SEO, preview, and submission. City picker must only search approved India Tier-1/Tier-2 cities. Keep all facts editable. Provide review sections before submission; do not hide warnings or verification requirements.

### 3.4 Google import review — `/business/add/import`

**Prompt:**

> Make Google import feel controlled and transparent. Use a two-stage flow: search/select an official Google business, then review editable fields before draft creation. Clearly label prefilled Category, City, and About with “From Google Business data” and show their editable controls inline. Present duplicate-check results in a visible neutral panel with a clear next action. Do not show or imply imported ratings, reviews, or photos. For unmatched city, show an honest “Choose a supported city” action rather than guessing a city.

### 3.5 Business tools — `/business/:businessId/:tool`

**Prompt:**

> Use a shared business-tools shell with an explicit back-to-workspace path, business identity header, contextual tabs, and a stable action area. Tools must include only the items currently supported: profile, photos, hours, services, leads/CRM, booking availability, appointments, verification, analytics, and website builder. Each tool uses a focused content panel—not a new dashboard inside a dashboard. Autosave must be visibly confirmed; destructive actions need confirmation and audit-friendly language.

### 3.6 Lead CRM and appointments

**Prompt:**

> Design CRM as an actionable pipeline. Desktop: split-view list and detail; mobile: list first, then focused detail sheet/page. Display real lead stage, source, owner/assignee, follow-up date, and timestamped notes. Put approve, reject, and propose time actions for appointments at the right moment with availability validation feedback. Use status color sparingly and consistently. Never create fake leads, artificial conversion rates, or fabricated meeting history.

### 3.7 Booking availability

**Prompt:**

> Present availability as clear operational configuration: weekly schedule, timezone, slot duration, notice period, booking window, blackouts, and preview. Make the current state obvious: appointments enabled/disabled, published/unpublished. Use date/time controls with readable time zones and clear conflicts. Explain that customer requests remain requests until owner decision when that is the system rule.

### 3.8 Website builder

**Prompt:**

> Redesign the website builder as a professional editing studio. Desktop has a left settings rail, a central responsive preview, and a right contextual inspector or clean drawer. Mobile uses a focused section editor and visible device selector. Keep Desktop, Tablet, and Mobile labels visible. Clearly distinguish design settings (theme, layout, typography, sections, CTA placement) from protected business facts. Preview updates should feel immediate; publishing needs a clear status and safe confirmation. Do not allow the builder to mutate core listing facts.

### 3.9 Owner analytics and profile/settings

**Prompt:**

> Use analytics only where data exists. Start with a date range and concise KPI row, then one or two readable charts and a factual activity table. If measurements are unavailable, state what will appear when activity is recorded. Profile/settings screens are form-first: account identity, notification preferences, and support. Keep sensitive or account-level actions isolated from normal business editing.

---

## 4. Administrator and super-administrator workspace

### 4.1 Admin workspace — `/admin/*`

**Prompt:**

> Create a governed operations console for administrators, visually distinct from the public marketplace but part of the same design system. Use a dense but calm desktop sidebar, a compact mobile navigation drawer, a page title with action controls, and data tables that are readable rather than overloaded. Dashboard priorities are review queue, verification decisions, business moderation, category/city governance, and operational status. Make role level visible without exposing credentials or irrelevant account data.

Tables must have clear headers, appropriate filters, real counts, pagination/empty states, and row-level actions with confirmation when decisions affect a public listing. Use a detail drawer or page for evidence review and decision history. Keep audit state factual and immutable in presentation.

### 4.2 Verification review queue — `/admin/verification`

**Prompt:**

> Design verification as a careful review workflow: queue, filters, evidence panel, business facts, reviewer decision controls, and immutable decision history. Promote “Verify” and “Request changes” as distinct, deliberate choices; include a required explanation where the system supports it. Never auto-approve from visual styling or show fabricated SLA times. Preserve owner privacy and ensure evidence downloads/opening are explicit actions.

### 4.3 Category and city governance — `/admin/categories` and related workspace panels

**Prompt:**

> Treat taxonomy and city management as controlled governance screens. Categories use a searchable table/list with activation state, icon metadata, and creation/edit controls restricted to the super-admin. City management must surface the approved India Tier-1/Tier-2 catalogue, city tier, state, active status, and coordinates as managed data. Do not offer arbitrary public city creation. For unsupported places, explain that city coverage is curated and use a safe request/feedback path if one exists.

### 4.4 Admin moderation, imported-data mapping, and settings

**Prompt:**

> Build settings and mapping screens as conservative configuration interfaces: explanatory copy, safe defaults, clear save state, and warnings before changing public behavior. Google category mapping should show source type, mapped Just Finds category, current activation state, and review controls. No fake import successes, no silent automatic publishing, and no hidden changes to owner data.

---

## 5. Responsive and component implementation prompt

**Prompt:**

> Implement the redesign through reusable primitives rather than page-specific CSS copies. Build or refine `PageFrame` for public pages, `WorkspaceShell` for owner/admin software pages, `BusinessCard` for real listing rows/cards, a unified `SearchBar`, `StatusBadge`, `EmptyState`, `SectionHeader`, `MetricCard`, `DataTable`, `MobileBottomNav`, and `StickyActionBar`. Reuse existing shadcn controls where suitable. Preserve the existing token layer in `index.css`; centralize new colors, radii, shadows, and motion variables.

| Breakpoint | Public discovery | Owner/admin workspace |
|---|---|---|
| 360–639px | Single column; bottom navigation; filters/settings as sheets; sticky primary action when needed | Compact top bar; focused content; mobile bottom nav for frequent owner tasks; admin uses drawer |
| 640–1023px | Two-column content when it improves scanning; persistent search context | Collapsible rail; cards become two-column only when legible |
| 1024px+ | Full search, filter rail, map/list space, two-column business detail | Persistent sidebar, functional tables, split CRM/detail views, builder studio |

### Definition of done

The redesign is complete only when every affected page has loading, empty, error, hover, focus, disabled, and mobile states; text contrast and keyboard navigation are checked; routes and role gates still work; no fabricated marketplace content has been introduced; existing Google-import restrictions still apply; approved-city search is preserved; and full regression tests plus responsive visual checks pass.

## 6. Recommended implementation order

1. Establish shared tokens, public `PageFrame`, owner/admin `WorkspaceShell`, search, cards, status badges, and mobile navigation.
2. Redesign public Home, Search, Category/City pages, Categories, and Business Detail.
3. Redesign manual onboarding and Google import review before owner dashboard/tools.
4. Redesign owner workspace, CRM, appointments, booking availability, and website builder.
5. Redesign administrator workspace, verification review, taxonomy/city governance, and mapping/settings.
6. Finish utility pages, all responsive states, accessibility pass, and regression validation.

> **Execution instruction:** Apply this specification incrementally. After each page family, test existing navigation and data flows, keep all verified behaviors intact, and do not publish a visual change that breaks user, owner, or administrator access.
