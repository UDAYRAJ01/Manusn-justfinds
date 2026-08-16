# Project TODO

- [x] Establish the Just Finds design tokens, typography, navigation, responsive mobile shell, and accessible UI states.
- [x] Model roles, categories, field schemas, businesses, approval workflow, reviews, leads, jobs, applications, ranking, import queues, and AI content in the database.
- [x] Implement a server-side nearby-search service with pagination, distance ranking, and structured search suggestions.
- [x] Create the public home, search results, category, and business detail routes with business-scoped actions and GPS-aware discovery.
- [x] Add map/directions, business-specific AI chat guardrails, reputation-score explanation, business certificate preview, and voice-introduction interfaces.
- [x] Build a business-owner workspace for profiles, dynamic fields, reviews, leads, AI content, landing-page controls, custom-domain configuration, and analytics.
- [x] Build an admin workspace for category schemas, approval queues, ranking, review moderation, job moderation, analytics, and bulk Excel/CSV validation workflow.
- [x] Implement a jobs portal with search, filters, candidate application flow, employer job posting flow, and review status.
- [x] Add integration-safe interfaces for AI generation, AI redesign, speech generation, map providers, custom domains, and compliant listing import rather than claiming unavailable services work.
- [x] Add realistic seed records that never fabricate customer reviews, ratings, testimonials, or third-party business data.
- [x] Write and run Vitest coverage for search ranking, permission boundaries, business data isolation, bulk-import statuses, and public API behavior.
- [x] Connect the managed Google Maps and ElevenLabs providers for live map tiles and voice audio synthesis; custom-domain DNS verification and managed import workers are deferred because Cloudflare activation was declined.
- [x] Replace the business-detail map preview with the managed Google Maps component, preserving a graceful fallback and native directions link.
- [x] Verify the managed Google Maps component loads on a live business-detail route without requesting a user API key, using the user-authorized clearly labelled internal map-validation record rather than a third-party business.
- [x] Resolve provider choices and approved credentials for managed maps and ElevenLabs voice synthesis; Cloudflare DNS and worker account access remain intentionally unselected because activation was declined.
- [x] Enable the approved ElevenLabs connector for business voice-introduction generation.
- [x] Record the user-deferred decision not to wire available Cloudflare capabilities into custom-domain DNS verification or managed import-worker infrastructure.
- [x] Implement the approved ElevenLabs workflow: generate a factual business-scoped MP3 from approved data, store it securely, and expose playback only when public profile data includes the stored URL.
- [x] Validate voice generation end to end with an authenticated owner and a user-authorized clearly labelled internal test profile, then confirm the refreshed stored audio appears on the published profile; no third-party business data was fabricated.
- [x] Deferred by user: do not implement custom-domain DNS verification or managed-import processing until Cloudflare is explicitly enabled.
- [x] Deferred by user: Cloudflare authorization is required before enabling DNS verification, Cloudflare Worker import processing, or related worker bindings.
- [x] Verify desktop and mobile presentation, inspect application logs, and save a release checkpoint.
- [x] Compare the complete new Phase 1 specification with the current Just Finds implementation and document conflicts, including its no-demo-data constraint.
- [x] Reconcile the requested route inventory and protected-route architecture with the current public, owner, and admin navigation.
- [x] Assess the requested PostgreSQL/Supabase and email-password authentication requirements against the managed MySQL and Manus OAuth foundation, then obtain an approved migration decision before any destructive change.
- [x] Replace any non-compliant mock, demo-only, or fabricated data behavior with clearly sourced data flows or explicit empty states while preserving the prohibition on fabricated reviews, ratings, and testimonials.
- [x] Audit the Phase 1 database model for the specified normalized entities, role hierarchy, category-field engine, and backend-enforced authorization boundaries.
- [x] Validate the Phase 1 mobile breakpoints, accessibility states, public metadata, and protected-route behavior after the approved reconciliation work.
- [x] Implement the agreed Phase 1 foundation on the current managed MySQL and Manus OAuth stack, keeping the Supabase/email-password requirement documented as a future infrastructure migration rather than silently substituting it.
- [x] Verify and document accessibility coverage for the reconciled Phase 1 routes, including keyboard navigation, visible focus states, loading/error/empty states, and protected-route denial states.
- [x] Validate the public metadata/head output for the reconciled routes, including title, description, canonical URL, and Open Graph basics where applicable.
- [x] Verify keyboard accessibility on the public, auth, owner, and administrator Phase 1 routes, including visible focus, native control order, and loading, denial, and empty states; record concrete evidence.
- [x] Add automated validation for route-specific title, description, canonical URL, Open Graph title, description, and URL metadata, and execute it in the regular test suite.
- [x] Verify keyboard traversal, visible focus, skip links, and representative loading, empty, and denial states on public, auth, owner, and administrator routes; record the route-level results.
- [x] Mount and test emitted document-head metadata for public, auth, owner, and admin route classes, including title, description, canonical, Open Graph title, description, and URL.
- [x] Investigate and resolve the stale protected-workspace runtime import error for `getPendingBusinesses` before final route validation.
- [x] Prevent unauthenticated protected-route renders from issuing workspace API queries and logging expected access-denial errors.
- [x] Re-verify keyboard traversal and visible focus on representative public, auth, owner, and admin routes; document concrete results for skip links, loading, empty, and denial states.
- [x] Revalidate unauthenticated owner and admin routes after query gating, then confirm from fresh logs that protected workspace procedures do not fire and expected login errors are not emitted.
- [x] Ensure the skip link becomes visibly exposed for programmatic and keyboard focus states across browsers, then revalidate its rendered focus position.
- [x] Re-test representative public, auth, owner, and admin routes with per-route evidence for keyboard order, visible focus, skip links, and loading, empty, or denial states.
- [x] Create a fresh timestamp boundary for browser and network logs, then re-open unauthenticated owner and admin routes to verify no protected workspace request or expected-login error is emitted.
- [x] Confirm the skip link is visibly on-screen for browser keyboard and programmatic focus, or correct its styling and capture the final rendered position.
- [x] Capture direct browser evidence of keyboard focus and a representative loading, empty, or denial state for public, auth, owner, and admin route classes.
- [x] Programmatically focus the live browser skip link, then record its active element, computed top, and rendered bounding position to verify it is on-screen.
- [x] Capture explicit keyboard-focused-element evidence plus a representative empty, loading, or denial state for each public, auth, owner, and admin route class.
- [x] Call the live skip link’s `focus()` method, wait for its transition to settle, and record active-element, computed-position, and bounding-rect evidence without manually setting a focus attribute.
- [x] Clarify and document the route-class validation criterion for the static managed-auth page, which has no asynchronous loading, empty, or access-denial state by design; capture any intended loading evidence separately.
- [x] Remove the business-detail coordinate fallback so the managed map never presents an unrelated location when a profile has no verified coordinates.
- [x] Upgrade public discovery to deterministic intent parsing with category, subcategory, city, locality, and GPS-aware filters; use server-side sorting and bounded ten-at-a-time pagination rather than materializing candidate listings in the client.
- [x] Persist non-sensitive current-session location context, support database-backed city and locality selection, and provide honest recent-search behavior for authenticated and anonymous users.
- [x] Replace the decorative search-results map preview with the managed Maps component, real coordinate-backed markers, and accessible list/map synchronization; retain an explicit unavailable state when records lack coordinates.
- [x] Expose database-backed category, subcategory, city, and locality discovery routes that preserve search state in URLs without hardcoding location pages.
- [x] Record search and listing interactions through the existing telemetry foundation, including search context, result count, and privacy-safe session context; add automated coverage for the search contracts.
- [x] Complete bidirectional search-results map/list synchronization so list selection highlights its map marker and selected-marker state updates after initial map load; add focused validation coverage.
- [x] Add interaction-level automated validation that exercises both list-originated and map-originated selection against the shared search-result selection state.
- [x] Reconcile the deployed businesses table with the approved voice-generation workflow by adding the missing voice-audio URL metadata column through a reviewed additive migration, then validate the persistence contract.
- [x] Verify and preserve an explicit additive migration artifact for the voice-audio URL column so local migration history documents the deployed reconciliation.
- [x] Add and run a focused contract test that proves voice-introduction persistence writes and returns the stored voice-audio URL without requiring live provider synthesis.
- [x] Reconcile the managed Drizzle migration ledger with the already-applied local migrations and verify the standard migrator no longer replays baseline schema creation.
- [x] Create two clearly labelled Just Finds internal validation listings, owned by the authorized account, with stored coordinates and approved descriptions but no reviews, ratings, testimonials, customer claims, or real-business impersonation.
- [x] Grant the authorized test account the business-owner role required to access its internal validation listings and run the owner voice-introduction workflow.
- [x] Use the internal validation listings to confirm the managed business-detail map and owner-to-public ElevenLabs voice-audio workflow, then preserve clear test-only status and removal guidance.
- [x] Validate the internal voice listing through the authenticated owner workspace UI: select the listing, trigger generation, observe the owner success and audio state, and reconfirm the stored audio remains public on the published profile.
- [x] Capture explicit post-generation owner and public audio-element evidence, then verify the persisted voice URL and timestamp were refreshed by the authenticated owner-interface request.
- [x] Capture explicit managed-map rendering evidence on the dedicated internal map-validation profile and confirm it required no user API-key prompt or user-supplied credential.
- [x] Add accessible loading, success, retry, and actionable failure states to the owner’s ElevenLabs voice-introduction generation workflow.
- [x] Add focused test coverage for owner-facing ElevenLabs failure-message mapping and retry guidance.
- [x] Add a guarded administrator interface to identify, review, and permanently delete only clearly labelled internal test listings, with explicit confirmation and no impact on real listings.
- [x] Add focused server-side safety coverage proving that internal-listing cleanup never permits a real listing or a loosely named record.
- [x] Add a mobile-first guided owner onboarding flow for business basics, coordinate verification, approval-ready descriptions, and final submission to the existing moderation workflow.
- [x] Add focused validation coverage for the guided onboarding coordinate and approval-ready-description acceptance rules.
- [x] Capture live browser interaction evidence for the confirmation-protected internal-listing cleanup flow; the gate was verified across empty, wrong-case, and exact confirmation states, and one internal test-only record was removed during the check (recorded in the validation document).
- [x] Capture live browser interaction evidence for the guided onboarding draft creation and moderation-submission flow without fabricating listing claims.
- [x] Add a focused router contract test for protected internal-listing cleanup, including administrator enforcement, exact confirmation, and refusal to delete non-internal records.
- [x] Add DOM interaction validation for the typed cleanup confirmation gate without deleting the retained validation records.
- [x] Add DOM interaction validation for the guided owner onboarding form through draft creation and moderation submission without fabricating claims.
- [x] Diagnose the reported "invalid OAuth state" error during administrator sign-in: it is the expected one-time login-nonce CSRF guard rejecting a stale or superseded login, resolved by starting and completing a fresh sign-in in the same tab.
- [x] Recreate a clearly labelled internal map-validation listing so retained internal map coverage is restored after the accidental removal.
- [x] Harden the administrator cleanup dialog so enabling the destructive control cannot shift the cancel control's position, keeping cancellation predictable.
- [x] Repeat the administrator cleanup-gate validation non-destructively, proving the empty, wrong-case, and exact confirmation states and a successful cancellation with no record deleted.

