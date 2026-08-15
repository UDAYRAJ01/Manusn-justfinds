/** @vitest-environment jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/usePersistFn", () => ({
  usePersistFn: <T extends (...args: never[]) => unknown>(callback: T) => callback,
}));

import { MapView } from "./Map";

describe("MapView", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "google", { configurable: true, value: undefined, writable: true });
    document.querySelectorAll('script[data-just-finds-map-proxy="true"]').forEach((node) => node.remove());
  });

  it("shows a factual fallback when the external map script cannot load", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const appendChild = vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
      if (node instanceof HTMLScriptElement) queueMicrotask(() => node.onerror?.(new Event("error")));
      return node;
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<MapView initialCenter={{ lat: 26.4499, lng: 80.3319 }} />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Map is temporarily unavailable");
    expect(container.textContent).toContain("address, location, and directions details");
    expect(appendChild).toHaveBeenCalled();

    await act(async () => root.unmount());
    container.remove();
  });
});
