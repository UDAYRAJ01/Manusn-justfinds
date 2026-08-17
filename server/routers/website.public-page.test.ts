import { describe, expect, it, vi } from "vitest";
import { businessHours, businessImages, businessReviews, businesses, businessServices, pageSections, pageVersions } from "../../drizzle/schema";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), publicLookupCondition: null as unknown }));

vi.mock("../db", () => ({ getDb: mocks.getDb }));

import { websiteRouter } from "./website";

function includesReference(value: unknown, target: unknown, seen = new Set<unknown>()): boolean {
  if (value === target) return true;
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  return Object.values(value as Record<string, unknown>).some(child => includesReference(child, target, seen));
}

describe("public website resolution", () => {
  it("resolves a published page through the documented business slug even when the internal page slug has a suffix", async () => {
    const publishedRow = {
      page: { id: 9, businessId: 7, slug: "hospital-site", status: "published" },
      business: { id: 7, slug: "hospital", status: "published", name: "Hospital" },
      category: "Hospital",
      categorySlug: "hospital",
      city: "Kanpur",
      citySlug: "kanpur",
    };
    mocks.getDb.mockResolvedValue({
      select: () => ({
        from: (table: unknown) => {
          if (table === pageSections) return { where: () => ({ orderBy: async () => [] }) };
          if (table === businessServices) return { where: () => ({ orderBy: async () => [] }) };
          if (table === businessImages) return { where: () => ({ orderBy: async () => [] }) };
          if (table === businessReviews) return { where: async () => [] };
          if (table === businessHours) return { where: () => ({ orderBy: async () => [] }) };
          if (table === pageVersions) return { where: () => ({ orderBy: async () => [{ id: 12, versionNumber: 1, status: "published", designConfig: { theme: "minimal" } }] }) };
          return {
            innerJoin: () => ({
              leftJoin: () => ({
                leftJoin: () => ({
                  where: (condition: unknown) => {
                    mocks.publicLookupCondition = condition;
                    return { limit: async () => [publishedRow] };
                  },
                }),
              }),
            }),
          };
        },
      }),
    });
    const result = await websiteRouter.createCaller({} as never).publicPage({ slug: "hospital" });
    expect(result.page.slug).toBe("hospital-site");
    expect(result.business.slug).toBe("hospital");
    expect(result.categorySlug).toBe("hospital");
    expect(result.citySlug).toBe("kanpur");
    expect(result.designConfig).toEqual({ theme: "minimal" });
    expect(includesReference(mocks.publicLookupCondition, businesses.slug)).toBe(true);
  });
});