## Phase 5 — AI content engine, recommendations, reputation, and business knowledge

- [x] Add Phase 5 schema: ai_content_versions, ai_generation_jobs, ai_usage_events, business_knowledge_items, chat_sessions, chat_messages, unanswered_questions, business_reputation_scores, recommendation_signal_weights.
- [x] Build a provider-independent AI service abstraction that reports "AI provider is not configured." instead of returning fabricated output when credentials are absent.
- [x] Create centralized, versioned prompt templates for about_business, short_description, seo_title, meta_description, faq_generation, service_description, local_seo, and chatbot.
- [x] Build a business-context assembler that passes only fields that actually exist for a business and never infers unsupported facts.
- [x] Generate the ten AI content types as separately stored, individually versioned items with DRAFT, PENDING_REVIEW, APPROVED, PUBLISHED, and REJECTED states.
- [x] Implement the AI validation pipeline: format checks, business-fact grounding, duplicate/similarity detection, banned superlative and unsupported-claim detection, and REVIEW_REQUIRED flagging.
- [x] Implement and test persisted FAQ generation that stores exactly ten grounded FAQs with question, answer, sourceFieldsUsed, and status, while omitting ungrounded entries.
- [x] Implement the asynchronous AI generation queue with QUEUED, PROCESSING, COMPLETED, FAILED, RETRYING, and CANCELLED states and real progress reporting.
- [x] Implement admin bulk AI generation that enqueues background jobs for large business selections instead of generating inside one request.
- [x] Track AI usage per generation and surface today/month/failed/pending counts, stating "Cost data unavailable from provider." when the provider returns no cost.
- [x] Implement content regeneration that always creates a new draft version and never overwrites published content before approval, plus version restore.
- [x] Implement the full AI content lifecycle with explicit DRAFT creation, PENDING_REVIEW submission, APPROVED moderation, PUBLISHED release, and REJECTED return transitions.
- [x] Add tests covering AI content state transitions across DRAFT → PENDING_REVIEW → APPROVED/PUBLISHED and REJECTED paths for every supported content type.
- [x] Implement the recommendation engine with separate relevance, distance, rating, review, completeness, verification, activity, availability, freshness, manual-priority, and featured signals combined through admin-configurable weights.
- [x] Implement normalized Just Finds native rating scoring that prevents a single review from dominating and never imports external ratings.
- [x] Implement recommendation explanations that state user-facing reasons without revealing internal weights.
- [x] Add and surface the 'New on Just Finds' Reputation Score state for low/no-history listings, with tests.
- [x] Build the per-business knowledge base with business_id-scoped retrieval enforced in the database query layer, never only in the frontend.
- [x] Build the business-scoped chatbot that answers only from approved knowledge and replies "I don't have that information for this business." otherwise, with no cross-business access and no invented facts.
- [x] Record unanswered chatbot questions and surface them to owners so answering them updates the knowledge base.
- [x] Implement consent-gated chatbot lead capture attributed to business_id and add contract/UI tests.
- [x] Serve approved AI content versions from storage on public pages and add caching/invalidation coverage.
- [x] Implement SEO indexing control so only published, sufficiently complete listings are indexable, with canonical, Open Graph, and robots metadata.
- [x] Implement schema.org structured data limited to properties actually supported by business data, with no fabricated ratings, prices, hours, or reviews.
- [x] Implement dynamic sitemap architecture that includes only published, indexable pages.
- [x] Build owner and admin AI workspaces with generation controls, previews (search preview, page preview, FAQ accordion, knowledge preview), moderation actions, and real analytics.
- [x] Document and test category-aware AI context for restaurant/hotel/doctor/hospital schemas.
- [x] Apply heightened safety rules for medical and other sensitive categories, blocking guarantees, success rates, diagnoses, and prescriptions.
- [x] Expand automated coverage for queue transitions, stale-content cleanup after regeneration, and full Phase 1–4 regression flows.
- [x] Verify no Phase 1–4 regressions across login, search, GPS nearby, categories, imports, approvals, dashboards, reviews, and leads.

