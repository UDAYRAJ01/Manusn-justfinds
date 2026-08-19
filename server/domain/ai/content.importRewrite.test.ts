import { describe, expect, it } from "vitest";
import { automaticImportRewriteModelPlan } from "./content";
import { IMPORT_REWRITE_FIRST_PASS_MODEL, IMPORT_REWRITE_QUALITY_MODEL } from "./provider";

describe("automatic imported-listing rewrite policy", () => {
  it("uses Gemini Flash first and reserves Gemini Pro for factual validation fallback", () => {
    expect(automaticImportRewriteModelPlan("import-seo-42", "business_seo_profile")).toEqual({
      automaticImportRewrite: true,
      initialModel: IMPORT_REWRITE_FIRST_PASS_MODEL,
      qualityFallbackModel: IMPORT_REWRITE_QUALITY_MODEL,
    });
  });

  it("does not change manually requested or non-profile generation models", () => {
    expect(automaticImportRewriteModelPlan("manual-42", "business_seo_profile")).toEqual({
      automaticImportRewrite: false,
      initialModel: undefined,
      qualityFallbackModel: undefined,
    });
    expect(automaticImportRewriteModelPlan("import-seo-42", "faq")).toEqual({
      automaticImportRewrite: false,
      initialModel: undefined,
      qualityFallbackModel: undefined,
    });
  });
});
