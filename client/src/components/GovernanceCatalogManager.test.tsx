// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  catalogue: {
    categories: [{ id: 8, name: "Health services", slug: "health-services", description: "Licensed healthcare discovery", icon: "HeartPulse", isActive: true, status: "active" as const, subcategoryCount: 4, fieldCount: 6 }],
    cities: [{ cityId: 12, name: "Mumbai", slug: "mumbai", state: "Maharashtra", country: "IN" as const, tier: "tier1" as const, latitude: "19.0760", longitude: "72.8777", isProvisioned: true, isActive: true }, { cityId: null, name: "Kanpur", slug: "kanpur", state: "Uttar Pradesh", country: "IN" as const, tier: "tier2" as const, latitude: "26.4499", longitude: "80.3319", isProvisioned: false, isActive: false }],
  },
}));
const mocks = vi.hoisted(() => ({
  mutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ workspace: { governanceCatalog: { invalidate: mocks.invalidate }, categorySchemas: { invalidate: mocks.invalidate } }, discovery: { categories: { invalidate: mocks.invalidate }, locations: { invalidate: mocks.invalidate } } }),
    workspace: {
      governanceCatalog: { useQuery: () => ({ data: state.catalogue, isLoading: false, error: null }) },
      createCategory: { useMutation: mocks.mutation },
      updateCategoryGovernance: { useMutation: mocks.mutation },
      createCity: { useMutation: mocks.mutation },
      setCityActive: { useMutation: mocks.mutation },
      createCategoryField: { useMutation: mocks.mutation },
    },
  },
}));

import { GovernanceCatalogManager } from "./GovernanceCatalogManager";

describe("controlled taxonomy and city governance", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("shows searchable managed category metadata and the fixed India catalogue to a super administrator", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<GovernanceCatalogManager role="super_admin" />); });

    expect(container.textContent).toContain("Controlled directory governance");
    expect(container.textContent).toContain("Add category");
    expect(container.textContent).toContain("Health services");
    expect(container.textContent).toContain("HeartPulse");
    expect(container.textContent).toContain("Edit governance");
    expect(container.textContent).toContain("Curated India coverage");

    const cityTab = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "India city catalogue");
    await act(async () => { cityTab?.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(container.textContent).toContain("Mumbai");
    expect(container.textContent).toContain("Maharashtra");
    expect(container.textContent).toContain("19.0760, 72.8777");
    expect(container.textContent).toContain("Tier 1");
    expect(container.textContent).toContain("Provision");
    expect(container.textContent).not.toContain("Create city");

    await act(async () => { root.unmount(); });
    container.remove();
  });

  it("keeps governance controls read-only for a standard administrator", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<GovernanceCatalogManager role="admin" />); });

    expect(container.textContent).toContain("View-only administrator");
    expect(container.textContent).toContain("Super-administrator access is required");
    expect(container.textContent).not.toContain("Add category");
    expect(container.textContent).not.toContain("Edit governance");

    await act(async () => { root.unmount(); });
    container.remove();
  });
});
