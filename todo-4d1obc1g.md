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
- [ ] Validate authenticated seeded owner-builder route and a successful published public website at both desktop/mobile widths; current database has no published Phase 7 page, so this requires a real published page/business ID rather than fabricated test data

- [x] Fix AI redesign Preview → Reject so prior design is restored and dirty state is accurate
- [x] Add focused AI redesign interaction coverage for preview/reject and safe design keys
- [x] Add owner submit-for-review flow and persist admin moderation notes/action history

- [x] Persist distinct approve/reject moderation action entries in page publish history
- [x] Add focused submit-for-review to moderation queue approve/reject contract coverage

- [x] Add a focused test that exercises submitForReview, moderationQueue, and approve/reject persistence with reviewer notes and distinct history actions

- [x] Add focused AI redesign safety assertions proving forbidden business-data keys are rejected or omitted
- [x] Extend moderation workflow coverage through the reject branch with durable reject history and reviewer metadata

- [ ] Select an existing owned business with verified source data for the real Phase 7 publish validation
- [ ] Create a real draft page from that business's existing facts and publish it through the owner workflow
- [ ] Validate the resulting public business URL and slug at desktop and mobile widths, then save the final checkpoint

- [x] Diagnose and fix the reported business-listing creation failure
- [x] Add regression coverage for successful listing creation and invalid-input handling
- [x] Revalidate owner isolation and claim/onboarding compatibility after the fix

- [ ] Obtain a genuinely real owned business ID and verified listing facts for public website publishing; do not publish test-only records

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
- [ ] Publish the verified business website from the authenticated owner workflow and capture its canonical public URL
- [ ] Validate owner-builder and published public website desktop/mobile layouts using the genuine business data

- [x] Diagnose and repair the reported blank page on the genuine business website or owner-builder route
- [x] Add regression coverage for the resolved blank-page path and revalidate it in the browser

- [ ] Diagnose the blank take-control authentication view and provide a safe owner-login recovery path

- [ ] Obtain explicit authorization before transferring or otherwise changing ownership of the genuine business for publication access

- [x] Diagnose and repair the reported “Business-owner access is required to create a listing” error for an authenticated first-listing user
- [x] Add regression coverage proving ordinary authenticated users can create a first private draft while foreign-business isolation remains enforced
