import { describe, expect, it } from "vitest";
import { calculateRecommendationScore, haversineDistanceKm, isBusinessOpenNow } from "./ranking";

describe("Just Finds ranking model", () => {
  it("prioritizes a nearby, complete, verified, open business", () => {
    const nearby = calculateRecommendationScore({ relevance: 90, distanceKm: 1, reviewCount: 0, profileCompleteness: 95, verified: true, activity: 80, openNow: true, interactionAffinity: 30 });
    const distant = calculateRecommendationScore({ relevance: 90, distanceKm: 30, reviewCount: 0, profileCompleteness: 60, verified: false, activity: 30, openNow: false, interactionAffinity: 0 });
    expect(nearby).toBeGreaterThan(distant);
  });

  it("calculates realistic distances from coordinates", () => {
    const distance = haversineDistanceKm(26.4767, 80.3188, 26.4598, 80.3319);
    expect(distance).toBeGreaterThan(1);
    expect(distance).toBeLessThan(5);
  });

  it("handles overnight opening hours", () => {
    const hours = [{ dayOfWeek: 1, opensAt: "20:00", closesAt: "02:00", isClosed: false, isTwentyFourHours: false }];
    expect(isBusinessOpenNow(hours, new Date(2026, 7, 10, 22, 0))).toBe(true);
  });
});
