import { describe, expect, it, vi } from "vitest";
import { businessRouter } from "./business";

vi.mock("../db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [{ id: 44, ownerId: 900, status: "draft", onboardingStep: 1, name: "Owner business", categoryId: 1, cityId: 1 }],
        }),
      }),
    }),
  })),
}));

describe("business router ownership isolation", () => {
  it("rejects a direct businessDetail request from a different owner", async () => {
    const caller = businessRouter.createCaller({
      user: { id: 901, openId: "other", name: "Other", email: null, loginMethod: "test", role: "business_owner", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: {} as never,
      res: {} as never,
    });

    await expect(caller.businessDetail({ businessId: 44 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
