import { describe, expect, it, vi } from "vitest";
import { businesses, businessPages, pagePublishHistory, pageVersions } from "../../drizzle/schema";
import { websiteRouter } from "./website";

const state = vi.hoisted(() => ({
  business: { id: 7, ownerId: 42, slug: "trusted-business", name: "Trusted business" },
  page: { id: 11, businessId: 7, slug: "trusted-business-website", status: "draft", publishedAt: null },
  version: { id: 21, pageId: 11, businessId: 7, versionNumber: 1, designConfig: {}, status: "draft", createdById: 42 },
  history: [] as Array<Record<string, unknown>>,
  updates: [] as Array<Record<string, unknown>>,
}));

vi.mock("../db", () => ({
  getDb: vi.fn(async () => ({
    select: (selection?: unknown) => ({
      from: (table: unknown) => {
        if (table === businesses) return { where: () => ({ limit: async () => [state.business] }) };
        if (table === businessPages) return { where: () => ({ limit: async () => [state.page] }), innerJoin: () => ({ where: async () => [{ page: state.page, business: state.business }] }) };
        if (table === pageVersions) return { where: () => ({ orderBy: async () => [state.version] }) };
        if (table === pagePublishHistory) return { where: () => ({ orderBy: () => ({ limit: async () => state.history.filter(row => row.action === "submit_review") }) }) };
        return {
          innerJoin: () => ({ where: async () => [{ page: state.page, business: state.business }] }),
          where: async () => [],
        };
      },
    }),
    insert: () => ({ values: async (values: Record<string, unknown>) => { state.history.push({ id: state.history.length + 1, ...values }); return [{ insertId: state.history.length }]; } }),
    update: () => ({ set: (values: Record<string, unknown>) => ({ where: async () => { state.updates.push(values); if (values.status) state.page.status = values.status as string; } }) }),
  })),
}));

const caller = (id: number, role: "business_owner" | "admin") => websiteRouter.createCaller({
  user: { id, openId: String(id), name: role, email: null, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as never,
  res: {} as never,
});

describe("website review workflow", () => {
  it("submits a saved page, exposes it to moderation, and persists an approval action", async () => {
    state.history.length = 0;
    state.updates.length = 0;
    const owner = caller(42, "business_owner");
    const admin = caller(1, "admin");

    const submitted = await owner.submitForReview({ businessId: 7, note: "Ready for review" });
    expect(submitted.status).toBe("pending_review");
    expect(state.history).toEqual(expect.arrayContaining([expect.objectContaining({ action: "submit_review", reviewNote: "Ready for review", performedById: 42 })]));

    const queue = await admin.moderationQueue();
    expect(queue[0].page.businessId).toBe(7);

    const result = await admin.moderate({ businessId: 7, decision: "approve", note: "Facts verified" });
    expect(result.reviewedById).toBe(1);
    expect(state.page.status).toBe("published");
    expect(state.history).toEqual(expect.arrayContaining([expect.objectContaining({ action: "approve", reviewNote: "Facts verified", reviewedById: 1 })]));
  });

  it("persists a distinct rejection action with reviewer metadata", async () => {
    state.history.length = 0;
    state.updates.length = 0;
    state.page.status = "draft";
    const owner = caller(42, "business_owner");
    const admin = caller(1, "admin");
    await owner.submitForReview({ businessId: 7, note: "Please check opening hours" });
    const result = await admin.moderate({ businessId: 7, decision: "reject", note: "Needs an updated hours section" });
    expect(result.reviewedById).toBe(1);
    expect(state.page.status).toBe("draft");
    expect(state.history).toEqual(expect.arrayContaining([expect.objectContaining({ action: "reject", reviewNote: "Needs an updated hours section", reviewedById: 1, performedById: 1 })]));
  });
});
