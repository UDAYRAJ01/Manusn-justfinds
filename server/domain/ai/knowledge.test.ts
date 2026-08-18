import { describe, expect, it } from "vitest";
import { createApprovedBusinessAnswer, rankKnowledge, retrieveApprovedKnowledge, BUSINESS_CHAT_FALLBACK } from "./knowledge";

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

  it("uses approved service entries for a broad services question without relying on generated content", () => {
    const retrieved = retrieveApprovedKnowledge("What services are available?", [
      { id: 4, label: "Dental cleaning", content: "Dental cleaning: Owner-approved cleaning service.", sourceType: "service" },
      { id: 5, label: "approved-profile", content: "Business name: Cedar Dental.", sourceType: "profile" },
    ]);
    expect(retrieved.map(item => item.id)).toEqual([4]);
    expect(createApprovedBusinessAnswer(retrieved)).toEqual({
      answer: "Based on this business's approved information:\n\n• Dental cleaning: Owner-approved cleaning service.",
      answered: true,
    });
  });

  it("does not create a response when no approved knowledge exists", () => {
    expect(createApprovedBusinessAnswer([])).toEqual({ answer: BUSINESS_CHAT_FALLBACK, answered: false });
  });
});
