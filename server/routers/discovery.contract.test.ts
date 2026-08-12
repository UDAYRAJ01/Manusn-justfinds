import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  getActiveCategories: vi.fn(async () => []),
  getPublicBusinessByRoute: vi.fn(async () => null),
  getPublicBusinesses: vi.fn(async () => []),
}));

import { discoveryRouter } from "./discovery";

describe("public discovery contract", () => {
  it("does not create public suggestions from sample business data when the database is empty", async () => {
    const caller = discoveryRouter.createCaller({} as never);
    const results = await caller.suggestions({ query: "Aarohan" });
    expect(results).toEqual([]);
    expect(results.length).toBeLessThanOrEqual(8);
  });

  it("returns an accurate empty search contract without public sample business data", async () => {
    const caller = discoveryRouter.createCaller({} as never);
    const results = await caller.search({ query: "wellness", limit: 10, offset: 0 });
    expect(results.total).toBe(0);
    expect(results.items).toEqual([]);
    expect(results.nextOffset).toBeNull();
  });
});
