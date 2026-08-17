import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const categoriesSource = readFileSync(new URL("./Categories.tsx", import.meta.url), "utf8");

describe("factual category-directory contract", () => {
  it("provides accessible search and responsive compact category cards", () => {
    expect(categoriesSource).toContain('id="category-directory-search"');
    expect(categoriesSource).toContain('grid-cols-2');
    expect(categoriesSource).toContain('lg:grid-cols-4');
    expect(categoriesSource).toContain('min-h-[132px]');
  });

  it("keeps truthful loading, error, and no-results recovery states", () => {
    expect(categoriesSource).toContain("Categories could not be loaded");
    expect(categoriesSource).toContain("No categories match that search");
    expect(categoriesSource).toContain("No categories are available yet");
  });

  it("does not introduce unsupported category popularity or reputation claims", () => {
    expect(categoriesSource).not.toMatch(/top category|most popular|best category|top-rated/i);
  });
});
