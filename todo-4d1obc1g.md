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
- [ ] Guided 10-step onboarding with progress, autosave, resume
- [ ] Find/claim existing business flow
- [ ] Dashboard overview: business switcher, status banner, completeness, real analytics
- [ ] Profile editor (category-aware dynamic fields), location picker with map
- [ ] Hours editor (multi-interval, copy actions, OPEN NOW preview) + special hours
- [x] Services, Facilities, Items (menu/products/rooms), Photos managers
- [x] Reviews respond/report, Leads inbox + detail, Offers manager
- [ ] AI Content studio, SEO settings, Certificate, QR code, Notifications, Settings
- [ ] Preview listing (desktop/mobile), public profile link, mobile dashboard polish

## Verification
- [ ] Vitest: ownership isolation, claim workflow, hours validation, offers expiry
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