## Phase 6 — Premium public business detail

- [x] Repair the duplicated-export corruption in client/src/lib/businessHours.ts, then re-run TypeScript and regression tests before continuing Phase 6.
- [x] Extend the published-only business detail projection with truthful images, hours, services, facilities, offers, reviews, certificates, verification, reputation, and approved AI content.
- [x] Build the premium mobile-first business detail shell with clear hero, trust, contact, hours, services, facilities, offers, FAQs, map, voice, reviews, chatbot, and lead sections.
- [x] Implement timezone-aware open/closed status with special-hour overrides and overnight intervals.
- [x] Add mobile sticky actions, copy/directions/share/save/report controls, and event tracking through existing server procedures.
- [x] Add full-size image gallery/lightbox and missing-image fallback without fabricated imagery.
- [x] Add authenticated review submission and owner review-response flows with pending, published, reported, and removed states.
- [x] Add certificate verification route and truthful verified-badge rendering.
- [x] Add business-scoped chatbot, consent-gated lead capture, unanswered-question feedback, and cross-business isolation tests.
- [x] Add profile SEO metadata, JSON-LD, canonical/indexability rules, and published-only sitemap/robots validation.
- [x] Add empty/error/loading states, responsive screenshots, accessibility checks, and Phase 1–5 regression coverage.
- [x] Save a Phase 6 checkpoint without starting Phase 7.

