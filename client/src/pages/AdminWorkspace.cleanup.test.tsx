// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  remove: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ workspace: { internalValidationBusinesses: { invalidate: mocks.invalidate }, adminOverview: { invalidate: mocks.invalidate } } }),
    workspace: {
      internalValidationBusinesses: { useQuery: () => ({ data: [{ id: 12, name: "Just Finds Internal Validation — TEST ONLY", category: "Just Finds Internal Validation", city: "Test Zone", status: "published", voiceIntroductionUrl: null }], isLoading: false, error: null }) },
      deleteInternalValidationBusiness: { useMutation: () => ({ mutate: mocks.remove, isPending: false, error: null }) },
    },
  },
}));

import { InternalTestListingManager } from "./AdminWorkspace";

describe("internal test-listing cleanup confirmation", () => {
  it("requires the exact confirmation phrase before invoking the guarded delete mutation", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<InternalTestListingManager />); });

    const open = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("Remove test listing")) as HTMLButtonElement;
    await act(async () => { open.click(); });
    const confirm = container.querySelector<HTMLInputElement>('[aria-label="Deletion confirmation"]')!;
    const remove = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "Permanently remove") as HTMLButtonElement;
    expect(remove.disabled).toBe(true);

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(confirm, "DELETE TEST LISTING");
      confirm.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(remove.disabled).toBe(false);
    await act(async () => { remove.click(); });
    expect(mocks.remove).toHaveBeenCalledWith({ businessId: 12, confirmation: "DELETE TEST LISTING" });
    await act(async () => { root.unmount(); });
    container.remove();
  });
});
