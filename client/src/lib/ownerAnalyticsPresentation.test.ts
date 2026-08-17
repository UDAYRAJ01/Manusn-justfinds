import { describe, expect, it } from "vitest";
import { analyticsEmptyMessage, analyticsSummary, readableAction } from "./ownerAnalyticsPresentation";

describe("owner analytics presentation", () => {
  it("summarises only supplied recorded interaction counts", () => {
    expect(analyticsSummary([{ action: "call", count: 2 }, { action: "inquiry", count: 1 }, { action: "impression", count: 9 }], 12, [{ day: "2026-08-17", count: 12 }])).toEqual({ totalInteractions: 12, enquiries: 1, contactActions: 2, activeDays: 1 });
  });

  it("keeps unavailable analytics factual and readable", () => {
    expect(analyticsEmptyMessage(30)).toContain("next 30 days");
    expect(readableAction("website_visit")).toBe("Website Visit");
  });
});
