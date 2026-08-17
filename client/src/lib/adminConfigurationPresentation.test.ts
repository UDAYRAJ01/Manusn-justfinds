import { describe, expect, it } from "vitest";
import { googleMappingGuardrail, googleMappingStatus, moderationDecisionWarning } from "./adminConfigurationPresentation";

describe("administrator configuration presentation", () => {
  it("distinguishes inactive mappings from active mappings", () => {
    expect(googleMappingStatus(false, true)).toMatchObject({ label: "Inactive", tone: "neutral" });
    expect(googleMappingStatus(true, true)).toMatchObject({ label: "Active", tone: "positive" });
  });

  it("flags an active mapping whose mapped category is inactive", () => {
    expect(googleMappingStatus(true, false)).toMatchObject({ label: "Needs review", tone: "warning" });
  });

  it("states that mapping changes do not mutate or publish owner listings", () => {
    expect(googleMappingGuardrail()).toContain("never changes an existing owner listing");
    expect(googleMappingGuardrail()).toContain("never publishes");
  });

  it("uses a stronger warning for public review removal", () => {
    expect(moderationDecisionWarning("remove_review")).toContain("public moderation state");
    expect(moderationDecisionWarning("dismiss")).toContain("leaves the current review unchanged");
  });
});
