# Project TODO — Just Finds Phase 4 (Business Owner Platform)

## Schema & Data
- [x] Extend businesses (aboutDescription, socialLinks, seo overrides, rejectionReason, onboardingStep)
- [x] Extend business_services (price, priceType, duration, imageUrl, isEnabled)
- [x] Extend business_reviews (respondedAt) + review reports
- [x] Extend business_leads (notes)
- [x] Add business_claims table (claim workflow with statuses)
- [x] Add business_special_hours table (holiday/special hours)
- [x] Add business_items table (reusable menu/products/rooms model)
- [x] Add business_offers table
- [x] Add business_notifications table
- [x] Add business_revisions table (change tracking)
- [x] Add owner_notification_prefs table
- [x] Generate migration SQL and apply via webdev_execute_sql

## Server (owner-scoped, ownership enforced)
- [x] server/routers/business.ts: myBusinesses, businessDetail (with completeness), createDraft, updateProfile, submit/resubmit
- [x] Claims: searchDirectory, requestClaim, myClaims (+ admin reviewClaim)
- [x] Hours: setHours (multi-interval), special hours CRUD, openNow preview
- [x] Services CRUD + reorder/enable; Facilities set; Items CRUD
- [x] Photos: upload (validated), delete, reorder, setCover/setLogo
- [x] Reviews: list/respond/report; Leads: list/detail/status/notes
- [x] Offers CRUD with auto-expire; AI content generate/save; SEO get/save
- [x] Certificate, QR, analytics (real searchInteractions only), notifications, settings
- [x] Business switcher data isolation tests

## Frontend (/business/*)
- [x] /business entry: Grow-your-business CTA or My Businesses cards
- [x] Guided 10-step onboarding with progress, autosave, resume
- [x] Find/claim existing business flow
- [x] Dashboard overview: business switcher, status banner, completeness, real analytics
- [x] Render BusinessSwitcher in the active dashboard branch and make dashboard loading/error states recoverable
- [x] Fix the selected-business dashboard spinner observed during screenshot verification
- [x] Add a retry/recovery path for top-level myBusinesses errors
- [x] Capture fresh screenshots after the selected dashboard renders successfully
- [x] Verify the dashboard route after the switcher and loading-state fix
- [x] Profile editor (category-aware dynamic fields), location picker with map
- [x] Hours editor (multi-interval, copy actions, OPEN NOW preview) + special hours
- [x] Services, Facilities, Items (menu/products/rooms), Photos managers
- [x] Reviews respond/report, Leads inbox + detail, Offers manager
- [x] AI Content studio, SEO settings, Certificate, QR code, Notifications, Settings
- [x] Preview listing (desktop/mobile), public profile link, mobile dashboard polish

## Verification
- [x] Vitest: ownership isolation, claim workflow, hours validation, offers expiry
- [x] pnpm check + pnpm test green
- [x] Screenshot key flows, checkpoint, deliver

- [x] Preserve concurrent Phase 5 AI/content work while merging Phase 4 business-owner changes
- [x] Resolve shared schema, migration metadata, router, and todo conflicts while preserving both branches
- [x] Re-run checks and tests after the combined merge
- [x] Save a checkpoint containing the combined Phase 4 + Phase 5 project
- [x] Reconcile Drizzle migration metadata so both Phase 4 and Phase 5 migration histories are represented correctly
- [x] Verify the merged schema/database state matches both branches and validate the combined migration chain
- [x] Re-check shared-file merge outcomes after fixing migration metadata
- [x] Implement real storage-backed photo upload flow and test save/delete/reorder/cover/logo
- [x] Add router-level myBusinesses/businessDetail cross-owner isolation tests
- [x] Add behavior-level tests for storage upload, delete, reorder, cover, and logo photo flows
- [x] Add router-level myBusinesses ownership filtering test
- [x] Strengthen myBusinesses isolation with mixed-owner mock data and an assertion that ctx.user.id is present in the Drizzle owner filter
- [x] Replace the conditional canned myBusinesses mock with a faithful mixed-owner fake query that independently proves only ctx.user.id rows are returned
- [x] Assert the captured where condition is specifically built from eq(businesses.ownerId, ctx.user.id), not merely checking that 901 appears in serialized SQL
- [x] Register /business/:businessId/:tool routes so the implemented owner tool panels are reachable from the workspace
- [x] Expose facilities, items, and photos in BusinessTools navigation and dashboard links
- [x] Add frontend lead detail, status, and notes controls using existing owner-scoped procedures
- [x] Add photo reorder controls matching the server reorder mutation
- [x] Fresh checkpoint after final full-suite validation and expanded owner-flow screenshots
- [x] Replace onboarding steps 5–10 placeholder blocks with real hours, services, facilities, photos, preview, and submit content while preserving local resume state
- [x] Add claim evidence input, success/error feedback, duplicate/in-review handling, and visible My Claims status history
- [x] Load existing owner notification settings before editing and verify save feedback for advanced settings and owner panels
- [x] Persist onboarding hours, service, facilities, and photo values into real business records after draft creation
- [x] Add visible settings loading and save error states and verify advanced owner panels consistently handle loading, empty, and error states
- [x] Parse the entered onboarding hours text into the actual persisted intervals rather than hardcoding 09:00–17:00
- [x] Preserve local onboarding state and show recovery feedback when post-draft persistence mutations fail
- [x] Clarify onboarding photo input as URL-only unless storage-backed upload is added to that step

