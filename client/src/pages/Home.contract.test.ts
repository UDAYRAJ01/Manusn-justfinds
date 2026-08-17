import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("intent-first Home discovery contract", () => {
  it("keeps the approved-city search control and a single factual profile section", () => {
    expect(homeSource).toContain("<SearchBar />");
    expect(homeSource).toContain('title="Available local profiles"');
    expect(homeSource).toContain("Try browsing categories or searching by city.");
  });

  it("does not introduce unsupported popularity or reputation claims", () => {
    expect(homeSource).not.toMatch(/recently added|most popular|top rated|customer review/i);
    expect(homeSource).not.toMatch(/\d+\+\s*(customers|businesses|reviews)/i);
  });

  it("keeps compact horizontal category browsing for mobile discovery", () => {
    expect(homeSource).toContain('aria-label="Browse categories"');
    expect(homeSource).toContain("overflow-x-auto");
  });
});
