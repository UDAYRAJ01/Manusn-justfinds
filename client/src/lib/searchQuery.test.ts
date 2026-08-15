import { describe, expect, it } from "vitest";
import { getSearchQueryParams } from "./searchQuery";

describe("getSearchQueryParams", () => {
  it("keeps taxonomy filters provided by the router location", () => {
    const params = getSearchQueryParams("/search?category=hospital&subcategory=cardiology&businessType=heart-clinic");
    expect(params.get("category")).toBe("hospital");
    expect(params.get("subcategory")).toBe("cardiology");
    expect(params.get("businessType")).toBe("heart-clinic");
  });

  it("uses browser location.search when the router exposes only the pathname", () => {
    const params = getSearchQueryParams("/search", "?category=hospital&businessType=emergency-care");
    expect(params.get("category")).toBe("hospital");
    expect(params.get("businessType")).toBe("emergency-care");
  });
});
