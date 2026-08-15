import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("../db", () => dbMocks);
vi.mock("../storage", () => ({ storagePut: vi.fn() }));

import { workspaceRouter } from "./workspaces";

describe("city creation contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-super-admin users before touching the database", async () => {
    const getDb = dbMocks.getDb;
    const caller = workspaceRouter.createCaller({ user: { id: 7, role: "admin" } } as never);

    await expect(caller.createCity({ name: "Kannur", slug: "kanpur" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Super-administrator access is required.",
    });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("uses the canonical approved catalogue record rather than submitted city metadata", async () => {
    const values = vi.fn().mockResolvedValueOnce([{ insertId: 88 }]);
    const insert = vi.fn(() => ({ values }));
    dbMocks.getDb.mockResolvedValue({ insert });
    const caller = workspaceRouter.createCaller({ user: { id: 1, role: "super_admin" } } as never);

    await caller.createCity({ name: "Kanpur", slug: "some-other-slug", state: "Wrong", latitude: "0", longitude: "0" });

    expect(values).toHaveBeenCalledWith({ name: "Kanpur", slug: "kanpur", state: "Uttar Pradesh", country: "IN", tier: "tier2", latitude: "26.4499", longitude: "80.3319", isActive: true });
  });

  it("rejects a super-admin attempt to add an unsupported city", async () => {
    const caller = workspaceRouter.createCaller({ user: { id: 1, role: "super_admin" } } as never);

    await expect(caller.createCity({ name: "Kannur" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Just Finds currently supports only the approved India Tier-1 and Tier-2 city catalogue.",
    });
    expect(dbMocks.getDb).not.toHaveBeenCalled();
  });
});
