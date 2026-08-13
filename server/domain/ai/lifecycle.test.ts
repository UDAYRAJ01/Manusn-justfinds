import { describe, expect, it } from "vitest";
import { canTransitionAiContent } from "./content";
import { aiContentTypes } from "./types";

describe("AI content lifecycle", () => {
  it.each(aiContentTypes)("supports draft review and publication transitions for %s", () => {
    expect(canTransitionAiContent("draft", "pending_review")).toBe(true);
    expect(canTransitionAiContent("pending_review", "approved")).toBe(true);
    expect(canTransitionAiContent("approved", "published")).toBe(true);
    expect(canTransitionAiContent("published", "draft")).toBe(false);
  });

  it.each(aiContentTypes)("supports rejection and restoration to draft for %s", () => {
    expect(canTransitionAiContent("pending_review", "rejected")).toBe(true);
    expect(canTransitionAiContent("rejected", "draft")).toBe(true);
    expect(canTransitionAiContent("rejected", "published")).toBe(false);
  });
});
