import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ArrowRight, Clock3, Crosshair, MapPin, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

export function SearchHero({ compact = false, initialQuery = "" }: { compact?: boolean; initialQuery?: string }) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState("Kanpur");
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(initialQuery);
  const [gps, setGps] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => setDebounced(query), 180); return () => window.clearTimeout(timer); }, [query]);
  const suggestionInput = useMemo(() => ({ query: debounced }), [debounced]);
  const { data: suggestions } = trpc.discovery.suggestions.useQuery(suggestionInput);
  const submit = (value = query) => {
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    if (city) params.set("city", city.toLowerCase().replace(/\s+/g, "-"));
    if (gps) { params.set("lat", gps.latitude.toString()); params.set("lng", gps.longitude.toString()); }
    setLocation(`/search?${params.toString()}`);
  };
  const useMyLocation = () => {
    if (!navigator.geolocation) { setLocationError("Location access is not supported in this browser."); return; }
    navigator.geolocation.getCurrentPosition(
      position => { setGps({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setLocationError(""); },
      () => setLocationError("Location access was not granted. You can still search by city."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  };
  return <div className={cn("relative", compact ? "" : "mx-auto max-w-4xl")}>
    <div className={cn("relative grid overflow-visible rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_18px_55px_rgba(15,23,42,.12)]", compact ? "sm:grid-cols-[1fr_180px_auto]" : "sm:grid-cols-[1fr_200px_auto]")}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
        <Input value={query} onChange={event => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={event => { if (event.key === "Enter") submit(); }} placeholder="What are you looking for?" className="h-14 border-0 bg-transparent pl-12 text-base shadow-none placeholder:text-slate-400 focus-visible:ring-0" aria-label="Search businesses, services, and categories" />
        {open && <div className="absolute inset-x-0 top-[calc(100%+10px)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_22px_46px_rgba(15,23,42,.16)]">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[.12em] text-slate-400">{debounced ? "Suggestions" : "Explore faster"}</div>
          {(suggestions ?? []).map((suggestion, index) => <button key={`${suggestion.kind}-${suggestion.label}-${index}`} onMouseDown={event => event.preventDefault()} onClick={() => { setQuery(suggestion.label); setOpen(false); submit(suggestion.label); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-blue-50"><span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-[#1f51c8]">{suggestion.kind === "Popular" ? <Sparkles className="size-4" /> : suggestion.kind === "Business" ? <Clock3 className="size-4" /> : <Search className="size-4" />}</span><span><span className="block text-sm font-medium text-slate-800">{suggestion.label}</span><span className="block text-xs text-slate-500">{suggestion.detail}</span></span></button>)}
        </div>}
      </div>
      <div className="flex items-center border-t border-slate-100 px-3 sm:border-l sm:border-t-0">
        <MapPin className="mr-2 size-4 shrink-0 text-[#d25b3f]" />
        <input value={city} onChange={event => setCity(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none" aria-label="Search city" />
        <button onClick={useMyLocation} className="rounded-lg p-2 text-[#1f51c8] hover:bg-blue-50" title="Use my location" aria-label="Use my location"><Crosshair className="size-4" /></button>
      </div>
      <Button onClick={() => submit()} className="h-12 rounded-xl bg-[#173d9c] px-5 shadow-[0_8px_18px_rgba(23,61,156,.24)] hover:bg-[#123587]"><span className="hidden sm:inline">Search</span><ArrowRight className="size-4 sm:ml-1" /></Button>
    </div>
    {locationError && <p className="mt-2 flex items-center gap-1.5 text-xs text-[#a54830]"><MapPin className="size-3.5" />{locationError}</p>}
    {gps && <p className="mt-2 text-xs text-emerald-700">Using your approximate location to prioritize nearby results.</p>}
  </div>;
}
