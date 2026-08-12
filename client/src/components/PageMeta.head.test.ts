// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { applyPageMeta } from "./PageMeta";

const origin = "https://just-finds.manus.space";

function value(selector: string) {
  return document.head.querySelector(selector)?.getAttribute("content");
}

describe("PageMeta emitted document head", () => {
  beforeEach(() => { document.head.innerHTML = "<title></title>"; });

  it.each([
    ["/categories", "Browse local categories | Just Finds", "Explore local business categories", "https://just-finds.manus.space/categories"],
    ["/login", "Secure sign in | Just Finds", "Access your Just Finds account", "https://just-finds.manus.space/login"],
    ["/owner/profile", "Business workspace | Just Finds", "Manage your Just Finds business profile", "https://just-finds.manus.space/owner/profile"],
    ["/admin/categories", "Administration | Just Finds", "Manage approved Just Finds taxonomy", "https://just-finds.manus.space/admin/categories"],
  ])("emits a complete head contract for %s", (path, title, description, canonical) => {
    applyPageMeta(document, origin, path);
    expect(document.title).toBe(title);
    expect(value('meta[name="description"]')).toContain(description);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(canonical);
    expect(value('meta[property="og:title"]')).toBe(title);
    expect(value('meta[property="og:description"]')).toContain(description);
    expect(value('meta[property="og:url"]')).toBe(canonical);
  });
});
