// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const listing = { id: 41, name: "Factual Clinic", slug: "factual-clinic", shortDescription: null, address: "Mall Road", isVerified: true, category: "Healthcare", categorySlug: "healthcare", city: "Kanpur", citySlug: "kanpur", locality: null, savedAt: "2026-08-03T10:00:00.000Z" };
const mocks = vi.hoisted(() => ({
  data: [] as typeof listing[],
  calls: [] as number[],
  invalidate: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true, loading: false }) }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("@/components/PageFrame", () => ({ PageFrame: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ discovery: { savedListings: { invalidate: mocks.invalidate } } }),
    discovery: {
      savedListings: { useQuery: () => ({ data: mocks.data, isLoading: false, error: null, refetch: mocks.refetch }) },
      toggleSave: { useMutation: () => ({
        isPending: false,
        mutate: ({ businessId }: { businessId: number }, options: { onSuccess?: (result: { saved: boolean; reason: string }) => void }) => {
          mocks.calls.push(businessId);
          options.onSuccess?.(mocks.calls.length === 1 ? { saved: false, reason: "removed" } : { saved: true, reason: "saved" });
        },
      }) },
    },
  },
}));

import Saved from "./Saved";

describe("Saved listings interaction states", () => {
  it("shows a factual discovery empty state without placeholder listings", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    mocks.data = [];
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => { root.render(<Saved />); });

    expect(container.textContent).toContain("No saved places yet");
    expect(container.textContent).toContain("Saved places appear here");
    expect(container.textContent).not.toContain("Factual Clinic");
    await act(async () => { root.unmount(); });
    container.remove();
  });

  it("offers undo only after a real saved-list removal response", async () => {
    mocks.data = [listing];
    mocks.calls.length = 0;
    mocks.invalidate.mockClear();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => { root.render(<Saved />); });
    await act(async () => { (container.querySelector('[aria-label="Remove Factual Clinic from saved listings"]') as HTMLButtonElement).click(); });
    expect(container.textContent).toContain("Factual Clinic removed from saved listings.");
    expect(container.textContent).toContain("Undo");
    expect(mocks.calls).toEqual([41]);

    await act(async () => { (Array.from(container.querySelectorAll("button")).find(button => button.textContent === "Undo") as HTMLButtonElement).click(); });
    expect(mocks.calls).toEqual([41, 41]);
    expect(mocks.invalidate).toHaveBeenCalledTimes(2);
    await act(async () => { root.unmount(); });
    container.remove();
  });
});
