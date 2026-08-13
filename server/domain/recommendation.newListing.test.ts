import { describe, it, expect } from "vitest";
import { calculateReputationScore } from "./recommendation";

describe("Just Finds Reputation Score 'New on Just Finds' state", () => {
  it("identifies brand new listings without reviews as new and labels them accordingly", () => {
    const freshResult = calculateReputationScore({
      averageRating: null,
      reviewCount: 0,
      isVerified: false,
      profileCompleteness: 50,
      freshnessDays: 2,
      legitimateInteractionCount: 0,
      createdAt: new Date(),
    });

    expect(freshResult.isNew).toBe(true);
    expect(freshResult.label).toBe("New on Just Finds");
  });

  it("labels established listings with normal score format", () => {
    const establishedResult = calculateReputationScore({
      averageRating: 4.8,
      reviewCount: 12,
      isVerified: true,
      profileCompleteness: 100,
      freshnessDays: 120,
      legitimateInteractionCount: 45,
      createdAt: new Date(Date.now() - 120 * 86_400_000),
    });

    expect(establishedResult.isNew).toBe(false);
    expect(establishedResult.label).toContain("/ 100");
  });
});
