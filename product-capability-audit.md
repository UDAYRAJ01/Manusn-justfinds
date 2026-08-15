# Just Finds Product Capability Audit and Build Walkthrough

**Audit date:** 15 August 2026  
**Scope:** Current Just Finds production project, its route surface, schema, tRPC contracts, owner/admin screens, tests, and the supplied platform vision.  
**Method:** This assessment separates verified implementation from partial contracts, operating prerequisites, and features that still need a production build. It does not assume placeholder data is real capability.

## Executive assessment

Just Finds is no longer only a concept or a visual prototype. It already has a strong **local-business platform foundation**: managed OAuth, role gates, category/city taxonomy, listing ownership, approval workflow, Google Places import drafts, verification, lead CRM, appointment requests, a website builder, source-bound AI content, an AI business chatbot, and voice-introduction support.

The platform is **not yet a complete Google/Justdial-scale local search and jobs network**. The highest-value remaining work is not another visual pass. It is completing the operational loop: real bulk ingestion, reliable discovery/ranking, map/location experience, job marketplace workflows, domain provisioning, analytics, and production hardening. Several screens truthfully explain that their back-end dependency is not activated; those should be treated as partial capability, not finished capability.

> **Recommended principle:** do not start a fresh project. The existing project already contains valuable workflow and data-model work. Complete the missing operating layers incrementally, with clear acceptance criteria and migrations only where needed.

## Current capability matrix

