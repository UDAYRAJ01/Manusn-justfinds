// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryOptions: null as { retry?: boolean } | null,
}));

vi.mock("wouter", () => ({ useParams: () => ({ businessSlug: "" }) }));
vi.mock("@/components/WebsiteRenderer", () => ({ default: () => <div>Published website</div> }));
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

import PublicWebsite from "./PublicWebsite";

describe("PublicWebsite unavailable-page handling", () => {
  it("renders the clear unavailable-page state immediately without retrying a published-page 404", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => { root.render(<PublicWebsite slug="vishnoi-face-hospital" />); });

    expect(mocks.queryOptions).toEqual({ retry: false });
    expect(container.textContent).toContain("Website not found");
    expect(container.textContent).toContain("This business website is not published.");

    await act(async () => { root.unmount(); });
    container.remove();
  });
});

