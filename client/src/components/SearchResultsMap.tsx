import { MapView } from "@/components/Map";
import { cn } from "@/lib/utils";
import { MapPin, MapPinned } from "lucide-react";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export type SearchMapItem = {
  id: number;
  name: string;
  locality: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
};

type CoordinateMapItem = SearchMapItem & { latitude: number; longitude: number };

export function hasCoordinates(item: SearchMapItem): item is CoordinateMapItem {
  return Number.isFinite(item.latitude) && Number.isFinite(item.longitude);
}

export function markerClassName(selected: boolean) {
  return cn("grid size-9 place-items-center rounded-full border-2 border-white text-white shadow-lg transition-transform", selected ? "scale-110 bg-[#173d9c]" : "bg-[#d25b3f]");
}

export function SearchResultsMap({ items, selectedId, onSelect }: { items: SearchMapItem[]; selectedId?: number; onSelect: (id: number) => void }) {
  const [loadFailed, setLoadFailed] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<Array<{ id: number; marker: google.maps.marker.AdvancedMarkerElement; pin: HTMLButtonElement }>>([]);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const mapItems = useMemo(() => items.filter(hasCoordinates), [items]);
  useLayoutEffect(() => { selectedRef.current = selectedId; markerRefs.current.forEach(binding => { binding.pin.className = markerClassName(binding.id === selectedId); binding.pin.setAttribute("aria-pressed", String(binding.id === selectedId)); }); }, [selectedId]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  const renderMarkers = useCallback((map: google.maps.Map) => {
    markerRefs.current.forEach(binding => { binding.marker.map = null; });
    markerRefs.current = mapItems.map(item => {
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = markerClassName(item.id === selectedRef.current);
      pin.setAttribute("aria-label", `Show ${item.name} in results`);
      pin.setAttribute("aria-pressed", String(item.id === selectedRef.current));
      pin.innerHTML = "<span aria-hidden=\"true\">●</span>";
      pin.addEventListener("click", () => onSelectRef.current(item.id));
      const marker = new window.google!.maps.marker.AdvancedMarkerElement({ map, position: { lat: item.latitude, lng: item.longitude }, title: item.name, content: pin });
      return { id: item.id, marker, pin };
    });
    if (mapItems.length > 1) {
      const bounds = new window.google!.maps.LatLngBounds();
      mapItems.forEach(item => bounds.extend({ lat: item.latitude, lng: item.longitude }));
      map.fitBounds(bounds, 44);
    }
  }, [mapItems]);
  useEffect(() => { if (mapRef.current) renderMarkers(mapRef.current); }, [renderMarkers]);

  if (!mapItems.length) {
    return <div className="grid h-full min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><div><MapPinned className="mx-auto size-7 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-700">Map unavailable for these results</p><p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-500">Published listings need verified coordinates before they can appear on the managed map.</p></div></div>;
  }

  const center = { lat: mapItems[0].latitude, lng: mapItems[0].longitude };
  return <div className="relative h-full min-h-[390px] overflow-hidden rounded-2xl bg-slate-100">
    {loadFailed ? <div className="grid h-full place-items-center p-6 text-center"><div><MapPinned className="mx-auto size-7 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-700">Managed map is unavailable right now</p><p className="mt-2 text-xs leading-5 text-slate-500">You can still open directions from each listing.</p></div></div> : <MapView className="h-full min-h-[390px]" initialCenter={center} initialZoom={12} onLoadError={() => setLoadFailed(true)} onMapReady={map => { mapRef.current = map; renderMarkers(map); }} />}
    {!loadFailed && <div className="absolute inset-x-3 bottom-3 max-h-28 overflow-auto rounded-xl bg-white/95 p-2 shadow-sm backdrop-blur"><div className="flex items-center gap-1.5 px-2 pb-1 text-[11px] font-semibold uppercase tracking-[.08em] text-slate-500"><MapPin className="size-3.5 text-[#d25b3f]" />Mapped listings</div>{mapItems.map(item => <button key={item.id} onClick={() => onSelect(item.id)} className={cn("flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs", selectedId === item.id ? "bg-blue-50 text-[#173d9c]" : "text-slate-700 hover:bg-slate-50")}><span className="truncate font-medium">{item.name}</span><span className="ml-3 shrink-0 text-slate-400">{item.locality}</span></button>)}</div>}
  </div>;
}
