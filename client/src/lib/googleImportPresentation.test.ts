import { describe, expect, it } from "vitest";
import { GOOGLE_IMPORT_BOUNDARY, googlePrefillLabel, googleImportSteps, isLikelyDuplicateMessage } from "./googleImportPresentation";

describe("Google import presentation rules", () => {
  it("labels editable Google prefill and never presents forbidden imported content", () => {
    expect(googlePrefillLabel("category", true)).toContain("From Google Business data");
    expect(googlePrefillLabel("about", true)).toContain("edit before");
    expect(GOOGLE_IMPORT_BOUNDARY).toContain("ratings, reviews");
    expect(GOOGLE_IMPORT_BOUNDARY).toContain("photos");
  });

  it("asks owners to choose an approved city instead of inferring an unmatched locality", () => {
    expect(googlePrefillLabel("city", false)).toContain("Choose a supported city");
    expect(googlePrefillLabel("city", true, "Jodhpur")).toContain("Jodhpur");
  });

  it("keeps the workflow explicitly two-stage and recognizes duplicate recovery", () => {
    expect(googleImportSteps.map(step => step.id)).toEqual(["search", "review"]);
    expect(isLikelyDuplicateMessage("A likely duplicate already exists")).toBe(true);
    expect(isLikelyDuplicateMessage("Choose a valid category")).toBe(false);
  });
});