- [x] Wire authenticated save, review submission, and review reporting controls into the premium public business profile.
- [x] Add a public certificate verification route that validates the business certificate procedure and preserves the no-fabrication trust boundary.
- [x] Add first-party conversion tracking for call, WhatsApp, website, directions, save, enquiry, and share actions with truthful unavailable states.
- [x] Harden gallery fallback/media rendering and add focused regression coverage for public profile interactions.
- [x] Run full Vitest and TypeScript validation, then capture desktop and mobile profile evidence before the Phase 6 checkpoint.
- [x] Enforce explicit consent on public lead capture in both the profile form and server procedure.

- [x] Connect `/owner` overview and `/business` management workspace with direct workspace links and synchronized business selection.
- [x] Add clear back navigation and breadcrumbs between the portfolio dashboard and detailed `/business/:businessId/:tool` tools.
- [x] Pass real business names to workspace tool headers for clear context.
- [x] Run full regression test suite to ensure all 157+ automated tests pass cleanly.
- [x] Unify `/owner/profile` and `/business` around one canonical owner listing-management entry point.
- [x] Remove conflicting duplicate listing-management presentation while preserving guided onboarding and detailed business tools.
- [x] Add synchronized navigation and selected-business continuity between the canonical owner listing view and detailed workspace.
- [x] Add regression tests for the unified listing flow and owner-scoped route transitions.
- [x] Revalidate the live owner/profile and business entry points after implementation.

