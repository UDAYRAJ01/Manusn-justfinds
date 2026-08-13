import { describe, expect, it } from "vitest";
import { voiceFailureMessage } from "./voiceFeedback";

describe("owner voice-generation feedback", () => {
  it("maps recoverable provider failures to calm retry guidance", () => {
    expect(voiceFailureMessage("The provider could not complete the request")).toContain("Please wait a moment and try again");
  });

  it("explains the approval and configuration prerequisites", () => {
    expect(voiceFailureMessage("No approved voice is configured")).toContain("not configured");
    expect(voiceFailureMessage("A description must be approved first")).toContain("administrator-approved description");
  });
});
