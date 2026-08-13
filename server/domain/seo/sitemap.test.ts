import { describe, it, expect } from "vitest";
import { generateRobotsTxt, generateSitemapXml } from "./sitemap";

describe("Phase 5 SEO automation and sitemap rules", () => {
  it("generates strict robots.txt disallowing private paths and exposing sitemap", async () => {
    const robots = await generateRobotsTxt();
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Disallow: /admin/");
    expect(robots).toContain("Disallow: /owner/");
    expect(robots).toContain("Sitemap: https://justfinds-izng9njy.manus.space/sitemap.xml");
  });

  it("generates valid sitemap XML containing root and indexable routes", async () => {
    const sitemap = await generateSitemapXml();
    expect(sitemap).toContain("<?xml version=");
    expect(sitemap).toContain("<urlset");
    expect(sitemap).toContain("<loc>https://justfinds-izng9njy.manus.space/</loc>");
  });
});
