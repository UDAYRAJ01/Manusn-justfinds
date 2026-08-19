# Automated Import AI Validation

## Authenticated workspace check

**Route checked:** `/admin/imports` on the authenticated development workspace.

The bulk-import administration screen loaded successfully after the automatic Gemini drafting update. Existing historical imports retained their factual statuses, including cancelled, staged, and failed rows; no legacy record was represented as AI-generated. The interface continues to state that newly imported listings are **submitted/private**, and the automatic-draft progress presentation explicitly states that drafts remain private until administrator approval.

## Scope of the release

New successfully-created imports receive an `import-seo-{importId}` rewrite batch. The worker uses Gemini Flash first and only retries with Gemini Pro when the factual/format validation rejects the Flash draft. The generation worker saves review-required drafts only; it does not publish a listing or fabricate reviews, ratings, or testimonials.
