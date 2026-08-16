// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generate: vi.fn(async () => ({ status: "completed" })),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ workspace: { pendingBusinesses: { invalidate: mocks.invalidate }, adminOverview: { invalidate: mocks.invalidate } }, aiContent: { reviewQueue: { invalidate: mocks.invalidate } } }),
    workspace: {
      pendingBusinesses: { useQuery: () => ({ data: [{ id: 901, name: "Imported example", category: "Education", city: "Pune", shortDescription: "Factual imported description." }], isLoading: false }) },
      reviewBusiness: { useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }) },
    },
    aiContent: { generate: { useMutation: () => ({ mutateAsync: mocks.generate, isPending: false, error: null }) } },
  },
}));

import { ApprovalManager } from "./AdminWorkspace";

describe("administrator bulk AI About action", () => {
  it("requires a selection, generates a private draft, and directs the administrator to review it", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<ApprovalManager />); });

    const action = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("Select listings to rewrite")) as HTMLButtonElement;
    expect(action.disabled).toBe(true);
    await act(async () => { (container.querySelector('input[type="checkbox"]') as HTMLInputElement).click(); });
    expect(action.disabled).toBe(false);

    await act(async () => { action.click(); });
    expect(mocks.generate).toHaveBeenCalledWith({ businessId: 901, contentType: "about_business" });
    expect(container.textContent).toContain("private AI About draft is ready for comparison");
    expect(Array.from(container.querySelectorAll("a")).some(link => link.getAttribute("href") === "/admin/ai" && link.textContent?.includes("Open AI governance"))).toBe(true);
    await act(async () => { root.unmount(); });
    container.remove();
  });
});