- [x] Add an interactive profile location picker that updates latitude and longitude from map interaction, with validation
- [x] Extend weekly hours UI to create, edit, and remove multiple daily intervals
- [x] Add explicit desktop/mobile owner preview states and verify mobile dashboard polish
- [x] Add focused Vitest coverage for claim workflow states, hours validation edge cases, and offer auto-expiry behavior


## Phase 7 — AI Business Website Builder
- [x] Add owner-scoped business_pages, page_sections (with inline config JSON), page_versions, page_publish_history, and page_analytics schema with migration
- [x] Add reusable category-aware section registry and default page configurations for restaurant, hospital, hotel, and doctor businesses
- [x] Add owner-scoped page-builder router for create, read, reorder, enable/disable, duplicate-own-design, save draft, publish/unpublish, version history, restore, and analytics, with explicit procedure contracts
- [x] Add explicit /business/:businessSlug/website route using the same isolated renderer as owner preview
- [x] Add responsive owner page-builder workspace with section library, live canvas, properties, desktop/tablet/mobile previews, controlled themes, and unsaved-change handling
- [x] Add business-data-safe AI redesign draft/preview/apply/reject flow that changes design configuration only
- [x] Add lead CTA rendering and page-attributed lead/CTA analytics without fabricating business facts, reviews, ratings, testimonials, or images
- [x] Add admin moderation/template foundation without permitting business-data mutation
- [x] Add Phase 7 section-registry, router-surface, design-safety, publishing-contract, and WebsiteBuilder interaction tests
- [x] Validate the authenticated genuine owner-builder route and the published public website at desktop and mobile widths using VISHNOI FACE HOSPITAL (business 120001)

- [x] Fix AI redesign Preview → Reject so prior design is restored and dirty state is accurate
- [x] Add focused AI redesign interaction coverage for preview/reject and safe design keys
- [x] Add owner submit-for-review flow and persist admin moderation notes/action history

- [x] Persist distinct approve/reject moderation action entries in page publish history
- [x] Add focused submit-for-review to moderation queue approve/reject contract coverage

- [x] Add a focused test that exercises submitForReview, moderationQueue, and approve/reject persistence with reviewer notes and distinct history actions

- [x] Add focused AI redesign safety assertions proving forbidden business-data keys are rejected or omitted
- [x] Extend moderation workflow coverage through the reject branch with durable reject history and reviewer metadata

- [x] Select an existing owned business with verified source data for the real Phase 7 publish validation
- [x] Create a real draft page from that business's existing facts and publish it through the owner workflow
- [x] Validate the resulting public business URL and slug at desktop and mobile widths

- [x] Diagnose and fix the reported business-listing creation failure
- [x] Add regression coverage for successful listing creation and invalid-input handling
- [x] Revalidate owner isolation and claim/onboarding compatibility after the fix

- [x] Obtain a genuinely real owned business ID and verified listing facts for public website publishing; do not publish test-only records

- [x] Auto-generate a valid slug from the business name in onboarding and first-listing creation
- [x] Preserve explicitly supplied valid slugs while normalizing invalid/manual slug input safely
- [x] Add duplicate-name/duplicate-slug handling and regression tests for slug generation

- [x] Add router-level regression coverage proving createDraft/createBusiness generate `-2` and later suffixes for occupied slugs
- [x] Handle slug-collision exhaustion explicitly and test the resulting clear error path

- [x] Normalize category slugs from category names, converting spaces/underscores to hyphens and lowercasing
- [x] Apply category slug normalization consistently in the supported category-create UI and server validation
- [x] Add focused category-create regression coverage for `dental_clinic` -> `dental-clinic` and invalid normalized slugs

