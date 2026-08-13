// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  submit: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ workspace: { ownerOverview: { invalidate: mocks.invalidate } } }),
    discovery: {
      categories: { useQuery: () => ({ data: [{ id: 1, name: "Validation category" }] }) },
      locations: { useQuery: () => ({ data: [{ id: 2, name: "Validation city" }] }) },
      categoryFields: { useQuery: () => ({ data: [] }) },
    },
    workspace: {
      createBusiness: { useMutation: () => ({ mutate: mocks.create, isPending: false, isSuccess: false, error: null }) },
      submitBusiness: { useMutation: () => ({ mutate: mocks.submit, isPending: false, error: null }) },
    },
  },
}));

import { BusinessRow, ProfileForm } from "./OwnerWorkspace";

function setField(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(element, value);
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
}

describe("guided owner onboarding interface", () => {
  it("allows a factual coordinate-verified draft to be saved and exposes the review-submission action for that draft", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<ProfileForm />); });

    await act(async () => {
      setField(container.querySelector('[placeholder="Your business name"]')!, "Owner onboarding validation record");
      setField(container.querySelector('[placeholder="your-business"]')!, "owner-onboarding-validation");
      const selects = Array.from(container.querySelectorAll("select"));
      setField(selects[0], "1");
      setField(selects[1], "2");
      setField(container.querySelector('[placeholder="Street, locality, city"]')!, "Owner-supplied validation address");
      setField(container.querySelector("textarea")!, "Factual owner-supplied description prepared solely for administrator moderation review.");
      setField(container.querySelector('[placeholder="e.g. 18.520430"]')!, "18.520430");
      setField(container.querySelector('[placeholder="e.g. 73.856744"]')!, "73.856744");
    });
    const save = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("Save guided private draft")) as HTMLButtonElement;
    expect(save.disabled).toBe(false);
    await act(async () => { save.click(); });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      name: "Owner onboarding validation record",
      slug: "owner-onboarding-validation",
      categoryId: 1,
      cityId: 2,
      latitude: "18.520430",
      longitude: "73.856744",
    }));

    await act(async () => { root.render(<BusinessRow business={{ id: 91, name: "Owner onboarding validation record", status: "draft", shortDescription: "Factual owner-supplied description prepared solely for administrator moderation review.", phone: null, email: null }} />); });
    const submit = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("Submit for review")) as HTMLButtonElement;
    await act(async () => { submit.click(); });
    expect(mocks.submit).toHaveBeenCalledWith({ businessId: 91 });
    await act(async () => { root.unmount(); });
    container.remove();
  });
});
