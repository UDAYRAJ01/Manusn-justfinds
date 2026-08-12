import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  getActiveCategories: vi.fn(async () => []),
  getPublicBusinessByRoute: vi.fn(async () => null),
  getPublicBusinesses: vi.fn(async () => []),
}));

import { discoveryRouter } from "./discovery";

describe("public discovery contract", () => {
  it("returns a bounded suggestion collection without requiring a session", async () => {
    const caller = discoveryRouter.createCaller({} as never);
    const results = await caller.suggestions({ query: "Aarohan" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(8);
    expect(results.some(item => item.label.includes("Aarohan"))).toBe(true);
  });

  it("returns search items with ranking and pagination metadata", async () => {
    const caller = discoveryRouter.createCaller({} as never);
    const results = await caller.search({ query: "wellness", limit: 10, offset: 0 });
    expect(results.total).toBeGreaterThan(0);
    expect(results.items[0]).toMatchObject({ name: expect.any(String), rankScore: expect.any(Number), reviewSummary: "No Just Finds reviews yet" });
    expect(results.nextOffset).toBeNull();
  });
});
