// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryOptions: null as { retry?: boolean } | null,
  user: null as { role?: string } | null,
}));

vi.mock("wouter", () => ({
  useParams: () => ({ businessSlug: "" }),
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/components/WebsiteRenderer", () => ({ default: () => <div>Published website</div> }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    website: {
      publicPage: {
        useQuery: (_input: { slug: string }, options: { retry?: boolean }) => {
          mocks.queryOptions = options;
          return { data: undefined, error: new Error("Published website not found."), isLoading: false };
        },
      },
      track: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }) },
    },
  },
}));

import PublicWebsite, { getUnavailableWebsiteAction } from "./PublicWebsite";

describe("PublicWebsite unavailable-page handling", () => {
  it("renders the clear unavailable-page state immediately without retrying a published-page 404", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => { root.render(<PublicWebsite slug="vishnoi-face-hospital" />); });

    expect(mocks.queryOptions).toEqual({ retry: false });
    expect(container.textContent).toContain("Website not published");
    expect(container.textContent).toContain("This business has not published a public website");
    expect(container.textContent).toContain("Explore Just Finds");

    await act(async () => { root.unmount(); });
    container.remove();
  });

  it("only returns unpublished-site workspace guidance for authorized owner or administrator roles", () => {
    expect(getUnavailableWebsiteAction("user")).toBeNull();
    expect(getUnavailableWebsiteAction("business_owner")).toEqual({ href: "/business", label: "Open My listings" });
    expect(getUnavailableWebsiteAction("super_admin")).toEqual({ href: "/admin", label: "Open admin workspace" });
  });
});
