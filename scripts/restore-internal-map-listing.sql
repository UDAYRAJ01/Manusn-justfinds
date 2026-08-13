-- Restores the clearly labelled internal map-validation record that was removed
-- during the administrator cleanup-gate validation. The record is test-only: it
-- carries no reviews, ratings, testimonials, or third-party business claims.
INSERT INTO businesses (
  ownerId, categoryId, cityId, name, slug, shortDescription, approvedDescription,
  address, latitude, longitude, status, isVerified, publishedAt
)
SELECT
  b.ownerId,
  b.categoryId,
  b.cityId,
  'Just Finds Internal Map Validation — TEST ONLY',
  'just-finds-internal-map-validation-test-only',
  'Internal test record for managed map validation only. This is not a real business and offers no public services.',
  'Internal test record for managed map validation only. This is not a real business and offers no public services.',
  'Test-only coordinate anchor — not a physical location.',
  '26.449923',
  '80.331874',
  'published',
  0,
  NOW()
FROM businesses b
WHERE b.slug = 'just-finds-internal-voice-validation-test-only'
  AND NOT EXISTS (
    SELECT 1 FROM businesses existing
    WHERE existing.slug = 'just-finds-internal-map-validation-test-only'
  );
