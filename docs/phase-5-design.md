# Just Finds Phase 5 — AI Intelligence Layer Design

This document records the Phase 5 requirements as supplied by the platform owner (`/home/ubuntu/upload/pasted_content_2.txt`) and the implementation contract used to satisfy them. Phases 1 through 4 remain in place; every Phase 5 change is additive.

## Non-negotiable constraints

The AI layer must never invent business facts. Generation may only use verified, owner-supplied, or administrator-approved business information. When AI credentials are absent, the system must state `AI provider is not configured.` and must not emit placeholder or fabricated output. Public pages must serve stored, approved content and must never call an AI provider during a page view. Every AI retrieval must be scoped by `business_id` inside the server query layer, never by frontend filtering alone.

## Required modules

The specification defines twelve modules: an AI business content engine, an AI SEO engine, an AI FAQ generator, an AI local SEO engine, a recommendation engine, the Just Finds Reputation Score, a business knowledge base, a business-specific chatbot foundation, AI content moderation and validation, an AI generation queue, AI content versioning, and an AI analytics foundation.

## Content types and versioning

Ten content types are stored separately and versioned individually: short description, about business, SEO title, meta description, FAQ, service description, category description, local landing content, business highlights, and CTA copy. Each version records `content_id`, `business_id`, `content_type`, `content`, `version`, `generated_at`, `generated_by`, provider/model when available, and `status` drawn from `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `PUBLISHED`, `REJECTED`. Regeneration always creates a new draft and never overwrites published content before approval. Previous versions can be restored.

## Validation pipeline

Raw output passes format validation, business-fact validation, duplicate detection, and safety checks before receiving a review status. Content is rejected or flagged `REVIEW_REQUIRED` for unsupported claims, fabricated facts, unrelated information, duplicate content, keyword stuffing, or inappropriate content. Banned superlatives include `best`, `No.1`, `guaranteed`, `certified`, `government approved`, and `highest success rate` unless explicitly provided and approved with evidence. Healthcare and other sensitive categories additionally block medical guarantees, treatment guarantees, success rates, diagnoses, prescriptions, and emergency instructions.

FAQ generation targets exactly ten grounded questions per eligible business, each recording question, answer, the source fields used, and status. Questions that cannot be grounded are omitted or flagged rather than answered speculatively.

## Queue and cost control

Generation is asynchronous with states `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`, `RETRYING`, `CANCELLED`, reporting real progress only. Bulk administrator generation enqueues background jobs for large selections rather than generating inside a single request. Usage tracking records `business_id`, generation type, provider-reported usage, estimated cost when available, and timestamp; the interface reports `Cost data unavailable from provider.` when the provider returns no cost. Failures set `FAILED`, preserve existing content, store a safe error category, and permit retry without exposing provider secrets.

## Recommendation engine

Distinct signals are stored and combined through administrator-configurable weights: relevance, distance, rating, review, profile completeness, verification, activity, availability, freshness, manual priority, and featured. Exact category matches outrank generic text matches. Distance uses real geographic distance without eliminating slightly farther businesses. Ratings use Just Finds native reviews only, normalized so a single review cannot dominate; external ratings are never imported. Activity uses legitimate interactions with basic anti-abuse protection. Manual priority stays transparent and separate from organic signals. User-facing explanations state reasons such as proximity, relevance, verification, or profile completeness without revealing internal weights.

## Reputation score

The Just Finds Reputation Score is a 0–100 value independent of any external rating, derived from profile completeness, verification, native rating, review quality and volume, response rate, information freshness, engagement, and activity. Scoring is normalized so no single interaction moves it sharply, and listings without history are labelled `New on Just Finds` rather than scored punitively. The public summary shows the score with completeness, verification, customer feedback, and activity indicators while withholding internal calculations.

## Knowledge base and chatbot

Each business has its own knowledge context sourced from its profile, services, facilities, hours, offers, FAQs, category data, owner-approved content, published AI content, and reviews where appropriate. Knowledge items record `business_id`, `source_type`, `source_id`, `content`, `status`, and `updated_at`. The chatbot answers only from approved knowledge for the current `business_id`, replies `I don't have that information for this business.` when data is absent, and never guesses, recommends another business, or invents prices, services, hours, or medical claims. Optional session storage records `business_id`, `session_id`, optional `user_id`, message, role, and timestamp, permits anonymous chat, and avoids unnecessary personal data. Lead capture occurs only after explicit user action and is attributed to the correct business. Unanswered questions are recorded so owners can supply the missing fact and refresh the knowledge base.

## SEO automation

The canonical business URL is `/business/[business-slug]`; category and city URLs serve discovery without creating duplicate canonicals. Metadata includes canonical, title, description, and Open Graph and Twitter/X data where appropriate. Structured data is limited to schema.org properties actually supported by business data, with no fabricated ratings, prices, hours, or reviews. Only published listings with sufficient data are indexable; draft, under-review, rejected, and suspended states are `noindex`. The sitemap architecture includes only published, indexable pages. Local pages are generated only where meaningful business or category data exists, avoiding doorway-page behaviour.

## Prompt architecture

Prompts are centralized and versionable rather than scattered across components, covering `about_business`, `short_description`, `seo_title`, `meta_description`, `faq_generation`, `service_description`, `local_seo`, and `chatbot`. Administrator settings support provider, key, model, and generation limits through secure server-side configuration; keys are never exposed to the frontend.

## Platform LLM contract

Generation uses the managed built-in LLM helpers rather than a hardcoded vendor SDK. The server helper `invokeLLM` from `server/_core/llm` accepts `messages` with roles `system`, `user`, `assistant`, and `tool`, an optional `model`, and `response_format` for JSON-schema structured output; `listLLMModels` returns the available catalogue so model identifiers are discovered at runtime instead of hardcoded. All calls stay server-side. Structured output is read from `choices[0].message.content`. This helper sits behind the Phase 5 provider abstraction so the provider can be replaced later without touching feature code.

## Required final tests

Two tests are called out as critical. First, isolation: a chatbot for Business A must not know Business B, and must state unavailability for information that does not exist. Second, freshness: after a service is removed from a business, regenerated knowledge and content must stop claiming that service.


## Implementation milestone — AI foundation and scoring

The first Phase 5 milestone is implemented additively on the existing MySQL and Manus OAuth stack. It includes the provider-independent `builtin-forge` structured-generation adapter, explicit unavailable-provider and invalid-response errors, centralized prompt templates at version 1, a scoped business facts assembler, ten enumerated content types, persistent generation jobs, versioned content records, usage events, and owner/admin lifecycle procedures.

The AI content lifecycle now follows `draft -> pending_review -> approved -> published`, with rejection and restoration back to a new draft. Published versions are never overwritten by regeneration or restoration. Generation output is stored as a new version and remains a draft until submitted by the owner. The current deterministic validation layer rejects empty output, unsupported numeric claims, banned superlatives, unsupported claim language, malformed FAQs, and invalid highlight counts. Similarity/deduplication, bulk generation, and progress reporting remain open follow-up items.

The recommendation foundation calculates separate relevance, distance, native rating, review depth, completeness, verification, activity, availability, freshness, manual-priority, and featured signals using administrator-seeded weights. The Just Finds Reputation Score is bounded to 0–100 and uses published native reviews only; it does not import external ratings, reviews, testimonials, or fabricated customer data. Public explanation and the no-history label remain follow-up items.

The milestone has deterministic automated coverage for factual prompt guardrails, business-scoped chat fallback instructions, content lifecycle transitions across all ten types, recommendation weighting, and reputation scoring. TypeScript validation passes.
