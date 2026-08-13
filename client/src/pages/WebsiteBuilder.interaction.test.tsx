// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ save: vi.fn(), publish: vi.fn(), invalidate: vi.fn() }));

vi.mock("@/components/WebsiteRenderer", () => ({ default: ({ data }: { data: { business: { name: string } } }) => <div data-testid="shared-renderer">{data.business.name}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ website: { builder: { invalidate: mocks.invalidate } } }),
    website: {
      builder: { useQuery: () => ({ data: { page: { id: 7, seoTitle: null, metaDescription: null }, business: { id: 5, name: "Test business", shortDescription: "Factual description" }, sections: [{ id: 1, sectionType: "hero", displayOrder: 0, enabled: true, config: {} }, { id: 2, sectionType: "about", displayOrder: 1, enabled: true, config: {} }], versions: [], designConfig: { theme: "modern", radius: "lg" }, registry: [{ type: "hero", label: "Hero", allowedCategories: ["all"] }, { type: "about", label: "About", allowedCategories: ["all"] }] } }) },
      saveDraft: { useMutation: () => ({ mutate: mocks.save, isPending: false, error: null }) },
      publish: { useMutation: () => ({ mutate: mocks.publish, isPending: false, error: null }) },
    },
    business: {
      businessDetail: { useQuery: () => ({ data: { business: { id: 5, name: "Test business", shortDescription: "Factual description", address: "Owner-supplied address" }, services: [], images: [] } }) },
    },
  },
}));

import WebsiteBuilder from "./WebsiteBuilder";

describe("WebsiteBuilder section interactions", () => {
  it("selects a section without toggling it and exposes an explicit hide action", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<WebsiteBuilder businessId={5} />); });
    const about = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "about") as HTMLButtonElement;
    expect(about).toBeTruthy();
    await act(async () => { about.click(); });
    expect(container.textContent).toContain("Saved design");
    expect(container.textContent).toContain("Section label");
    const hide = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "Hide") as HTMLButtonElement;
    expect(hide).toBeTruthy();
    await act(async () => { hide.click(); });
    expect(container.textContent).toContain("Unsaved changes");
    expect(container.textContent).toContain("Show");
    await act(async () => { root.unmount(); });
    container.remove();
  });
});
