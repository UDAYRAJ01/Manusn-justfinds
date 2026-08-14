import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ArrowRight, Clock3, Crosshair, MapPin, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type RecentSearch = { query: string; city?: string; locality?: string };
const locationKey = "just-finds-location-context";
const recentKey = "just-finds-recent-searches";

function readLocationContext() { try { return JSON.parse(window.sessionStorage.getItem(locationKey) ?? "{}") as { city?: string; locality?: string }; } catch { return {}; } }
function readRecentSearches() { try { return JSON.parse(window.sessionStorage.getItem(recentKey) ?? "[]") as RecentSearch[]; } catch { return []; } }

export function SearchHero({ compact = false, initialQuery = "", initialCity, initialLocality }: { compact?: boolean; initialQuery?: string; initialCity?: string; initialLocality?: string }) {
  const [, setLocation] = useLocation();
  const storedLocation = useMemo(readLocationContext, []);
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity ?? storedLocation.city ?? "");
  const [locality, setLocality] = useState(initialLocality ?? storedLocation.locality ?? "");
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(initialQuery);
  const [gps, setGps] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [recents, setRecents] = useState<RecentSearch[]>(readRecentSearches);
  useEffect(() => { const timer = window.setTimeout(() => setDebounced(query), 220); return () => window.clearTimeout(timer); }, [query]);
  useEffect(() => { window.sessionStorage.setItem(locationKey, JSON.stringify({ city: city || undefined, locality: locality || undefined })); }, [city, locality]);
  const suggestionInput = useMemo(() => ({ query: debounced }), [debounced]);
  const localityInput = useMemo(() => ({ city }), [city]);
  const { data: suggestions } = trpc.discovery.suggestions.useQuery(suggestionInput);
  const { data: cities } = trpc.discovery.locations.useQuery();
  const { data: localities } = trpc.discovery.localities.useQuery(localityInput, { enabled: Boolean(city) });
  const submit = (value = query) => {
    const normalized = value.trim();
    const params = new URLSearchParams();
    if (normalized) params.set("q", normalized);
    if (city) params.set("city", city);
    if (locality) params.set("locality", locality);
    if (gps) { params.set("lat", gps.latitude.toString()); params.set("lng", gps.longitude.toString()); params.set("sort", "nearby"); }
    if (normalized) {
      const next = [{ query: normalized, city: city || undefined, locality: locality || undefined }, ...recents.filter(item => item.query.toLowerCase() !== normalized.toLowerCase())].slice(0, 6);
      setRecents(next);
      window.sessionStorage.setItem(recentKey, JSON.stringify(next));
    }
    setLocation(`/search?${params.toString()}`);
  };
  const useMyLocation = () => {
    if (!navigator.geolocation) { setLocationError("Location access is not supported in this browser."); return; }
    navigator.geolocation.getCurrentPosition(position => { setGps({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setLocationError(""); }, () => setLocationError("Location access was not granted. You can still choose a city or locality."), { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 });
  };
  const visibleSuggestions = (suggestions ?? []).map(suggestion => ({ label: suggestion.label, detail: suggestion.detail, kind: suggestion.kind }));
  const fallbackRecents = !debounced ? recents.map(item => ({ label: item.query, detail: [item.locality, item.city].filter(Boolean).join(" · ") || "Recent search", kind: "Recent" })) : [];

  return <div className={cn("relative", compact ? "" : "mx-auto max-w-5xl")}><div className={cn("relative grid overflow-visible rounded-[25px] border border-white/55 bg-white/95 p-2.5 shadow-[0_22px_55px_rgba(3,16,49,.20)] ring-1 ring-[#b8c8f3]/35 backdrop-blur", compact ? "sm:grid-cols-[minmax(0,1fr)_150px_150px_auto]" : "sm:grid-cols-[minmax(0,1fr)_160px_160px_auto]")}><div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#5b75bd]" /><Input value={query} onChange={event => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={event => { if (event.key === "Enter") submit(); }} placeholder="What are you looking for?" className="h-14 border-0 bg-transparent pl-12 text-base font-medium text-[#0e1b3d] shadow-none placeholder:text-slate-400 focus-visible:ring-0" aria-label="Search businesses, services, and categories" />{open && <div className="absolute inset-x-0 top-[calc(100%+12px)] z-30 overflow-hidden rounded-[20px] border border-[#d9e2f5] bg-white p-2 shadow-[0_22px_46px_rgba(15,23,42,.16)]"><div className="px-3 py-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#7082aa]">{debounced ? "Suggestions" : fallbackRecents.length ? "Recent searches" : "Start exploring"}</div>{[...visibleSuggestions, ...fallbackRecents].slice(0, 8).map((suggestion, index) => <button key={`${suggestion.kind}-${suggestion.label}-${index}`} onMouseDown={event => event.preventDefault()} onClick={() => { setQuery(suggestion.label); setOpen(false); submit(suggestion.label); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#f1f5ff]"><span className="grid size-8 place-items-center rounded-lg bg-[#edf2ff] text-[#2559d6]">{suggestion.kind === "Recent" ? <Clock3 className="size-4" /> : suggestion.kind === "Business" ? <MapPin className="size-4" /> : <Sparkles className="size-4" />}</span><span><span className="block text-sm font-semibold text-[#182646]">{suggestion.label}</span><span className="block text-xs text-slate-500">{suggestion.detail}</span></span></button>)}</div>}</div><label className="flex min-w-0 items-center border-t border-[#edf0f6] px-2 sm:border-l sm:border-t-0"><MapPin className="mr-1.5 size-4 shrink-0 text-[#d46847]" /><span className="sr-only">City</span><select value={city} onChange={event => { setCity(event.target.value); setLocality(""); }} className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#32415f] outline-none"><option value="">All cities</option>{(cities ?? []).map(item => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label><label className="flex min-w-0 items-center border-t border-[#edf0f6] px-2 sm:border-l sm:border-t-0"><span className="sr-only">Locality</span><select value={locality} disabled={!city} onChange={event => setLocality(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#32415f] outline-none disabled:cursor-not-allowed disabled:text-slate-400"><option value="">{city ? "All localities" : "Choose city first"}</option>{(localities ?? []).map(item => <option key={item.id} value={item.slug}>{item.name}</option>)}</select><button type="button" onClick={useMyLocation} className="rounded-lg p-2 text-[#2559d6] hover:bg-[#edf2ff]" title="Use my location" aria-label="Use my location"><Crosshair className="size-4" /></button></label><Button onClick={() => submit()} aria-label="Search local businesses" className="h-12 rounded-[15px] bg-[#2559d6] px-5 font-semibold shadow-[0_8px_18px_rgba(37,89,214,.30)] hover:bg-[#1f4fc8]"><span className="hidden sm:inline">Search</span><ArrowRight className="size-4 sm:ml-1" /></Button></div>{locationError && <p className="mt-2 flex items-center gap-1.5 text-xs text-[#a54830]"><MapPin className="size-3.5" />{locationError}</p>}{gps && <p className="mt-2 text-xs font-medium text-emerald-700">Using your approximate location to prioritize nearby results.</p>}</div>;
}