## Current Owner Listing Flow Fix

The user reports that `/owner/profile` and `/business` still expose separate business-listing options with no meaningful connection. The target is one canonical listing-management flow: portfolio overview selects a business, detailed tools edit that selected business, and all create/manage actions return to the same owner-scoped context.

## GMB-Style Progressive Listing Workflow

- [x] Remove the duplicate guided listing onboarding presentation and keep one canonical business listing entry point.
- [x] Change new-listing flow so owners submit only the essential basic information first, then continue completing the profile after submission.
- [x] Add a truthful profile-completion percentage with clear completed and missing sections.
- [x] Add progressive completion actions for profile facts, hours, services/items, photos, and other supported business tools without bypassing approval rules.
- [x] Add regression tests for completion calculations, initial submission, and owner-scoped progressive editing.
- [x] Validate the streamlined listing flow visually and with the full test suite.

## GMB-Style Progressive Listing Skill & Dashboard Upgrades
- [x] Initialize and publish the `progressive-listing-workflow` skill using `/skill-creator`.
- [x] Add prioritized 'Next best action' recommendation to the business completion dashboard.
- [x] Implement section autosave with visible 'last saved' timestamps.
- [x] Add owner dashboard reminders for profile completion and review status.
- [x] Run test suite, verify compilation, and save a release checkpoint.

## AI-Assisted Website Builder
- [x] Inspect existing website builder builder routes, storage schema, and AI content generation endpoints.
- [x] Implement AI auto-generation procedure that compiles approved business facts (name, category, city, short description, hours, services, photos) into a structured multi-section website draft.
- [x] Add editable section controls in the website builder workspace so owners can edit headline, subtitle, hero image, services list, testimonials/features, and CTA buttons.
- [x] Add AI section regeneration tooltips/buttons that let owners regenerate individual sections using approved business knowledge while respecting factual boundaries.
- [x] Write Vitest coverage for AI website generation, section persistence, and owner permissions; run TypeScript validation and deliver the release.

## AI Website Builder Enhancements

- [x] Package the grounded AI website builder process as a reusable skill via skill-creator.
- [x] Verify and polish the responsive desktop/tablet/mobile preview before publishing.
- [x] Add an AI image suggestion feature that recommends relevant photos for generated sections from owner-uploaded listing media.
- [x] Allow prompt-driven regeneration of individual sections with custom owner instructions and clear retry states.
- [x] Validate all changes with the full test suite and TypeScript, then save a checkpoint.

## Nearby Search, Location Data, and Category Taxonomy
- [x] Diagnose why nearby/GPS search returns no or incorrect results and fix the geolocation-to-query pipeline.
- [x] Compute and display each business's distance from the user's current position in search results, nearby results, and the business detail page.
- [x] Seed a comprehensive Indian city dataset (states, major cities, districts) with coordinates for city-scoped search.
- [x] Seed localities per city and auto-detect the user's locality from GPS coordinates (reverse geocoding with graceful fallback).
- [x] Implement the 3-level taxonomy (main category → subcategory → business type) in the schema and seed the 12-category master list from the user's file.
- [x] Build the browse flow: main category page → subcategory page → business-type listing page → business detail page, with SEO-friendly slugs.
- [x] Validate with the full test suite and TypeScript, then save a checkpoint.

