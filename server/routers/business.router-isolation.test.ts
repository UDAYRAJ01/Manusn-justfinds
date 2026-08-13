import { describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { businessRouter } from "./business";

const state = vi.hoisted(() => ({ filterSql: "", filterParams: [] as unknown[] }));

vi.mock("../db", () => ({
  getDb: vi.fn(async () => {
    const mixedRows = [
      { business: { id: 44, ownerId: 900 }, category: "Other", city: "Other City" },
      { business: { id: 45, ownerId: 901 }, category: "Local", city: "Test City" },
    ];
    const query = {
      leftJoin: () => query,
      where: (condition: unknown) => {
        const compiled = new MySqlDialect().sqlToQuery(condition as never);
        state.filterSql = compiled.sql;
        state.filterParams = compiled.params;
        const ownerId = compiled.params.find(value => value === 901);
        return {
          limit: async () => [{ id: 44, ownerId: 900, status: "draft", onboardingStep: 1, name: "Other business", categoryId: 1, cityId: 1 }],
          orderBy: async () => mixedRows.filter(row => ownerId === undefined || row.business.ownerId === ownerId),
        };
      },
    };
    return { select: () => ({ from: () => query }) };
  }),
}));

describe("business router ownership isolation", () => {
  it("returns only the current owner's switcher rows", async () => {
    const caller = businessRouter.createCaller({
      user: { id: 901, openId: "owner", name: "Owner", email: null, loginMethod: "test", role: "business_owner", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: {} as never,
      res: {} as never,
    });
    const rows = await caller.myBusinesses();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.business.ownerId).toBe(901);
    expect(state.filterSql).toMatch(/ownerId/);
    expect(state.filterParams).toContain(901);
  });

  it("rejects a direct businessDetail request from a different owner", async () => {
    const caller = businessRouter.createCaller({
      user: { id: 901, openId: "other", name: "Other", email: null, loginMethod: "test", role: "business_owner", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: {} as never,
      res: {} as never,
    });

    await expect(caller.businessDetail({ businessId: 44 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
