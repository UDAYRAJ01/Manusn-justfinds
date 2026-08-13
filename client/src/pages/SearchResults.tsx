import { BusinessCard, type BusinessCardData } from "@/components/BusinessCard";
import { PageFrame } from "@/components/PageFrame";
import { SearchHero } from "@/components/SearchHero";
import { SearchResultsMap } from "@/components/SearchResultsMap";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { CircleAlert, Map, SearchX, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

type SearchSort = "nearby" | "rating" | "recommended";
type SearchResultItem = BusinessCardData & { latitude: number | null; longitude: number | null };

function getSessionId() {
  const key = "just-finds-search-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const sessionId = window.crypto?.randomUUID?.() ?? `session-${Date.now()}`;
  window.sessionStorage.setItem(key, sessionId);
  return sessionId;
}

export default function SearchResults() {
  const [location, setLocation] = useLocation();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] ?? ""), [location]);
  const query = params.get("q") ?? "";
  const city = params.get("city") ?? undefined;
  const locality = params.get("locality") ?? undefined;
  const category = params.get("category") ?? undefined;
  const subcategory = params.get("subcategory") ?? undefined;
  const latitude = params.get("lat") ? Number(params.get("lat")) : undefined;
  const longitude = params.get("lng") ? Number(params.get("lng")) : undefined;
  const sort = (params.get("sort") as SearchSort | null) ?? (latitude !== undefined && longitude !== undefined ? "nearby" : "recommended");
  const verified = params.get("verified") === "1";
  const [sessionId] = useState(getSessionId);
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<SearchResultItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const input = useMemo(() => ({ query, city, locality, category, subcategory, latitude, longitude, sort, verified: verified || undefined, sessionId, offset, limit: 10 }), [query, city, locality, category, subcategory, latitude, longitude, sort, verified, sessionId, offset]);
  const { data, isLoading, isFetching, error } = trpc.discovery.search.useQuery(input);
  const interaction = trpc.discovery.interaction.useMutation();

  useEffect(() => { setOffset(0); setItems([]); setTotal(null); setSelectedId(undefined); }, [query, city, locality, category, subcategory, latitude, longitude, sort, verified]);
  useEffect(() => {
    if (!data) return;
    setItems(previous => offset === 0 ? data.items : [...previous, ...data.items.filter(item => !previous.some(existing => existing.id === item.id))] as SearchResultItem[]);
    if (data.total !== null) setTotal(data.total);
  }, [data, offset]);

  const triggerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !data?.nextOffset) return;
    const observer = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting && !isFetching) setOffset(data.nextOffset ?? 0); }, { rootMargin: "240px" });
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [data?.nextOffset, isFetching]);

  const updateSearch = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    setLocation(`/search?${next.toString()}`);
  };
  const selectOnMap = (id: number) => {
    setSelectedId(id);
    document.getElementById(`listing-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const recordInteraction = (businessId: number, action: "click" | "call" | "whatsapp" | "directions" | "website") => interaction.mutate({ businessId, action, query, sessionId });
  const headingLocation = locality?.replace(/-/g, " ") ?? city?.replace(/-/g, " ") ?? (latitude !== undefined ? "your area" : "all locations");

  return <PageFrame className="bg-white"><section className="border-b border-slate-200 bg-[#f8f8f6] py-5"><div className="container"><SearchHero compact initialQuery={query} initialCity={city} initialLocality={locality} /></div></section><section className="container py-8 sm:py-10"><div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>Home</span><span>/</span><span>Explore</span><span>/</span><span className="font-medium text-slate-700">{query || "Local discovery"}</span></div><div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="eyebrow">Local search</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] text-slate-950 sm:text-4xl">{query ? `${query} in ${headingLocation}` : `Places in ${headingLocation}`}</h1><p className="mt-3 text-sm text-slate-500">{total === null ? "Finding" : total} {total === 1 ? "published profile" : "published profiles"} ranked with the available location and quality signals.</p></div><div className="flex items-center gap-2"><Button onClick={() => setMapOpen(value => !value)} variant="outline" className="rounded-xl bg-white lg:hidden"><Map className="mr-2 size-4" />{mapOpen ? "List view" : "Map view"}</Button><Button variant="outline" className="rounded-xl bg-white" onClick={() => document.getElementById("search-filters")?.scrollIntoView({ behavior: "smooth", block: "nearest" })}><SlidersHorizontal className="mr-2 size-4" />Filters</Button></div></div><div id="search-filters" className="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Search result filters"><button onClick={() => updateSearch({ sort: "recommended" })} className={filterClass(sort === "recommended")}>Recommended</button><button disabled={latitude === undefined || longitude === undefined} onClick={() => updateSearch({ sort: "nearby" })} className={filterClass(sort === "nearby", latitude === undefined || longitude === undefined)}>Nearby</button><button onClick={() => updateSearch({ sort: "rating" })} className={filterClass(sort === "rating")}>Reputation score</button><button onClick={() => updateSearch({ verified: verified ? undefined : "1" })} className={filterClass(verified)}>Verified</button></div><p className="mt-2 text-xs text-slate-500">{latitude === undefined || longitude === undefined ? "Enable location in search to sort by nearest verified coordinates." : "Nearby results are sorted from your approximate location."}</p><div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><div className={cn("grid gap-4", mapOpen && "hidden lg:grid")}>{error ? <ErrorState message="Search is temporarily unavailable. Please try again." /> : isLoading && items.length === 0 ? [...Array(3)].map((_, index) => <div key={index} className="h-48 animate-pulse rounded-3xl bg-slate-100" />) : items.length ? items.map((item, index) => <div id={`listing-${item.id}`} key={item.id} onClick={() => selectOnMap(item.id)} className={cn("rounded-[24px] transition-shadow", selectedId === item.id && "ring-2 ring-[#1f51c8] ring-offset-2")}><BusinessCard item={item} imageIndex={index} onInteraction={recordInteraction} /></div>) : <EmptyState />}{data?.nextOffset && <div ref={triggerRef} className="py-3 text-center text-sm text-slate-400">{isFetching ? "Finding more businesses…" : "Scroll to load more"}</div>}{!data?.nextOffset && items.length > 0 && <p className="py-3 text-center text-sm text-slate-400">You’ve reached the end of these results.</p>}</div><aside className={cn("overflow-hidden rounded-[24px] border border-slate-200 bg-[#eef3ff] p-4 lg:sticky lg:top-24 lg:h-[500px]", mapOpen ? "block" : "hidden lg:block")}><div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold text-slate-800">Managed map</span><Map className="size-4 text-[#1f51c8]" /></div><SearchResultsMap items={items} selectedId={selectedId} onSelect={selectOnMap} /></aside></div></section></PageFrame>;
}

function filterClass(active: boolean, disabled = false) { return cn("whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors", active ? "border-[#173d9c] bg-[#173d9c] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300", disabled && "cursor-not-allowed opacity-45 hover:border-slate-200"); }
function EmptyState() { return <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-9 text-center"><SearchX className="mx-auto size-8 text-slate-400" /><h2 className="mt-3 font-semibold text-slate-800">No published profiles match this search</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Try a different search term, remove a filter, or choose another city.</p></div>; }
function ErrorState({ message }: { message: string }) { return <div className="rounded-[24px] border border-orange-200 bg-orange-50 p-7 text-center"><CircleAlert className="mx-auto size-7 text-orange-600" /><p className="mt-3 text-sm font-medium text-orange-900">{message}</p></div>; }
