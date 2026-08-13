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
- [ ] Photos: upload (validated), delete, reorder, setCover/setLogo
- [x] Reviews: list/respond/report; Leads: list/detail/status/notes
- [x] Offers CRUD with auto-expire; AI content generate/save; SEO get/save
- [x] Certificate, QR, analytics (real searchInteractions only), notifications, settings
- [ ] Business switcher data isolation tests

## Frontend (/business/*)
- [ ] /business entry: Grow-your-business CTA or My Businesses cards
- [ ] Guided 10-step onboarding with progress, autosave, resume
- [ ] Find/claim existing business flow
- [ ] Dashboard overview: business switcher, status banner, completeness, real analytics
- [ ] Profile editor (category-aware dynamic fields), location picker with map
- [ ] Hours editor (multi-interval, copy actions, OPEN NOW preview) + special hours
- [ ] Services, Facilities, Items (menu/products/rooms), Photos managers
- [ ] Reviews respond/report, Leads inbox + detail, Offers manager
- [ ] AI Content studio, SEO settings, Certificate, QR code, Notifications, Settings
- [ ] Preview listing (desktop/mobile), public profile link, mobile dashboard polish

## Verification
- [ ] Vitest: ownership isolation, claim workflow, hours validation, offers expiry
- [ ] pnpm check + pnpm test green
- [ ] Screenshot key flows, checkpoint, deliver

- [ ] Preserve concurrent Phase 5 AI/content work while merging Phase 4 business-owner changes
- [ ] Resolve shared schema, migration metadata, router, and todo conflicts without overwriting either branch
- [ ] Re-run checks and tests after the combined merge
- [ ] Save a checkpoint containing the combined Phase 4 + Phase 5 project
