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
