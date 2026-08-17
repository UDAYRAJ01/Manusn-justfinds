// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateSeoPack: vi.fn(async () => ({ batchId: "single-batch", queued: 1 })),
  bulkBestProfiles: vi.fn(async () => ({ batchId: "bulk-batch", queued: 1 })),
  applyBestProfile: vi.fn(async () => ({ applied: true })),
  revertBestProfile: vi.fn(async () => ({ reverted: true })),
  reviewBusiness: vi.fn(async () => ({ reviewed: true })),
  invalidate: vi.fn(),
}));

const business = {
  id: 901,
  status: "submitted",
  createdAt: new Date("2026-08-17T10:00:00.000Z"),
  businessName: "Imported example",
  mainCategory: "Education",
  subcategory: "Coaching",
  businessType: "Tutorial centre",
  description: "Factual imported description.",
  services: [{ name: "Mathematics coaching" }],
  address: "12 Example Road",
  city: "Pune",
  locality: "Kothrud",
  state: "Maharashtra",
  country: "IN",
  latitude: "18.5074",
  longitude: "73.8077",
  phone: "9876543210",
  email: "hello@example.in",
  website: "https://example.in",
  hours: [{ dayOfWeek: 0, opensAt: "09:00", closesAt: "17:00", isClosed: false, isTwentyFourHours: false }],
  ratingAudit: 4.2,
  totalReviewsAudit: 12,
  ratingAuditNote: "Audit-only source data.",
  faqs: [{ question: "Do you offer coaching?", answer: "Mathematics coaching is listed." }],
  aiRewriteJob: { status: "completed", createdAt: new Date("2026-08-17T10:05:00.000Z") },
  aiProfile: {
    id: 11,
    status: "draft",
    structured: {
      text: "Imported example is a tutorial centre in Pune.",
      title: "Imported example in Pune",
      description: "Find imported example and its listed coaching details in Pune.",
      faqs: [
        { question: "Where is the business?", answer: "It is at 12 Example Road in Pune." },
        { question: "What is listed?", answer: "Mathematics coaching is listed." },
        { question: "What type is it?", answer: "It is listed as a tutorial centre." },
        { question: "Is a phone available?", answer: "A phone number is supplied." },
        { question: "When is it open?", answer: "Sunday hours are supplied from 09:00 to 17:00." },
      ],
      serviceVerificationQuestions: ["Verify whether additional coaching subjects are offered."],
      facilityVerificationQuestions: ["Verify whether classroom facilities are available."],
    },
  },
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ workspace: { pendingBusinesses: { invalidate: mocks.invalidate }, adminOverview: { invalidate: mocks.invalidate } } }),
    workspace: {
      pendingBusinesses: { useQuery: () => ({ data: [business], isLoading: false }) },
      reviewBusiness: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: mocks.reviewBusiness, isPending: false, error: null }) },
    },
    aiContent: {
      batch: { useQuery: () => ({ data: undefined }) },
      generateSeoPack: { useMutation: () => ({ mutateAsync: mocks.generateSeoPack, isPending: false }) },
      bulkBestProfiles: { useMutation: () => ({ mutateAsync: mocks.bulkBestProfiles, isPending: false }) },
      applyBestProfile: { useMutation: () => ({ mutateAsync: mocks.applyBestProfile, isPending: false }) },
      revertBestProfile: { useMutation: () => ({ mutateAsync: mocks.revertBestProfile, isPending: false }) },
    },
  },
}));

import { DetailedApprovalManager } from "@/components/DetailedApprovalManager";

describe("durable administrator AI rewrite workflow", () => {
  it("queues a selected listing, opens its generated result in place, and offers a safe apply action", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<DetailedApprovalManager />); });

    const batchAction = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("Generate selected profiles")) as HTMLButtonElement;
    expect(batchAction.disabled).toBe(true);
    await act(async () => { (container.querySelector('input[type="checkbox"]') as HTMLInputElement).click(); });
    expect(batchAction.disabled).toBe(false);
    await act(async () => { batchAction.click(); });
    expect(mocks.bulkBestProfiles).toHaveBeenCalledWith({ businessIds: [901] });
    expect(container.textContent).toContain("queued in the background");

    const expand = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("Imported example")) as HTMLButtonElement;
    await act(async () => { expand.click(); });
    expect(container.textContent).toContain("Generated Best AI SEO Profile");
    expect(container.textContent).toContain("Service details to verify");
    expect(container.textContent).toContain("Rating (audit only)");
    const apply = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("Apply AI profile")) as HTMLButtonElement;
    await act(async () => { apply.click(); });
    expect(mocks.applyBestProfile).toHaveBeenCalledWith({ versionId: 11 });
    expect(container.textContent).toContain("revert to the original factual content");

    const approve = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("Approve listing")) as HTMLButtonElement;
    await act(async () => { approve.click(); });
    expect(document.body.textContent).toContain("Approve this listing?");
    expect(mocks.reviewBusiness).not.toHaveBeenCalled();
    const recordApproval = Array.from(document.body.querySelectorAll("button")).find(button => button.textContent?.includes("Record approval")) as HTMLButtonElement;
    await act(async () => { recordApproval.click(); });
    expect(mocks.reviewBusiness).toHaveBeenCalledWith({ businessId: 901, decision: "published" });
    expect(container.textContent).toContain("Decision record");

    await act(async () => { root.unmount(); });
    container.remove();
  });
});
