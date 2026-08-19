// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, reset: vi.fn(), data: undefined, error: null }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ workspace: { bulkImportHistory: { invalidate: vi.fn() } } }),
    workspace: {
      bulkImportPreview: { useMutation: mocks.mutation },
      commitBulkImport: { useMutation: mocks.mutation },
      beginHighVolumeImport: { useMutation: mocks.mutation },
      queueHighVolumeValidation: { useMutation: mocks.mutation },
      startHighVolumeImport: { useMutation: mocks.mutation },
      retryHighVolumeImport: { useMutation: mocks.mutation },
      cancelHighVolumeImport: { useMutation: mocks.mutation },
      bulkImportHistory: {
        useQuery: () => ({
          data: [{
            id: 41, filename: "verified-listings.csv", status: "completed", phase: "completed", totalRows: 2, validRows: 2, failedRows: 0,
            progressPercent: 100, aiRewriteBatchId: "import-seo-41", aiRewriteStatus: "processing", aiRewriteTotalJobs: 2, aiRewriteCompletedJobs: 1, aiRewriteFailedJobs: 0,
          }],
        }),
      },
    },
  },
}));

import { BulkImportManager } from "./BulkImportManager";

describe("automatic imported-listing AI drafts", () => {
  it("shows Gemini batch progress and retains administrator approval before publication", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<BulkImportManager />); });

    expect(container.textContent).toContain("Gemini AI drafting · processing");
    expect(container.textContent).toContain("1 completed · 0 needs attention · 2 total");
    expect(container.textContent).toContain("Drafts remain private until administrator approval.");

    await act(async () => { root.unmount(); });
    container.remove();
  });
});
