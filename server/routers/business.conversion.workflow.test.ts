import { beforeEach, describe, expect, it, vi } from "vitest";
import { businessRouter } from "./business";

const state = vi.hoisted(() => ({
  rows: [] as unknown[][],
  updates: [] as unknown[],
  inserts: [] as unknown[],
}));

const query = () => ({
  from: () => ({
    where: () => ({
      limit: async () => state.rows.shift() ?? [],
      orderBy: async () => [],
    }),
  }),
});

const writer = (values: unknown[]) => ({
  update: () => ({ set: (value: unknown) => ({ where: async () => { values.push(value); } }) }),
  insert: () => ({ values: async (value: unknown) => { state.inserts.push(value); return [{ insertId: 91 }]; } }),
});

vi.mock("../db", () => ({
  getDb: vi.fn(async () => ({
    select: query,
    ...writer(state.updates),
    transaction: async (callback: (tx: ReturnType<typeof writer>) => Promise<void>) => callback(writer(state.updates)),
  })),
}));

function caller(userId = 42, role: "user" | "business_owner" | "admin" = "business_owner") {
  return businessRouter.createCaller({
    user: { id: userId, openId: "test-user", name: "Test user", email: null, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as never,
    res: {} as never,
  });
}

describe("conversion workflow router behavior", () => {
  beforeEach(() => { state.rows = []; state.updates = []; state.inserts = []; });

  it("rejects a verification decision before querying private case data when the caller is not an administrator", async () => {
    await expect(caller(42, "business_owner").reviewVerification({ businessId: 7, decision: "verified", note: "Valid ownership evidence reviewed." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.rows).toEqual([]);
  });

  it("records an administrator verification decision and updates only the verification flag", async () => {
    state.rows = [[{ id: 11, businessId: 7, status: "pending" }]];
    await expect(caller(80, "admin").reviewVerification({ businessId: 7, decision: "verified", note: "Registration evidence matches the business identity." })).resolves.toEqual({ status: "verified" });
    expect(state.updates).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: "verified", reviewedById: 80, reviewNote: "Registration evidence matches the business identity." }),
      { isVerified: true },
    ]));
    expect(state.inserts).toContainEqual(expect.objectContaining({ businessId: 7, verificationId: 11, actorId: 80, action: "approved" }));
  });

  it("lets the owner update a lead lifecycle, assignment, and follow-up without creating a fictitious conversion", async () => {
    state.rows = [[{ id: 7, ownerId: 42 }]];
    await expect(caller().updateLead({ businessId: 7, leadId: 55, status: "qualified", assignToMe: true, followUpAt: new Date("2026-08-18T09:00:00.000Z") })).resolves.toEqual({ success: true });
    expect(state.updates).toContainEqual(expect.objectContaining({ status: "qualified", assignedToId: 42, followUpAt: new Date("2026-08-18T09:00:00.000Z") }));
    expect(state.updates[0]).toEqual(expect.objectContaining({ lastContactedAt: expect.any(Date) }));
  });

  it("requires the requested lead to belong to the owner business before a CRM note is stored", async () => {
    state.rows = [[{ id: 7, ownerId: 42 }], [{ id: 55 }]];
    await expect(caller().addLeadNote({ businessId: 7, leadId: 55, body: "Called the customer and confirmed the requested service." })).resolves.toEqual({ noteId: 91 });
    expect(state.inserts).toContainEqual(expect.objectContaining({ businessId: 7, leadId: 55, authorId: 42 }));
  });
});
