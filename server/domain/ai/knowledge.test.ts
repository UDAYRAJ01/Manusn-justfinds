import { describe, expect, it } from "vitest";
import { rankKnowledge, BUSINESS_CHAT_FALLBACK } from "./knowledge";

describe("business knowledge retrieval", () => {
  const items = [
    { id: 1, label: "approved-profile", content: "Business name: Cedar Dental. City: Pune." },
    { id: 2, label: "service:cleaning", content: "Teeth cleaning service." },
    { id: 3, label: "other-business", content: "Business name: Other Clinic. City: Mumbai." },
  ];

  it("ranks only knowledge entries that share meaningful question tokens", () => {
    expect(rankKnowledge("Do you provide teeth cleaning?", items).map(item => item.id)).toEqual([2]);
  });

  it("does not infer an answer from an unrelated business entry", () => {
    expect(rankKnowledge("What is your opening time?", items)).toEqual([]);
  });

  it("keeps the exact fallback sentence stable for unanswered chat paths", () => {
    expect(BUSINESS_CHAT_FALLBACK).toBe("I don't have that information for this business.");
  });
});