| Product area | Status | What is verified in the current project | What remains before it is production-complete |
| --- | --- | --- | --- |
| Authentication and roles | **Implemented** | Managed Manus OAuth, protected procedures, and `user`, `business_owner`, `admin`, and `super_admin` role gates. Owner isolation and super-admin taxonomy access have regression coverage. | Add account operations policy, audit visibility for role changes, and administrator onboarding/offboarding procedure. |
| Business listing lifecycle | **Implemented** | Private owner drafts, guided onboarding, category-specific fields, review/approve/reject states, publication gating, canonical slugs, and public detail routes. | Add clearer resubmission notes, SLA/reminder policy, and lifecycle reporting. |
| Category, city, locality, and dynamic fields | **Implemented** | Database-backed category/city records, subcategories, dynamic fields, canonical slug creation, and super-admin governance. | Build mass taxonomy management, import/export, ordering, archival, and mapping approval tools. |
| Public local search | **Partial** | Search accepts query, city, locality, category, subcategory, verified, coordinates, nearby/recommended/rating sort intent, pagination, and interaction logging. | Improve query interpretation, typo/alias handling, open-now calculation, evidence-aware filters, SEO index pages, and ranking quality. Current public cards intentionally show no ratings until Just Finds reviews exist. |
| GPS/nearby discovery | **Partial** | Latitude/longitude are supported in search, listing onboarding, Google import, and distance-aware result contracts. | Add browser location consent UX, geographic radius selectors, precision/privacy policy, spatial indexing, fallback locality matching, and a real map/list experience. |
| Google Business Profile/Places import | **Implemented with operating limits** | Server-side field-masked Google Places discovery; owner-editable import drafts; duplicate checks; category, city, About, address, geometry, and hours prefill. Google ratings, reviews, and photos are excluded. | Add import audit log, mapping-management UI, quota/error monitoring, and bulk/retry policy. Never import prohibited Google review/rating/photo content. |
| Duplicate prevention and verification | **Implemented** | Identity/contact/location duplicate scoring; owner evidence upload; private verification cases; immutable review history; admin review queue. | Add verification SLA, evidence-retention policy, fraud/abuse operations, and ranking signal consumption. |
| Lead CRM and conversion | **Implemented** | Public leads, lead status, assignee, follow-up, notes, source/page/date, owner isolation, call/WhatsApp/booking pathways, and no fabricated lead records. | Add quote/callback form surfaces, lead notifications, export, automated reminders, pipeline reporting, and configurable consent/retention policy. |
| Appointment booking | **Implemented** | Owner availability, blackouts, minimum notice, conflict checks, request/approve/reject/propose workflow, customer token page, audit events, Google Calendar URL, and iCalendar export. | Add notification delivery, cancellation windows, staff/resource calendars, timezone display QA, reminders, and payment/deposit support only if required. |
| Reviews and ratings | **Partial** | Authenticated Just Finds review submission/report contracts exist, and Google reviews/ratings are deliberately excluded. | Build verified reviewer qualification, moderation queue actions, anti-abuse/rate limits, owner response flow, aggregate calculations, and policy disclosure before using ratings as a ranking signal. |
| Business website builder | **Implemented** | Owner website builder, drafts/versions, design-only AI redesign guardrail, approved publication flow, and public business-slug website route. | Add template library governance, version rollback UI, form block analytics, accessibility audit, custom theme constraints, and SEO metadata QA. |
| AI SEO and content | **Implemented with governance** | AI content workspace and administrator AI governance; generation is designed not to mutate factual business data. | Add editor approval/version workflow, source citation panel, content-calendar operations, SEO quality checks, and performance measurement. |
| Business-specific AI chatbot | **Implemented with governance** | Public business chat contract is tied to a specific business; knowledge sources, unanswered questions, analytics, owner refresh, admin-only history, and consented lead capture are present. | Confirm the public widget is exposed on every intended website/profile, add human-handoff workflow, rate limits, monitoring, prompt-injection tests, and clear unavailable-information responses. |
| AI voice introduction | **Implemented with dependency** | Owner tool generates voice only from an approved description and records the safe failure state. | Add pronunciation editor, consent/copyright policy, review queue if needed, per-business usage limits, and recovery/observability for TTS provider failures. |
| Jobs portal | **Partial** | Job records and owner/admin navigation are present; moderation-oriented job workflow language exists. | Implement real job creation/editing, salary/location/category data, public jobs search, job detail/application flow, employer inbox, approval, applicant privacy, and notifications. Do not claim a public jobs marketplace is operational until these paths are live. |
| Bulk Excel/CSV import | **Blocked / not implemented** | Admin screen safely stages a file name and explicitly states that a storage-backed parser and managed worker are required. | Build S3 upload, CSV/XLSX parser, schema mapping, row-level validation, dedupe preview, job queue, retries, results download, role-safe error visibility, and publish gate. |
| Ranking and recommendations | **Partial** | Search sort modes and interaction logging exist; category/location/verification inputs are available. | Define transparent ranking formula, weights, recency, quality/completeness signals, distance normalization, fraud controls, experiment logs, and user-facing explanation. Do not market as AI recommendations until evaluated. |
| Maps and directions | **Partial** | Coordinates and directions-oriented actions exist; Google Places integration is server-side. | Add a compliant map provider implementation, marker clustering, consent-aware geolocation, directions fallback, provider cost controls, and accessibility alternative. |
| Analytics | **Partial** | Search and interaction events are logged; some owner/admin summary measures exist. | Build privacy-aware funnel reporting: searches, impressions, profile views, calls, WhatsApp, leads, bookings, ranking position, and source/time segmentation. Use real events only. |
| Custom domains | **Blocked / not implemented** | Owner settings accurately says DNS verification/provider connection is required. | Build domain request, DNS challenge, verification worker, certificate issuance, mapping, failure/retry UI, and support policy. |
| Admin operations | **Implemented with partial modules** | Category schemas, approvals, verification, imports, moderation, internal-test-listing cleanup, ranking controls, and AI governance are routed and role-gated. | Finish import worker, review moderation queue, ranking controls, operations audit log, dashboard queues, and admin reporting. |
| Mobile experience and design | **Implemented** | Public, owner, and administrator areas have been visually refreshed and tested at mobile and desktop viewports. | Continue route-by-route keyboard/accessibility, performance, empty/error-state, and real-device QA. UI quality should follow completed functionality, not replace it. |
| Security, privacy, and operations | **Partial** | Server-side secrets, role gates, ownership checks, protected routes, safe external import boundaries, evidence storage, and tests are present. | Add rate limiting, abuse prevention, content-security policy review, audit-log retention, backups/restore drill, error monitoring, alerting, SLOs, GDPR/Indian privacy terms, load testing, and incident playbooks. |

## Important reality checks

