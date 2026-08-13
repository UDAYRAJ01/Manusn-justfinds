import { describe, expect, it } from "vitest";
import { parseSearchIntent } from "./searchIntent";

describe("parseSearchIntent", () => {
  it("recognizes nearby search without pretending a taxonomy match exists", () => {
    expect(parseSearchIntent("dentists near me")).toEqual({ rawQuery: "dentists near me", searchTerm: "dentists", mode: "nearby" });
  });

  it("preserves an explicit city or locality as a resolvable location term", () => {
    expect(parseSearchIntent("restaurants near Civil Lines Kanpur")).toEqual({ rawQuery: "restaurants near Civil Lines Kanpur", searchTerm: "restaurants", locationTerm: "Civil Lines Kanpur", mode: "standard" });
  });

  it("separates a recommendation request from the underlying search term", () => {
    expect(parseSearchIntent("best hospitals in Kanpur")).toEqual({ rawQuery: "best hospitals in Kanpur", searchTerm: "hospitals", locationTerm: "Kanpur", mode: "recommended" });
  });
});
