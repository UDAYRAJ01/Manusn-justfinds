// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ save: vi.fn(), publish: vi.fn(), suggest: vi.fn(), generateDraft: vi.fn(), regenerateSection: vi.fn(), suggestSectionImages: vi.fn(), apply: vi.fn(), reject: vi.fn(), submitReview: vi.fn(), invalidate: vi.fn() }));

vi.mock("@/components/WebsiteRenderer", () => ({ default: ({ data }: { data: { business: { name: string } } }) => <div data-testid="shared-renderer">{data.business.name}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ website: { builder: { invalidate: mocks.invalidate } } }),
    website: {
      builder: { useQuery: () => ({ data: { page: { id: 7, seoTitle: null, metaDescription: null }, business: { id: 5, name: "Test business", shortDescription: "Factual description" }, sections: [{ id: 1, sectionType: "hero", displayOrder: 0, enabled: true, config: {} }, { id: 2, sectionType: "about", displayOrder: 1, enabled: true, config: {} }], versions: [], designConfig: { theme: "modern", radius: "lg" }, registry: [{ type: "hero", label: "Hero", allowedCategories: ["all"] }, { type: "about", label: "About", allowedCategories: ["all"] }] } }) },
      saveDraft: { useMutation: () => ({ mutate: mocks.save, isPending: false, error: null }) },
      publish: { useMutation: () => ({ mutate: mocks.publish, isPending: false, error: null }) },
      suggestRedesign: { useMutation: () => ({ mutate: mocks.suggest, isPending: false, error: null }) },
      generateDraft: { useMutation: () => ({ mutate: mocks.generateDraft, isPending: false, error: null }) },
      regenerateSection: { useMutation: () => ({ mutate: mocks.regenerateSection, isPending: false, error: null }) },
      suggestSectionImages: { useMutation: () => ({ mutate: mocks.suggestSectionImages, isPending: false, error: null }) },
      applyRedesign: { useMutation: () => ({ mutate: mocks.apply, isPending: false, error: null }) },
      rejectRedesign: { useMutation: () => ({ mutate: mocks.reject, isPending: false, error: null }) },
      submitForReview: { useMutation: () => ({ mutate: mocks.submitReview, isPending: false, error: null }) },
    },
    business: {
      businessDetail: { useQuery: () => ({ data: { business: { id: 5, name: "Test business", shortDescription: "Factual description", address: "Owner-supplied address" }, services: [], images: [] } }) },
    },
  },
}));

import WebsiteBuilder, { canSaveWebsiteDraft, restorePreviewDesign } from "./WebsiteBuilder";

describe("WebsiteBuilder section interactions", () => {
  it("restores the exact pre-preview design and dirty state when rejecting", () => {
    const previous = { theme: "editorial", primary: "#123456" };
    expect(restorePreviewDesign(previous, true)).toEqual({ design: previous, dirty: true });
    expect(restorePreviewDesign(null, false)).toEqual({ design: null, dirty: false });
  });
  it("allows a default website page with no versions to create its first draft without a manual design edit", () => {
    expect(canSaveWebsiteDraft(false, 0)).toBe(true);
    expect(canSaveWebsiteDraft(false, 1)).toBe(false);
    expect(canSaveWebsiteDraft(true, 1)).toBe(true);
  });
  it("submits the default sections and design when creating an initial draft", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    mocks.save.mockClear();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<WebsiteBuilder businessId={5} />); });
    const createDraft = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "Create first draft") as HTMLButtonElement;
    expect(createDraft).toBeTruthy();
    expect(createDraft.disabled).toBe(false);
    await act(async () => { createDraft.click(); });
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ businessId: 5, sections: expect.arrayContaining([expect.objectContaining({ sectionType: "hero", enabled: true })]), designConfig: expect.objectContaining({ theme: "modern" }) }));
    await act(async () => { root.unmount(); });
    container.remove();
  });
  it("marks the selected mobile preview mode and live canvas state", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<WebsiteBuilder businessId={5} />); });
    const mobile = container.querySelector('button[aria-label="Show mobile preview"]') as HTMLButtonElement;
    const desktop = container.querySelector('button[aria-label="Show desktop preview"]') as HTMLButtonElement;
    expect(desktop.getAttribute("aria-pressed")).toBe("true");
    expect(mobile.getAttribute("aria-pressed")).toBe("false");
    expect(mobile.textContent).toContain("Mobile");
    expect(desktop.textContent).toContain("Desktop");
    await act(async () => { mobile.click(); });
    expect(mobile.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('[data-preview-mode="mobile"]')).toBeTruthy();
    await act(async () => { root.unmount(); });
    container.remove();
  });
  it("selects a section without toggling it and exposes an explicit hide action", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<WebsiteBuilder businessId={5} />); });
    const about = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "about") as HTMLButtonElement;
    expect(about).toBeTruthy();
    await act(async () => { about.click(); });
    expect(container.textContent).toContain("Contextual inspector");
    expect(container.textContent).toContain("Section label");
    const hide = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "Hide") as HTMLButtonElement;
    expect(hide).toBeTruthy();
    await act(async () => { hide.click(); });
    expect(container.textContent).toContain("Unsaved changes");
    expect(container.textContent).toContain("Show");
    await act(async () => { root.unmount(); });
    container.remove();
  });
  it("sends the owner's own prompt when refining a specific section and requesting photo suggestions", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    mocks.regenerateSection.mockClear();
    mocks.suggestSectionImages.mockClear();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<WebsiteBuilder businessId={5} />); });
    const about = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "about") as HTMLButtonElement;
    await act(async () => { about.click(); });
    const promptInput = Array.from(container.querySelectorAll("input")).find(input => input.placeholder === "Make this clearer and shorter") as HTMLInputElement;
    expect(promptInput).toBeTruthy();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    await act(async () => {
      setter?.call(promptInput, "Rewrite this section for first-time visitors");
      promptInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const refine = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("Refine section with AI")) as HTMLButtonElement;
    await act(async () => { refine.click(); });
    expect(mocks.regenerateSection).toHaveBeenCalledWith(expect.objectContaining({ businessId: 5, sectionType: "about", instruction: "Rewrite this section for first-time visitors" }));
    const suggestPhotos = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("Suggest photos with AI")) as HTMLButtonElement;
    expect(suggestPhotos).toBeTruthy();
    await act(async () => { suggestPhotos.click(); });
    expect(mocks.suggestSectionImages).toHaveBeenCalledWith(expect.objectContaining({ businessId: 5, sectionType: "about" }));
    await act(async () => { root.unmount(); });
    container.remove();
  });
  it("keeps all responsive device labels visible and separates protected listing facts from design inputs", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<WebsiteBuilder businessId={5} />); });
    expect(container.textContent).toContain("Desktop");
    expect(container.textContent).toContain("Tablet");
    expect(container.textContent).toContain("Mobile");
    expect(container.textContent).toContain("Protected business facts");
    expect(container.textContent).toContain("Read-only in Website Builder");
    expect(container.querySelector('input[value="Test business"]')).toBeNull();
    expect(container.querySelector('input[value="Owner-supplied address"]')).toBeNull();
    await act(async () => { root.unmount(); });
    container.remove();
  });
  it("keeps publishing gated behind a saved draft and explains the protected-facts boundary in confirmation", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<WebsiteBuilder businessId={5} />); });
    const publishButton = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "Publish website") as HTMLButtonElement;
    expect(publishButton).toBeTruthy();
    expect(publishButton.disabled).toBe(true);
    expect(container.textContent).toContain("Publishing");
    await act(async () => { root.unmount(); });
    container.remove();
  });
});