| Item | Current truth | Decision |
| --- | --- | --- |
| Google data | Official Places import supports selected factual profile fields only. | Keep the no-ratings/no-reviews/no-photos boundary. |
| Reviews | Do not show invented review summaries or ratings. | Build a Just Finds-only review system before displaying review aggregates. |
| Jobs | Navigation and data footing exist, but the full candidate/employer marketplace is not complete. | Treat Jobs as a dedicated next-phase feature, not a small UI task. |
| Bulk import | Current screen is a safe contract, not an ingestion engine. | Build only with background worker, staging, dedupe, and publication gates. |
| Maps | Coordinates are not a full map product. | Add provider/compliance/cost architecture before positioning Maps as complete. |
| AI recommendations | Intent/ranking routes exist, but a measured recommender is not proven. | Start deterministic and explainable; add AI only after data and evaluation exist. |
| Custom domains | Settings UI is preparatory. | Build DNS/certificate lifecycle before selling/announcing it. |

## Recommended implementation walkthrough

### Milestone A — Discovery reliability and local-search quality

**Goal:** Make existing business discovery dependable before expanding feature breadth.

| Step | Deliverable | Acceptance criteria |
| --- | --- | --- |
| A1 | Search quality contract | Search handles category aliases, basic typos, city/locality intent, and empty state without fabricated suggestions. |
| A2 | Open-now and availability signals | Only shows open/closed after hours/timezone calculation is verified; unknown remains unknown. |
| A3 | Transparent ranking v1 | Deterministic score from publication state, verification, completion, distance, recency, and factual availability; logs ranking inputs. |
| A4 | Nearby user journey | Permission request, manual city fallback, radius chip, local privacy copy, and list/map fallback. |
| A5 | Discovery analytics v1 | Real event funnel for search → impression → detail → call/lead/booking. |

**Dependencies:** Existing business coordinates, hours, publication state, interaction events.  
**Do not include:** A black-box AI recommender or fake rating signal.

### Milestone B — Real bulk onboarding and data operations

**Goal:** Let administrators safely load legitimate business records at scale.

| Step | Deliverable | Acceptance criteria |
| --- | --- | --- |
| B1 | Secure file upload and parse queue | XLSX/CSV stays in S3; parser does not run in the browser; every job has owner, status, and expiration. |
| B2 | Mapping and validation preview | Admin maps columns to supported fields; row errors are downloadable; category/city matching is explicit. |
| B3 | Dedupe and review gate | Potential duplicates are scored and routed to review; no row auto-publishes by default. |
| B4 | Import execution and recovery | Progress, per-row results, retryable failures, audit log, and safe rerun behavior. |

**Dependencies:** Storage, background job/heartbeat design, migration for import-job/row result records.  
**First decision required:** expected file size, record ownership, and whether importer may create new taxonomy values.

### Milestone C — Jobs marketplace

**Goal:** Make Jobs a real, safe public marketplace rather than a menu item.

| Step | Deliverable | Acceptance criteria |
| --- | --- | --- |
| C1 | Employer job creation | Owner creates draft with title, business, role type, location, compensation range, description, deadline, and application method. |
| C2 | Admin approval and publication | Job cannot appear publicly until reviewed; review actions are auditable. |
| C3 | Public jobs discovery | Search/filter by title, city, employment type, category, date, and salary only when values exist. |
| C4 | Applications and employer inbox | Candidate consent, CV/file storage, status tracking, owner isolation, withdrawal, and retention controls. |
| C5 | Job analytics and alerts | Real views/applications; no fabricated jobs or alert counts. |

**Dependencies:** File storage, privacy policy, notification design, moderation and anti-scam rules.

### Milestone D — Conversion operations and owner value

**Goal:** Convert traffic into accountable, usable business outcomes.

| Step | Deliverable | Acceptance criteria |
| --- | --- | --- |
| D1 | Quote and callback workflows | Public form blocks create CRM leads with explicit consent, source/page/time, owner assignment, and status. |
| D2 | Notifications | Owner notifications for new lead, booking decision, verification request, and job application; opt-out/retry states included. |
| D3 | Owner analytics v1 | Real search impressions, profile views, CTA clicks, leads, conversion rate, and appointments by time/source. |
| D4 | CRM quality controls | Duplicate leads, follow-up reminders, export, and retention policy. |