## Attached Platform Brief Review
- [x] Review the attached brief, summarize its proposals, and map actionable requirements against the current Just Finds implementation without changing product behavior.

## Category Result Isolation Fix
- [x] Ensure category, subcategory, and business-type browse pages pass taxonomy filters correctly and return only businesses assigned to the selected taxonomy level.
- [x] Add regression coverage for category, subcategory, and business-type result isolation; validate TypeScript and the full test suite before publishing.

## Administrator Excel Bulk Upload
- [x] Support the supplied Excel columns: Business Name, Main Category, Subcategory, Description (About), Address, City, Locality, State, Country, Latitude, Longitude, Phone, Email, Website, Hours, Rating, Total Reviews, and FAQs.
- [x] Add taxonomy-aware matching, row-level validation, duplicate safeguards, import preview, and truthful handling for unsupported ratings, reviews, and FAQs fields.
- [x] Add automated coverage for the new Excel mapping and administrator import flow; validate TypeScript and the full test suite before publishing.

## Administrator Bulk-Import Access Repair
- [x] Diagnose and correct the reported failure to open the deployed administrator bulk-import route while preserving administrator-only access control.

## High-Volume Bulk Import
- [x] Choose and implement a reliable 100,000-listing import architecture with durable file staging, asynchronous processing, progress visibility, retry controls, and administrator-only security.
- [x] Implement the selected always-on high-volume importer with a 100,000-listing limit, chunked processing, and recovery controls.
- [x] Increase the staged upload limit from 100 MB to 500 MB and validate the administrator-facing guardrail and background-processing compatibility.

## Large-File Staging Reliability Repair
- [x] Diagnose and correct the failed network request when the administrator stages a large import file in secure storage.

## Stalled High-Volume Import Repair
- [x] Diagnose and correct the staged import lifecycle so uploaded files can transition into queued validation and completed processing.

## Persistent Pending-Import Recovery
- [x] Diagnose the remaining live scheduled-import failure and recover staged or queued jobs without losing uploaded source files; classify historical uploads that never reached secure storage as requiring re-upload.

## Secure-Storage Import Read Repair
- [x] Trace and repair the high-volume processor's secure-storage read failure by blocking legacy imports whose spreadsheet was never confirmed in storage, and clearly require a new secure upload instead of an invalid retry.
- [x] Verify a newly confirmed spreadsheet progresses through background validation after the release using the successful 250 MB CSV run.

## Secure-Staging Upload Failure
- [x] Diagnose and repair the production large-file secure-staging endpoint failure with authenticated, exact-size 5 MB storage chunks that avoid the gateway request-size limit.
- [x] Apply the additive chunk-metadata migration required by the repaired staging protocol.
- [x] Validate the repaired production upload with the user's spreadsheet through automatic background validation.

## Confirmed-Chunk Background Read Repair
- [x] Diagnose and repair the `fetch failed` error while the confirmed multipart source is read by the scheduled validation processor, using a bounded three-worker storage-read pool with retry handling.
- [x] Retry the confirmed 250 MB import through the durable CSV path and verify background validation advances without storage-read failures.

## Server-Side Confirmed Import Recovery
- [x] Diagnose why the administrator retry did not start the confirmed import; safely retire the oversized XLS jobs because they exceed the 512 MB worker memory budget, and route recovery to the streamed CSV workflow.
- [x] Add bounded per-chunk storage-read timeouts so a stalled signed download cannot keep the import in processing indefinitely.

## Spreadsheet Value Normalization
- [x] Diagnose the confirmed import’s category, subcategory, city, hours, and FAQ validation failures and safely accept unambiguous source formats.
- [x] Add auditable fallbacks for locality-style city labels and uniquely matched business-type labels without guessing ambiguous classifications.

## Low-Memory Large Import Path
- [x] Implement streamed CSV validation for large imports and present truthful XLS/XLSX size guidance for the managed worker memory limit.
- [x] Validate a large CSV through secure staging, low-memory streamed validation, and the first verified background private-listing creation chunk.
- [x] Suppress retry controls for workbook jobs that are terminal due to the managed format-size limit.

## Private Listing Creation Recovery
- [x] Diagnose the stalled private-listing creation claim and bound each worker run to 25 businesses with parallel independent audit writes.
- [x] Release the bounded creator and verify that the validated CSV import advances past its first private-listing chunk.