- [x] Auto-generate city slugs from city names so `Kannur` becomes `kannur` and manual mismatches cannot persist
- [x] Preserve super-admin authorization for city creation and show a clear permission error to non-super-admin users
- [x] Add city slug and permission regression coverage

- [x] Inspect the current user-role model and identify the controlled super-admin promotion path
- [x] Provide a secure, auditable path for the project owner to obtain super-admin access without weakening category/city authorization
- [x] Add authorization regression coverage for the resulting super-admin access-management flow

- [x] Verify the exact account signed into the project admin workspace and promote that account to super_admin
- [x] Verify category and city management access after the promoted account signs out and back in
- [x] Preserve the configured project owner’s super_admin role during authentication sync

- [x] Confirm the authenticated admin-workspace identity after sign-in and verify its category/city create permissions

- [x] Create the requested `Hospital` category through the authenticated super-admin workspace and verify server-side persistence
- [x] Create the requested `Kanpur` city through the authenticated super-admin workspace and verify server-side persistence

- [x] Verify the user-created non-test business record, ownership, and factual source data before Phase 7 website publication
- [x] Publish the verified business website from the authenticated owner workflow and capture its canonical public URL
- [x] Validate owner-builder and published public website desktop/mobile layouts using the genuine business data

- [x] Diagnose and repair the reported blank page on the genuine business website or owner-builder route
- [x] Add regression coverage for the resolved blank-page path and revalidate it in the browser

- [x] Diagnose the blank take-control authentication view and provide a safe owner-login recovery path

- [x] Confirm that ownership transfer is not required because the authenticated direct owner session completed publication access

- [x] Diagnose and repair the reported “Business-owner access is required to create a listing” error for an authenticated first-listing user
- [x] Add regression coverage proving ordinary authenticated users can create a first private draft while foreign-business isolation remains enforced

- [x] Record the user’s verbal confirmation that the home-page managed Sign in journey completed and reached the regular-user workspace
- [x] Record the user’s verbal confirmation that administrator and user identities, roles, and business-management access remain separate
- [x] Add focused regression coverage for role-gated workspace access in addition to managed-login navigation visibility

- [x] Confirm the selected managed sign-in model on the published site and document the remaining real-user acceptance check

- [x] Record the user-confirmed successful managed sign-in and role-separated regular-user workspace access

- [x] Record the user’s verbal confirmation that a non-admin post-login session reached My listings; no separate identity screenshot was captured
- [x] Record the user’s verbal confirmation that a non-admin cannot enter `/admin`; no separate denied-state screenshot was captured

- [x] Directly verify the genuine hospital owner Website Builder in both desktop and mobile layouts
- [x] Switch the genuine hospital Website Builder into its mobile preview mode and capture the changed mobile preview state

- [x] Expose the active builder preview mode through accessible labels and selected-state semantics for direct validation

- [x] Render visible Desktop, Tablet, and Mobile labels on builder preview controls so the active mode is directly observable
- [x] Complete user-confirmed acceptance of non-admin OAuth, identity, My listings workspace, and `/admin` protected state; direct browser captures were not requested

- [x] Record the user’s verbal confirmation of non-admin OAuth completion and visible signed-in identity; no browser capture was retained
- [x] Record the user’s verbal confirmation of non-admin `/admin/categories` denial; no browser capture was retained
- [x] Confirm the genuine business owner session can open and publish the verified business website through the owner workflow

- [x] Diagnose and resolve the approved VISHNOI FACE HOSPITAL listing’s unpublished public website state

- [x] Repair the initial default website page flow so it can create a first saved design version before publication
- [x] Add regression coverage for saving and publishing a newly created website page without manual design changes

- [x] Repair the public website resolver so the published VISHNOI FACE HOSPITAL page is served at its slug URL
- [x] Add regression coverage for resolving a published business and page at the public slug route

- [x] Verify the deployed public hospital slug route after the resolver release, then validate its desktop and mobile rendering

## Final release validation
- [x] Confirm visible Desktop, Tablet, and Mobile preview labels in the propagated production owner builder bundle
- [x] Directly select Mobile in the production owner builder and confirm its active state and narrow responsive canvas
- [x] Prepare the final checkpoint after all validation notes and ledger entries are complete

## Marketplace conversion layer — verification, duplicate prevention, and CRM
- [x] Inspect current schemas, routers, owner tools, admin tools, and reusable components for compatible extension points
- [x] Add the verification-case and verification-document data model with evidence metadata, owner submission, and administrator decision history
- [x] Add duplicate-candidate detection using normalized business identity, contact details, and location signals without auto-merging records
- [x] Add owner-scoped lead CRM fields and actions for status, assignment, follow-up, notes, and source attribution
- [x] Build owner interfaces for duplicate review, verification evidence/status, and lead CRM management
- [x] Build administrator interfaces for verification review and clear approve/changes-requested decisions
- [x] Add focused tests for ownership isolation, review authorization, duplicate matching, and lead lifecycle transitions
- [x] Validate desktop/mobile critical paths and prepare the completed conversion release for publishing

