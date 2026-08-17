import { describe, expect, it } from "vitest";
import { appointmentDecisionGuidance, leadStageTone } from "./crmPresentation";

describe("CRM presentation rules", () => {
  it("uses restrained semantic tones for factual lead stages", () => {
    expect(leadStageTone("qualified")).toContain("blue");
    expect(leadStageTone("converted")).toContain("emerald");
    expect(leadStageTone("closed")).toContain("slate");
  });

  it("explains appointment actions using only real status and availability inputs", () => {
    expect(appointmentDecisionGuidance("requested", 2)).toContain("available times");
    expect(appointmentDecisionGuidance("requested", 0)).toContain("No alternative availability");
    expect(appointmentDecisionGuidance("proposed", 1)).toContain("customer");
  });
});
