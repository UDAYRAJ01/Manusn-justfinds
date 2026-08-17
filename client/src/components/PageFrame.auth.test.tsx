// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ user: null as { role: string } | null }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: auth.user }) }));
vi.mock("./JustFindsLogo", () => ({ JustFindsLogo: () => <div>Just Finds</div> }));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => ["/", vi.fn()],
}));

import { PageFrame } from "./PageFrame";

describe("PageFrame managed authentication navigation", () => {
  it("sends a public user to managed sign-in and the first-listing workspace without exposing admin navigation", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    auth.user = null;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<PageFrame><div>Home</div></PageFrame>); });

    expect(container.querySelector('a[href="/login"]')?.textContent).toContain("Sign in");
    expect(container.querySelector('a[href="/business"]')?.textContent).toContain("List your business");
    expect(container.textContent).not.toContain("Admin workspace");

    await act(async () => { root.unmount(); });
    container.remove();
  });

  it("shows an administrator workspace link only for an authenticated administrator", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    auth.user = { role: "super_admin" };
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<PageFrame><div>Home</div></PageFrame>); });

    expect(container.querySelector('a[href="/admin"]')?.textContent).toContain("Admin workspace");
    expect(Array.from(container.querySelectorAll('a[href="/business"]')).some(link => link.textContent?.includes("My listings"))).toBe(true);

    await act(async () => { root.unmount(); });
    container.remove();
  });
});
