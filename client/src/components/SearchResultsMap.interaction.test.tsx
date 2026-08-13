/** @vitest-environment jsdom */
import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/Map", () => ({
  MapView: (() => {
    let initialized = false;
    const host = document.createElement("div");
    class Bounds { extend() {} }
    class Marker {
      private currentMap: unknown;
      private readonly content?: Node;
      set map(value: unknown) {
        this.currentMap = value;
        if (value === null) this.content?.parentNode?.removeChild(this.content);
      }
      get map() { return this.currentMap; }
      constructor(options?: google.maps.marker.AdvancedMarkerElementOptions) {
        this.content = options?.content as Node | undefined;
        this.map = options?.map;
        const markerMap = options?.map as unknown as { host?: HTMLElement } | undefined;
        if (markerMap?.host && this.content) markerMap.host.append(this.content);
      }
    }
    (window as unknown as { google: any }).google = { maps: { LatLngBounds: Bounds, marker: { AdvancedMarkerElement: Marker } } };
    return ({ onMapReady }: { onMapReady: (map: unknown) => void }) => {
      if (!initialized) {
        initialized = true;
        host.dataset.markerHost = "true";
        document.body.append(host);
        onMapReady({ fitBounds: vi.fn(), host });
      }
      return <div data-testid="managed-map" />;
    };
  })(),
}));

import { SearchResultsMap, type SearchMapItem } from "./SearchResultsMap";

const mappedItem: SearchMapItem = { id: 22, name: "Mapped listing", locality: "Central", city: "Example", latitude: 26.45, longitude: 80.33 };
const mapItems = [mappedItem];

function SelectionHarness() {
  const [selectedId, setSelectedId] = useState<number>();
  return <><button data-testid="list-result" onClick={() => setSelectedId(mappedItem.id)}>Select list result</button><output data-testid="selected-id">{selectedId ?? "none"}</output><SearchResultsMap items={mapItems} selectedId={selectedId} onSelect={setSelectedId} /></>;
}

describe("search result map/list synchronization", () => {
  it("keeps list-originated and map-originated selections in one shared state", async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => { root.render(<SelectionHarness />); });

    const marker = document.querySelector<HTMLButtonElement>('[aria-label="Show Mapped listing in results"]');
    expect(marker).not.toBeNull();
    expect(marker?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => { (container.querySelector('[data-testid="list-result"]') as HTMLButtonElement).click(); });
    expect(container.querySelector('[data-testid="selected-id"]')?.textContent).toBe("22");
    expect(marker?.className).toContain("bg-[#173d9c]");
    expect(marker?.getAttribute("aria-pressed")).toBe("true");

    await act(async () => { marker?.click(); });
    expect(container.querySelector('[data-testid="selected-id"]')?.textContent).toBe("22");
    await act(async () => { root.unmount(); });
    container.remove();
    document.querySelectorAll("[data-marker-host]").forEach(node => node.remove());
  });
});
