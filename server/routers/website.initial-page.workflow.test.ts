import { describe, expect, it, vi } from "vitest";
import { businesses, businessPages, pagePublishHistory, pageSections, pageVersions } from "../../drizzle/schema";
import { defaultDesignConfig, websiteRouter } from "./website";

const state = vi.hoisted(() => ({
  business: { id: 70, ownerId: 42, slug: "approved-hospital", name: "Approved Hospital", status: "approved" },
  page: { id: 71, businessId: 70, slug: "approved-hospital-website", status: "draft", publishedAt: null as Date | null },
  sections: [] as Array<Record<string, unknown>>,
  versions: [] as Array<Record<string, unknown>>,
  history: [] as Array<Record<string, unknown>>,
}));

vi.mock("../db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({
      from: (table: unknown) => {
        if (table === businesses) return { where: () => ({ limit: async () => [state.business] }) };
        if (table === businessPages) return { where: () => ({ limit: async () => [state.page] }) };
        if (table === pageSections) return { where: async () => state.sections };
        if (table === pageVersions) return { where: () => ({ orderBy: async () => state.versions }) };
        return { where: async () => [] };
      },
    }),
    delete: (table: unknown) => ({ where: async () => { if (table === pageSections) state.sections = []; } }),
    insert: (table: unknown) => ({ values: async (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
      if (table === pageSections) state.sections = (values as Array<Record<string, unknown>>).map((section, index) => ({ id: index + 1, ...section }));
      if (table === pageVersions) state.versions.push({ id: state.versions.length + 1, ...(values as Record<string, unknown>) });
      if (table === pagePublishHistory) state.history.push({ id: state.history.length + 1, ...(values as Record<string, unknown>) });
      return [{ insertId: 1 }];
    } }),
    update: (table: unknown) => ({ set: (values: Record<string, unknown>) => ({ where: async () => {
      if (table === businessPages) Object.assign(state.page, values);
      if (table === pageVersions && values.status) Object.assign(state.versions.at(-1) ?? {}, values);
    } }), }),
  })),
}));

const owner = () => websiteRouter.createCaller({ user: { id: 42, openId: "42", name: "Owner", email: null, loginMethod: "test", role: "business_owner", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as never, res: {} as never });

describe("initial website page workflow", () => {
  it("saves the untouched default design as version one and then publishes the approved business website", async () => {
    state.page.status = "draft";
    state.sections = [];
    state.versions = [];
    state.history = [];
    const caller = owner();
    const saved = await caller.saveDraft({ businessId: 70, sections: [{ sectionType: "hero", displayOrder: 0, enabled: true, config: {} }], designConfig: defaultDesignConfig });
    expect(saved.versionNumber).toBe(1);
    expect(state.versions).toHaveLength(1);
    const published = await caller.publish({ businessId: 70 });
    expect(published).toEqual({ success: true, slug: "approved-hospital-website" });
    expect(state.page.status).toBe("published");
    expect(state.history).toEqual(expect.arrayContaining([expect.objectContaining({ action: "publish", versionId: 1, performedById: 42 })]));
  });
});
