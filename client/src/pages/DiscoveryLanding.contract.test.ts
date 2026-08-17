import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const landingSource = readFileSync(new URL("./DiscoveryLanding.tsx", import.meta.url), "utf8");

describe("factual local-exploration landing contract", () => {
  it("keeps breadcrumbs, compact shared search, and published-listing discovery", () => {
    expect(landingSource).toContain('aria-label="Breadcrumb"');
    expect(landingSource).toContain("<SearchBar");
    expect(landingSource).toContain("Published profiles");
    expect(landingSource).toContain("trpc.discovery.search.useQuery");
  });

  it("offers constructive low-data recovery without unsupported rank claims", () => {
    expect(landingSource).toContain("No published profiles match this page yet");
    expect(landingSource).toContain("Explore approved cities");
    expect(landingSource).not.toContain('"Best');
    expect(landingSource).not.toContain('"Top-rated');
    expect(landingSource).not.toContain('"Most trusted');
  });
});