**Dependencies:** Notification integration, event data, owner data permissions.

### Milestone E — Trust, reviews, and verification maturity

**Goal:** Create a trust layer owned by Just Finds.

| Step | Deliverable | Acceptance criteria |
| --- | --- | --- |
| E1 | Verified reviewer eligibility | Review submission only after a defined real interaction/eligibility rule. |
| E2 | Moderation workflow | Queue, report reasons, decision history, owner response, and appeal policy. |
| E3 | Aggregate display | Ratings/review counts are calculated from approved Just Finds reviews only. |
| E4 | Search integration | Verification and moderated quality signals influence explainable ranking. |

**Dependencies:** policy, abuse controls, rate limits, moderator capacity.

### Milestone F — Advanced AI, voice, domains, and scale

**Goal:** Expand automation only after reliable data and operations exist.

| Step | Deliverable | Acceptance criteria |
| --- | --- | --- |
| F1 | Business chatbot launch checklist | Grounded knowledge tests, unavailable-answer behavior, rate limits, monitoring, human escalation, and consented lead capture. |
| F2 | AI recommendation evaluation | Offline evaluation set, deterministic fallback, explanation, feedback controls, and no undisclosed personalization. |
| F3 | Voice operations | Consent, script preview, pronunciation edits, quota, safe retry, and provider monitoring. |
| F4 | Custom-domain lifecycle | DNS verification, certificate status, domain mapping, rollback, support path, and billing decision. |
| F5 | Production hardening | Performance budget, SLOs, monitoring, backups/restore drill, penetration/security review, and load testing. |

## Priority order for the next 90 days

| Priority | Milestone | Why now |
| --- | --- | --- |
| 1 | A — Discovery reliability | Public search is the platform’s acquisition engine; better design cannot compensate for weak relevance or local context. |
| 2 | D — Conversion operations | Existing leads and appointments can become immediate owner value with notifications, quote/callback, and factual analytics. |
| 3 | B — Bulk onboarding | Scale the real directory only after quality gates and ownership rules are ready. |
| 4 | E — Trust/reviews | Reviews and verification can improve confidence/ranking only with moderation and anti-abuse controls. |
| 5 | C — Jobs marketplace | High product value but requires its own privacy, application, and moderation operation. |
| 6 | F — Advanced platform | AI recommendations, domains, and enterprise operations should follow dependable data and mature workflows. |

## Admin UI walkthrough to prepare next

The current admin UI is structurally sound and role-gated. The next usability improvement should be a **queue-first Admin Command Centre**, not another static dashboard.

1. **Today queue:** submitted listings, verification reviews, report moderation, import failures, job approvals, and unanswered business-chat questions—each with real count and an empty state.
2. **Review workspace:** one listing/job per view with factual data, evidence, duplicate score, decision notes, save/return/publish actions, and immutable history.
3. **Taxonomy studio:** searchable category/subcategory/locality browser, dynamic-field editor, mapping approval, archive safeguards, and import/export.
4. **Import operations:** recent job list, row-error drilldown, retry permission, and audit trail after the real worker is built.
5. **Quality/ranking centre:** show explainable signal configuration and change history; never imply rankings are AI-driven if they are deterministic.
6. **Governance:** AI content/chat exceptions, review reports, verification exceptions, operator notes, and exportable audit log.

## Definition of done for any future feature

Every feature should satisfy all of the following before being marked complete:

- Database schema, migration, role/ownership rules, and server contract are defined first.
- It has a real user journey, loading/empty/error states, desktop and mobile validation, and no mock customer data.
- It has focused Vitest coverage plus full-suite/TypeScript validation.
- It emits only privacy-appropriate analytics and has retention/consent behavior where personal data is collected.
- Admin action, owner action, and public action boundaries are explicit.
- It can be monitored, recovered, and rolled back without changing or exposing other owners’ data.

## Immediate recommendation

Start with **Milestone A1–A3: Search quality, open-now truthfulness, and transparent ranking v1**. This uses the existing category/city/business/coordinates/verification/completeness foundation, improves every public screen, and creates the dependable measurement base needed for conversion, imports, reviews, AI recommendations, and Jobs.
