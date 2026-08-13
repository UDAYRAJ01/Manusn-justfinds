import { describe, expect, it } from "vitest";
import { calculateRecommendationScore, calculateReputationScore, type RecommendationSignals, type RecommendationWeights } from "./recommendation";

const signals: RecommendationSignals = {
  relevance: 100, distance: 50, rating: 80, review: 40, completeness: 90, verification: 100, activity: 60, availability: 100, freshness: 75, manual_priority: 0, featured: 0,
};
const weights: RecommendationWeights = {
  relevance: 50, distance: 50, rating: 0, review: 0, completeness: 0, verification: 0, activity: 0, availability: 0, freshness: 0, manual_priority: 0, featured: 0,
};

describe("Just Finds recommendation and reputation scoring", () => {
  it("normalizes weighted recommendation signals to a bounded score", () => {
    expect(calculateRecommendationScore(signals, weights)).toBe(75);
  });

  it("does not award an unsupported rating score when no published reviews exist", () => {
    const result = calculateReputationScore({ averageRating: null, reviewCount: 0, isVerified: true, profileCompleteness: 80, freshnessDays: 10, legitimateInteractionCount: 0 });
    expect(result.factors.ratingScore).toBe(0);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("uses only published review inputs and legitimate activity confidence", () => {
    const result = calculateReputationScore({ averageRating: 4.5, reviewCount: 3, isVerified: true, profileCompleteness: 100, freshnessDays: 20, legitimateInteractionCount: 4 });
    expect(result.factors.ratingScore).toBe(50);
    expect(result.factors.reviewDepthScore).toBe(9);
    expect(result.factors.activityConfidence).toBe(5);
    expect(result.score).toBe(99);
  });
});
