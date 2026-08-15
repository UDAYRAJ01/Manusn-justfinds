# Just Finds Full UI/UX System Map

## Non-negotiable scope

This is a **presentation-layer redesign only**. It must preserve the current routes, managed authentication, tRPC contracts, Drizzle schema, Google Places boundaries, business workflows, ownership isolation, and role gates. No fake reviews, ratings, listings, jobs, analytics, or decorative inactive actions may be introduced.

## Shared system implementation map

| System area | Existing implementation anchor | Required design-system outcome |
| --- | --- | --- |
| Tokens | `client/src/index.css` | Centralize the Just Finds brand palette, type scale, 8px spacing, radius, border, shadows, semantic status colors, motion, focus, and mobile safe-area tokens. |
| Public shell | `PageFrame.tsx`, `JustFindsLogo.tsx` | One clean compact white header, location context, predictable nav, factual footer, and mobile dock. |
| Workspace shell | `WorkspaceShell.tsx`, `BusinessPlatform.tsx`, `OwnerWorkspace.tsx`, `AdminWorkspace.tsx` | Shared top/side navigation density rules, status panels, tables, forms, and action areas without touching role checks. |
| Listing patterns | `BusinessCard.tsx`, `SearchResults.tsx`, `BusinessDetail.tsx` | Reusable factual business cards, clean result hierarchy, one primary action, media fallback, real status signals, and detail CTA panel. |
| Form patterns | Existing shadcn controls and onboarding/import/tool pages | Consistent inputs, labels, error text, field groups, empty/loading/error states, and wizard progress. |
| Feedback | `ErrorBoundary.tsx`, existing loading/empty states, `Toaster` | Calm error/empty/skeleton patterns that do not expose technical errors. |

## Page-family audit checklist

| Route family | Current component(s) | Redesign intent | Functional safety boundary |
| --- | --- | --- | --- |
| Home and discovery | `Home.tsx`, `DiscoveryLanding.tsx` | Search-led public surface, category browsing, contextual sections, trust, business CTA. | Keep current search, category, city, listing, jobs, AI, and visibility logic. |
| Search/category/subcategory | `SearchResults.tsx`, `Categories.tsx`, `DiscoveryLanding.tsx` | Clear filter/result composition, category-specific discovery, mobile filter behavior. | Preserve all existing search params, filters, sort, pagination, routes, and no-data messaging. |
| Business profile | `BusinessDetail.tsx`, `PublicWebsite.tsx` | Premium factual profile, category-aware sections only when data exists, persistent decision actions. | Retain real availability, services, contact, leads, booking, reviews, and website rules. |
| Authentication | `AuthEntry.tsx` | Calm managed-entry page and clear role context. | Do not alter managed OAuth URLs, redirect, cookies, or account rules. |
| Consumer account | `Saved.tsx`, future authenticated account surfaces | Consumer-first saved/search/appointment/review/enquiry experience. | Never invent recommendations, recent searches, alerts, or appointments. |
| Owner overview and onboarding | `BusinessPlatform.tsx`, `OwnerWorkspace.tsx`, `GoogleImportSettings.tsx` | Simple business-management shell, clean onboarding wizard, progress, and import review. | Preserve onboarding state, draft creation, ownership, Places import, and submit approval gates. |
| Owner tools | `BusinessTools.tsx`, `WebsiteBuilder.tsx`, `DomainSettings.tsx` | Medium-density operations UI for leads, appointments, verification, website, and domains. | Do not change ownership checks, booking states, DNS constraints, or AI content guardrails. |
| Customer appointment | `CustomerAppointment.tsx` | Mobile-friendly state view with accessible appointment actions. | Preserve token gating, state machine, calendar-export behavior, and cancellation/reschedule semantics. |
| Admin operations | `AdminWorkspace.tsx`, `AiIntelligenceCenter.tsx`, `VerifyBusiness.tsx` | Restrained high-density queue/table/moderation interface. | Preserve role gates, review decisions, evidence privacy, moderation, mapping, and AI governance. |
| Jobs | `Jobs.tsx` | A visually distinct jobs browsing surface, not a business-card clone. | Keep current implemented routes and avoid claiming applications or jobs functionality that is not live. |
| Exceptions | `NotFound.tsx`, `ComponentShowcase.tsx` | Consistent error, empty, and developer-preview visual language. | Do not turn internal showcase into public navigation. |

## Required shared component standards

| Component | Standard |
| --- | --- |
| Buttons | Primary blue, secondary outline, quiet/ghost, danger; 10–12px radius, 44px touch target where practical, loading/disabled visible. |
| Inputs | Clear label, helper/error text, visible focus ring, 10–12px radius, text at least 15px on mobile. |
| Cards | White/neutral surface, one fine border, 14–18px radius, subtle shadow only when hierarchy requires it. |
| Badges | Semantic only: status, verification, availability, source; avoid decorative rainbow category colors. |
| Tabs and filters | Single selected-state treatment, keyboard accessible, wrap/scroll safely at small widths. |
| Tables | Search/filter/sort region above, compact row action menu, clearly responsive alternative at mobile. |
| Empty/error/loading | Small icon, clear explanation, real CTA when available; skeletons must match eventual component rhythm. |
| Images | Consistent object-cover crop, lazy loading, documented fallback when no real media exists. |

## Completion gate

The presentation rebuild is ready only after shared components are used consistently across all major public, owner, and admin page families; representative routes are tested at 320, 375, 390, 430, 768, 1024, 1280, and desktop widths; keyboard focus and error/empty/loading states are visible; no route/API/role-flow regression occurs; and the full test suite plus TypeScript checks pass.
