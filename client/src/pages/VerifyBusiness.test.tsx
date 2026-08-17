// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  inputs: [] as { slug: string }[],
}));

vi.mock("@/components/PageFrame", () => ({ PageFrame: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/PageMeta", () => ({ PageMeta: () => null }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    discovery: {
      certificate: {
        useQuery: (input: { slug: string }) => {
          mocks.inputs.push(input);
          return {
            isLoading: false,
            data: {
              valid: true,
              business: { id: 13, name: "Published business", slug: "published-business", address: "Verified address" },
              certificate: { certificateId: "JF-TEST", issuedAt: "2026-08-17T00:00:00.000Z" },
              verification: { status: "verified" },
            },
          };
        },
      },
    },
  },
}));

import VerifyBusiness from "./VerifyBusiness";

describe("VerifyBusiness", () => {
  it("uses the route-provided slug and displays only public certificate facts", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    mocks.inputs.length = 0;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => { root.render(<VerifyBusiness params={{ slug: "published-business" }} />); });

    expect(mocks.inputs).toEqual([{ slug: "published-business" }]);
    expect(container.textContent).toContain("Published business");
    expect(container.textContent).toContain("JF-TEST");
    expect(container.textContent).not.toContain("reviewer");
    await act(async () => { root.unmount(); });
    container.remove();
  });
});
