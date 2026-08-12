import { BusinessCard, BusinessCardData } from "@/components/BusinessCard";
import { PageFrame } from "@/components/PageFrame";
import { SearchHero } from "@/components/SearchHero";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ChevronDown, CircleAlert, ListFilter, Map, MapPin, SearchX, SlidersHorizontal, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

const filterOptions = ["Nearby", "Recommended", "Open now", "Verified"];

export default function SearchResults() {
  const [location] = useLocation();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] ?? ""), [location]);
  const query = params.get("q") ?? "";
  const city = params.get("city") ?? undefined;
  const latitude = params.get("lat") ? Number(params.get("lat")) : undefined;
  const longitude = params.get("lng") ? Number(params.get("lng")) : undefined;
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<BusinessCardData[]>([]);
  const [activeFilter, setActiveFilter] = useState("Recommended");
  const [mapOpen, setMapOpen] = useState(false);
  const input = useMemo(() => ({ query, city, latitude, longitude, offset, limit: 10 }), [query, city, latitude, longitude, offset]);
  const { data, isLoading, isFetching, error } = trpc.discovery.search.useQuery(input);
  useEffect(() => { setOffset(0); setItems([]); }, [query, city, latitude, longitude]);
  useEffect(() => { if (!data) return; setItems(previous => offset === 0 ? data.items : [...previous, ...data.items.filter(item => !previous.some(existing => existing.id === item.id))] as BusinessCardData[]); }, [data, offset]);
  const triggerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !data?.nextOffset) return;
    const observer = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting && !isFetching) setOffset(data.nextOffset ?? 0); }, { rootMargin: "240px" });
    observer.observe(trigger); return () => observer.disconnect();
  }, [data?.nextOffset, isFetching]);
  const visibleItems = items.filter(item => activeFilter !== "Open now" || item.openNow).filter(item => activeFilter !== "Verified" || item.verified);
  return <PageFrame className="bg-white"><section className="border-b border-slate-200 bg-[#f8f8f6] py-5"><div className="container"><SearchHero compact initialQuery={query} /></div></section><section className="container py-8 sm:py-10"><div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>Home</span><span>/</span><span>Explore</span><span>/</span><span className="font-medium text-slate-700">{query || "Nearby businesses"}</span></div><div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="eyebrow">Local search</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] text-slate-950 sm:text-4xl">{query ? `${query} in ${city ? city.replace(/-/g, " ") : "your area"}` : `Places near ${city ? city.replace(/-/g, " ") : "you"}`}</h1><p className="mt-3 text-sm text-slate-500">{data?.total ?? "…"} discovery-ready profiles ranked by relevance, distance, and profile quality.</p></div><div className="flex items-center gap-2"><Button onClick={() => setMapOpen(value => !value)} variant="outline" className="rounded-xl bg-white"><Map className="mr-2 size-4" />{mapOpen ? "List view" : "Map view"}</Button><Button variant="outline" className="rounded-xl bg-white"><SlidersHorizontal className="mr-2 size-4" />Filters</Button></div></div><div className="mt-6 flex gap-2 overflow-x-auto pb-1">{filterOptions.map(filter => <button key={filter} onClick={() => setActiveFilter(filter)} className={cn("whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors", activeFilter === filter ? "border-[#173d9c] bg-[#173d9c] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>{filter}</button>)}<button className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600"><ListFilter className="size-3.5" />More <ChevronDown className="size-3.5" /></button></div><div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"> <div className="grid gap-4">{error ? <ErrorState message="Search is temporarily unavailable. Please try again." /> : isLoading && items.length === 0 ? [...Array(3)].map((_, index) => <div key={index} className="h-48 animate-pulse rounded-3xl bg-slate-100" />) : visibleItems.length ? visibleItems.map((item, index) => <BusinessCard key={item.id} item={item} imageIndex={index} />) : <EmptyState />}{data?.nextOffset && <div ref={triggerRef} className="py-3 text-center text-sm text-slate-400">{isFetching ? "Finding more nearby businesses…" : "Scroll to load more"}</div>}{!data?.nextOffset && items.length > 0 && <p className="py-3 text-center text-sm text-slate-400">You’ve reached the end of these results.</p>}</div><aside className={cn("overflow-hidden rounded-[24px] border border-slate-200 bg-[#eef3ff] p-5 lg:sticky lg:top-24 lg:h-[500px]", mapOpen ? "block" : "hidden lg:block")}><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-800">Map preview</span><MapPin className="size-4 text-[#d25b3f]" /></div><div className="relative mt-4 h-[390px] overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_30%_30%,#ffffff_0,#ffffff_7%,transparent_7%),radial-gradient(circle_at_80%_20%,#ffffff_0,#ffffff_5%,transparent_5%),linear-gradient(135deg,#dce9d6_0%,#dce9d6_40%,#d9e6f5_40%,#d9e6f5_100%)]"><div className="absolute -left-10 top-[46%] h-6 w-[130%] rotate-[-18deg] rounded-full bg-white/80" /><div className="absolute left-[37%] top-[24%] h-[110%] w-5 rotate-[30deg] rounded-full bg-white/70" /><MapPin className="absolute left-[43%] top-[42%] size-10 fill-[#d76546] text-[#d76546] drop-shadow-md" /><MapPin className="absolute left-[21%] top-[62%] size-7 fill-[#1f51c8] text-[#1f51c8] drop-shadow-md" /><MapPin className="absolute right-[20%] top-[24%] size-7 fill-[#1f51c8] text-[#1f51c8] drop-shadow-md" /><div className="absolute inset-x-3 bottom-3 rounded-xl bg-white/90 p-3 shadow-sm backdrop-blur"><p className="text-xs font-semibold text-slate-800">{visibleItems[0]?.name ?? "Nearby discovery"}</p><p className="mt-1 text-xs text-slate-500">{visibleItems[0]?.locality ?? "Search results"}</p></div></div></aside></div></section></PageFrame>;
}
function EmptyState() { return <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-9 text-center"><SearchX className="mx-auto size-8 text-slate-400" /><h2 className="mt-3 font-semibold text-slate-800">No matches for these filters</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Try removing a filter, searching another term, or choosing a different city.</p></div>; }
function ErrorState({ message }: { message: string }) { return <div className="rounded-[24px] border border-orange-200 bg-orange-50 p-7 text-center"><CircleAlert className="mx-auto size-7 text-orange-600" /><p className="mt-3 text-sm font-medium text-orange-900">{message}</p></div>; }
