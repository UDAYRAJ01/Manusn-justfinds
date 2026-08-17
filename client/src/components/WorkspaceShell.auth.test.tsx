// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ user: null as { name?: string; role: string } | null }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: auth.user, loading: false, logout: vi.fn() }) }));
vi.mock("./JustFindsLogo", () => ({ JustFindsLogo: () => <div>Just Finds</div> }));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => ["/admin", vi.fn()],
}));

import { WorkspaceShell } from "./WorkspaceShell";

function renderAdminWorkspace(container: HTMLDivElement) {
  const root = createRoot(container);
  return { root, render: () => root.render(<WorkspaceShell title="Administration" subtitle="Protected" requireAdmin items={[]}><div>Protected admin content</div></WorkspaceShell>) };
}

describe("WorkspaceShell role-gated access", () => {
  it("blocks a regular signed-in user from administrator workspace content", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    auth.user = { name: "Regular user", role: "user" };
    const container = document.createElement("div");
    document.body.append(container);
    const { root, render } = renderAdminWorkspace(container);
    await act(async () => { render(); });

    expect(container.textContent).toContain("Administrator access required");
    expect(container.textContent).not.toContain("Protected admin content");

    await act(async () => { root.unmount(); });
    container.remove();
  });

  it("allows a separately assigned administrator into administrator workspace content", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    auth.user = { name: "Admin user", role: "super_admin" };
    const container = document.createElement("div");
    document.body.append(container);
    const { root, render } = renderAdminWorkspace(container);
    await act(async () => { render(); });

    expect(container.textContent).toContain("Protected admin content");
    expect(container.textContent).not.toContain("Administrator access required");

    await act(async () => { root.unmount(); });
    container.remove();
  });

  it("renders the distinct governed administrator navigation treatment and visible role context", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    auth.user = { name: "Admin user", role: "super_admin" };
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<WorkspaceShell title="Administration" subtitle="Govern the marketplace" requireAdmin variant="admin" items={[]}><div>Governed content</div></WorkspaceShell>);
    });

    expect(container.querySelector("aside")?.className).toContain("bg-[#0a1020]");
    expect(container.textContent).toContain("super admin");
    expect(container.textContent).toContain("Governance access. Decisions are server-authorised and auditable.");
    expect(container.querySelector("nav[aria-label='Administration quick navigation']")?.className).toContain("md:hidden");
    expect(container.querySelector("nav[aria-label='Administration quick navigation']")?.className).toContain("bg-[#0a1020]/95");

    await act(async () => { root.unmount(); });
    container.remove();
  });
});