## Appointment availability calendar and booking requests
- [x] Inspect existing hours, public website CTA, Lead CRM, and owner-tool extension points
- [x] Add appointment schedule, availability exception, and appointment-request data models with UTC-safe timestamps
- [x] Add owner-scoped calendar configuration, availability retrieval, request management, and schedule conflict safeguards
- [x] Add public appointment-request creation that produces a source-attributed Lead CRM record without auto-confirming an appointment
- [x] Build responsive owner calendar controls for weekly availability, slot duration, blackout dates, and booking-request review
- [x] Build public availability and appointment-request UI on published appointment-based business websites
- [x] Add regression tests for ownership isolation, slot conflict prevention, public-request validation, and CRM integration
- [x] Validate desktop/mobile booking paths and prepare the booking-calendar release for publishing

## Appointment decisions, customer self-service, and reusable skill
- [x] Inspect the appointment, Lead CRM, public website, routing, and notification extension points
- [x] Add appointment decision, proposed-time, cancellation, and secure customer-access fields with immutable event history
- [x] Add owner CRM actions to approve, reject, or propose a new appointment time while keeping lead status synchronized
- [x] Add secure customer appointment page for viewing, accepting a proposed time, requesting a reschedule, or cancelling a pending appointment
- [x] Add Google Calendar deep links and iCalendar downloads only for approved appointments
- [x] Create and validate a reusable appointment-workflow skill using the required skill-creation process
- [x] Add regression tests for ownership, token-gated customer access, calendar export, decision transitions, and CRM synchronization
- [x] Validate desktop/mobile owner controls and secure customer-link handling without creating fabricated bookings; automated contracts cover decision, token, calendar-export, and CRM paths

## Google-powered business discovery and editable import drafts
- [x] Inspect existing Google Import work, official Google Places API readiness, and current Add Business owner entry points
- [x] Add an external-place identity and import-draft model that preserves editable owner fields and supports duplicate detection without duplicate business entities
- [x] Implement secure server-side official Google Places autocomplete/text search and permitted place-detail retrieval with debouncing, quota, and failure handling
- [x] Map available imported facts into editable Just Finds draft fields, without importing Google ratings, reviews, or photos
- [x] Add category-mapping review and source-label metadata for imported fields
- [x] Build the simple Add Business choice screen and `/business/add/import` flow with search, location text, optional one-time location, and clear empty/error states
- [x] Integrate imported drafts with existing onboarding, owner editing, AI content, preview, submit, and administrator approval workflows
- [x] Add tests for authentication, server-secret isolation, external-ID duplicate detection, field mapping, and error handling
- [x] Validate the desktop/mobile import route and secure official API contract without creating fabricated listings; live credential validation and automated official-place tests pass

## Google category and About-field import prefill
- [x] Inspect the official Places detail fields and current category/description import mapping
- [x] Automatically map the official Google primary type into the matching Just Finds category when an approved mapping exists
- [x] Prefill the editable About field from an available factual Google business description, without replacing owner edits
- [x] Preserve clear source labels and an owner review/change option for both imported values
- [x] Add focused category, description, and fallback-mapping regression coverage
- [x] Validate responsive desktop/mobile import entry behavior and the editable review contract without creating fabricated listings; prepare the prefill enhancement for publishing

## Google Category, City, and About import prefill
- [x] Inspect official Google address components and the approved Just Finds city/category resolution rules
- [x] Resolve the selected Google business locality into an existing active Just Finds city without creating a new city automatically
- [x] Prefill editable Category, City, and About fields with clear Google source labels and preserve owner overrides
- [x] Add city-match and unmatched-city fallbacks with no manual-slug requirement
- [x] Add focused category, city, and About-field mapping regression coverage
- [x] Validate responsive owner import review behavior; capture desktop/mobile findings in google-city-prefill-validation.md; 174 tests across 60 files pass; prepare the expanded Google prefill release for publishing

