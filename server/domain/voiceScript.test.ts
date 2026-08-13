import { describe, expect, it } from "vitest";
import { buildVoiceIntroductionScript } from "./voiceScript";

describe("buildVoiceIntroductionScript", () => {
  it("uses only the approved business description and standard Just Finds framing", () => {
    const script = buildVoiceIntroductionScript({ name: "Northside Studio", approvedDescription: "A ceramics studio with beginner workshops." });
    expect(script).toBe("Welcome to Northside Studio. A ceramics studio with beginner workshops. Find contact details, directions, and approved business information on Just Finds.");
  });

  it("does not generate an introduction without approved source content", () => {
    expect(() => buildVoiceIntroductionScript({ name: "Northside Studio", approvedDescription: null })).toThrow("approved business description");
  });
});
