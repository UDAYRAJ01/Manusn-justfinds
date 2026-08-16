// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateSeoPack: vi.fn(async () => ({ completed: 1, failed: 0, profile: { contentType: "business_seo_profile", status: "completed", versionId: 11 } })),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ workspace: { pendingBusinesses: { invalidate: mocks.invalidate }, adminOverview: { invalidate: mocks.invalidate } }, aiContent: { reviewQueue: { invalidate: mocks.invalidate } } }),
    workspace: {
      pendingBusinesses: { useQuery: () => ({ data: [{ id: 901, businessName: "Imported example", mainCategory: "Education", subcategory: "Coaching", businessType: "Tutorial centre", description: "Factual imported description.", services: [{ name: "Mathematics coaching" }], address: "12 Example Road", city: "Pune", locality: "Kothrud", state: "Maharashtra", country: "IN", latitude: "18.5074", longitude: "73.8077", phone: "9876543210", email: "hello@example.in", website: "https://example.in", hours: [{ dayOfWeek: 0, opensAt: "09:00", closesAt: "17:00", isClosed: false, isTwentyFourHours: false }], ratingAudit: null, totalReviewsAudit: null, ratingAuditNote: "Audit-only", faqs: [{ question: "Do you offer coaching?", answer: "Yes, mathematics coaching is listed." }] }], isLoading: false }) },
      reviewBusiness: { useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }) },
    },
    aiContent: { generateSeoPack: { useMutation: () => ({ mutateAsync: mocks.generateSeoPack, isPending: false, error: null }) } },
  },
}));

import { ApprovalManager } from "./AdminWorkspace";

describe("administrator detailed AI SEO approval action", () => {
  it("shows supplied fields separately and creates one private best-profile draft only after selection", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<ApprovalManager />); });
    expect(container.textContent).toContain("Business Name");
    expect(container.textContent).toContain("Imported example");
    expect(container.textContent).toContain("Main Category");
    expect(container.textContent).toContain("Mathematics coaching");
    expect(container.textContent).toContain("Rating (audit only)");
    const action = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("Create best AI profiles")) as HTMLButtonElement;
    expect(action.disabled).toBe(true);
    await act(async () => { (container.querySelector('input[type="checkbox"]') as HTMLInputElement).click(); });
    expect(action.disabled).toBe(false);
    await act(async () => { action.click(); });
    expect(mocks.generateSeoPack).toHaveBeenCalledWith({ businessId: 901 });
    expect(container.textContent).toContain("private Best AI SEO profiles were created");
    expect(Array.from(container.querySelectorAll("a")).some(link => link.getAttribute("href") === "/admin/ai" && link.textContent?.includes("Open AI governance"))).toBe(true);
    await act(async () => { root.unmount(); });
    container.remove();
  });
});