## Full-site visual redesign
- [x] Audit current public, owner, administrator, and shared-layout visual inconsistencies at desktop and mobile breakpoints
- [x] Establish a premium responsive design system for typography, colors, spacing, cards, controls, and motion without changing application behavior
- [x] Redesign shared public navigation, search/discovery pages, listing/detail surfaces, and informational states
- [x] Redesign business-owner navigation, workspace, onboarding, business tools, website builder, and Google import review surfaces
- [x] Redesign administrator workspace, moderation, category/city, and verification tools while retaining role gates
- [x] Add or update targeted visual/component tests where shared markup changes require regression coverage
- [x] Verify representative public, owner, administrator, desktop, and mobile experiences; run full tests and TypeScript checks; 177 tests across 61 files pass; publish the redesign

## Marketplace-style app and software UI refinement
- [x] Define an original Just Finds visual direction informed by clean marketplace discovery and premium software dashboards, without copying third-party brands
- [x] Upgrade public home, search, category, and business-detail surfaces with marketplace browsing patterns and clearer conversion actions
- [x] Add app-like mobile navigation, compact discovery cards, sticky mobile actions, and touch-first responsive behavior
- [x] Refine owner dashboard, onboarding, and business tools into denser software-style operational surfaces
- [x] Refine admin dashboard and governance screens into clear, data-first administration software surfaces
- [x] Run targeted component coverage, TypeScript, full regression tests, desktop/mobile visual verification, and publish the refined interface; 179 tests across 61 files pass

## Reference-guided clean local-discovery UI rebuild
- [x] Convert the supplied home, search-results, category, listing-detail, and dashboard references into an original Just Finds UI specification without copying protected branding or fabricating data
- [x] Rebuild the public header, search hero, category browsing, local-result cards, and footer around a clean white-and-blue local-discovery layout
- [x] Rebuild search results, category browsing, and business-detail composition while preserving actual data availability and existing result/filter behavior
- [x] Refine authenticated user, owner, and administrator workspace presentation without changing authentication, role gates, routes, actions, or business logic
- [x] Validate desktop and mobile layouts, run targeted and full regression checks, and publish only the non-disruptive presentation update; 179 tests across 61 files pass and TypeScript is clean

## Product capability audit and implementation walkthrough
- [x] Inventory current Just Finds features, routes, data models, tests, and production readiness against the supplied platform vision
- [x] Identify missing, partial, deprecated, and high-risk capabilities without changing existing product behavior
- [x] Prepare a priority-ordered implementation walkthrough with dependencies, scope boundaries, and acceptance criteria
- [x] Deliver a concise audit report and recommend Milestone A: discovery reliability, open-now truthfulness, and transparent ranking v1 as the next safe implementation milestone

## Supplied full UI/UX design-system specification
- [x] Map the supplied design-system specification to current shared components and existing page families without changing product logic
- [x] Establish reusable tokens for color, typography, 8px spacing, restrained radius/shadows, form controls, badges, tabs, tables, feedback states, and desktop/mobile navigation
- [x] Apply the shared design system to public header, search experience, homepage, category/subcategory, results, listing cards, business detail, and footer patterns
- [x] Apply the shared design system to authenticated user, owner, and administrator workspaces while retaining all current role gates and operational workflows
- [x] Validate key desktop/mobile paths, keyboard/focus states, loading/empty/error states, TypeScript, and full regressions before publishing the presentation-only update; 180 tests across 62 files pass

## Manual business creation repair
- [x] Trace the Create manually action from the Add Business choice into the manual onboarding route
- [x] Repair the manual-listing navigation without changing the existing Google import or ownership workflows
- [x] Add focused regression coverage and validate the repaired manual entry path on desktop/mobile before publishing

## India Tier-1 and Tier-2 city discovery
- [x] Inspect current city records, search city selection, browser location resolution, and Google import locality mapping
- [x] Define an approved India-only Tier-1 and Tier-2 city catalogue and prevent unapproved/locality-only cities from being selected automatically
- [x] Update search and location-driven city suggestion/selection so only matching approved Indian cities are offered
- [x] Preserve owner-editable city review in manual/Google import flows while rejecting unsupported city creation through public selection paths
- [x] Add regression coverage, validate public/owner mobile and desktop flows, and publish the India-only city experience

## Latest locally runnable project backup
- [x] Inspect the latest checkpointed project contents and identify files/configuration required for local startup
- [x] Build a clean source backup archive with migrations and a local setup guide, excluding secrets and generated dependencies
- [x] Validate the archive contents and deliver the latest backup with database and secret-configuration notes

## Page-by-page modern UI/UX prompt
- [x] Audit the current Just Finds public discovery, user/owner, and administrator page families for the redesign prompt
- [x] Define a modern cross-product direction combining Google-style software clarity with Swiggy/Zomato-style discovery and conversion patterns
- [x] Write implementation-ready prompt blocks for every page family, desktop/mobile behavior, accessibility, states, and non-negotiable functional constraints
