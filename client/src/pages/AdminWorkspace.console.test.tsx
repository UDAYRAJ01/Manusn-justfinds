// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  location: "/admin",
  user: { name: "Operations Lead", role: "super_admin" },
  overview: { businesses: 128, pendingBusinesses: 7, users: 42, jobs: 9 },
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: state.user, loading: false, logout: vi.fn() }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    workspace: {
      adminOverview: { useQuery: () => ({ data: state.overview, isLoading: false, error: null }) },
    },
  },
}));
vi.mock("wouter", () => ({ useLocation: () => [state.location, vi.fn()] }));
vi.mock("@/components/WorkspaceShell", () => ({
  WorkspaceShell: ({ children, variant, title }: { children: React.ReactNode; variant?: string; title: string }) => <div data-workspace={title} data-variant={variant}>{children}</div>,
}));

import AdminWorkspace from "./AdminWorkspace";

describe("governed administrator command centre", () => {
  it("shows role context, live operational counts, and factual priority queues", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<AdminWorkspace />); });

    expect(container.querySelector("[data-variant='admin']")).not.toBeNull();
    expect(container.textContent).toContain("Operations command centre");
    expect(container.textContent).toContain("super admin");
    expect(container.textContent).toContain("128");
    expect(container.textContent).toContain("Review queue");
    expect(container.textContent).toContain("Counts are live database projections, not estimates.");
    expect(container.textContent).toContain("Business review queue");
    expect(container.textContent).toContain("Verification decisions");
    expect(container.textContent).toContain("Public changes need explicit confirmation");

    await act(async () => { root.unmount(); });
    container.remove();
  });
});