## Background-Resumable CSV Validation
- [x] Move confirmed large-CSV validation into the scheduled processor with bounded streaming reads so progress survives browser closure.
- [x] Apply the additive parser checkpoint migration for resumable CSV validation.
- [x] Resume the active confirmed CSV import through the background processor and verify progress without an open browser.

## CSV-First Production Import Contract
- [x] Finalize self-service CSV-first recovery guidance, including an in-product downloadable header template, Excel export steps, and immediate workbook-size feedback.

## Import Template Deliverable
- [x] Create a CSV-first bulk-import template with all supported fields, formatting guidance, services support, ratings/review audit fields, business hours, FAQs, and one example row.
- [x] Import a semicolon-separated Services column into private business services, without converting supplied ratings or review totals into public customer reviews.

## Grounded AI About Business Rewrites
- [x] Add an administrator-authorized AI action for every submitted/imported listing that creates an About Business draft from factual fields only.
- [x] Keep generated descriptions as private reviewable drafts, with transparent errors and no automatic public publication.

## Reusable AI Rewrite Skill and Bulk Review
- [x] Create and validate a reusable grounded-AI business-content rewrite skill.
- [x] Add bulk selection and bounded batch About draft generation for submitted listings.
- [x] Add original-versus-AI-draft comparison before approval.
- [x] Add a one-click publish action for approved AI About drafts.

## Bulk AI Review Button Repair
- [x] Diagnose and repair the administrator bulk AI About action button reported as not executing.
- [x] Add regression coverage for the repaired selection-to-batch-generation button flow.

## Detailed Approval Review and Grounded AI SEO
- [x] Show each submitted/imported business in a clear field-by-field approval review, including all provided import fields and private audit-only ratings/review totals.
- [x] Show supplied services and FAQs separately, with explicit missing-data states and no invented business facts.
- [x] Add an administrator AI SEO draft action that generates grounded About, SEO metadata, and up to ten fact-supported FAQs for review.
- [x] Preserve unverified service ideas as private suggestions only; do not add or publish invented services or claims.
- [x] Add comparison, approval, and publication controls for each generated content type.
- [x] Add regression coverage and complete TypeScript, full-test, and visual validation before release.

## Single Human-First AI SEO Profile
- [x] Replace the four separate AI SEO review drafts with one combined, administrator-reviewable best-profile draft.
- [x] Generate a factual, human-first About section with search-intent-aware headings, SEO title, and meta description without keyword stuffing or unsupported claims.
- [x] Generate between five and ten source-grounded FAQs in the same combined review profile.
- [x] Provide one clear comparison, approval, and publication action that applies the approved combined profile to the private listing.
- [x] Add regression coverage and validate TypeScript, complete automated tests, and the revised administrator interface before release.

## Reliable High-Volume AI Rewrite Workflow
- [x] Diagnose and repair inconsistent administrator AI rewrite button execution and clear completion/error feedback.
- [x] Show all submitted/imported businesses as a searchable list with a click-to-open factual detail panel.
- [x] Display generated AI content in the listing detail panel without requiring original-versus-draft comparison; retain original values privately for controlled reversal.
- [x] Add a permission-checked Revert to original action that restores the immediately previous factual listing content without changing customer feedback data.
- [x] Add factual 5–10 FAQ generation and private, explicitly unverified service/facility suggestions; publish only administrator-approved facts.
- [x] Implement bounded, resumable background batch processing for large selections with per-listing queued, processing, AI done, failed, and retry states.
- [x] Preserve real ratings and reviews exactly as supplied/audited; do not fabricate, vary, or publish synthetic customer reviews or ratings.
- [x] Add regression coverage and validate type safety, the full automated suite, and the administrator UI before release.

## Production AI Generation Repair
- [x] Diagnose why requested administrator AI rewrites remain unwritten or undisplayed in production.
- [x] Repair the queue, scheduled worker, provider, or UI result path and give administrators actionable per-listing recovery feedback.
- [x] Validate end-to-end generation for a factual listing without creating fabricated customer data, then run regression coverage and publish the repair.

## Server-Side AI Provider Verification
- [x] Inspect the configured server-side AI provider and confirm that rewrite jobs use a real API without exposing a key in the browser.
- [x] Validate a factual, structured business-profile generation request through the live provider path.
- [x] Repair the provider integration or configure a required secure credential, then run regression tests and publish the verified connection.
