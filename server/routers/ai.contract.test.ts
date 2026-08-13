import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  createBusinessLead: vi.fn(async () => undefined),
  getDb: vi.fn(async () => undefined),
}));

vi.mock("../db", () => dbMocks);
vi.mock("../domain/ai/knowledge", () => ({
  answerBusinessQuestion: vi.fn(),
  getBusinessChatHistory: vi.fn(),
  getChatAnalytics: vi.fn(),
  getKnowledgeSources: vi.fn(),
  listUnansweredQuestions: vi.fn(),
  refreshBusinessKnowledge: vi.fn(),
  resolveUnansweredQuestion: vi.fn(),
}));

import { aiRouter } from "./ai";

const caller = aiRouter.createCaller({} as never);

describe("AI lead consent contract", () => {
  it("rejects a lead submission when explicit consent is absent", async () => {
    await expect(caller.createLead({ businessId: 13, name: "Asha", consentGiven: false as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMocks.createBusinessLead).not.toHaveBeenCalled();
  });

  it("records consent evidence for a valid public lead submission", async () => {
    await expect(caller.createLead({ businessId: 13, name: "Asha", email: "asha@example.com", message: "Please call me", consentGiven: true })).resolves.toEqual({ success: true });
    expect(dbMocks.createBusinessLead).toHaveBeenCalledWith(expect.objectContaining({ businessId: 13, name: "Asha", email: "asha@example.com", consentGiven: true }));
  });
});
