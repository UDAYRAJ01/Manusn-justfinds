import { BusinessCard, type BusinessCardData } from "@/components/BusinessCard";
import { PageFrame } from "@/components/PageFrame";
import { SearchHero } from "@/components/SearchHero";
import { SearchResultsMap } from "@/components/SearchResultsMap";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getSearchQueryParams } from "@/lib/searchQuery";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ArrowDownUp, Check, CircleAlert, Filter, Map, MapPin, SearchX, X } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

type SearchSort = "nearby" | "rating" | "recommended";
type SearchResultItem = BusinessCardData & { latitude: number | null; longitude: number | null };
type SearchUpdates = Record<string, string | undefined>;

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
  const params = useMemo(() => getSearchQueryParams(location, typeof window === "undefined" ? "" : window.location.search), [location]);
  const query = params.get("q") ?? "";
  const city = params.get("city") ?? undefined;
  const locality = params.get("locality") ?? undefined;
  const category = params.get("category") ?? undefined;
  const subcategory = params.get("subcategory") ?? undefined;
  const businessType = params.get("businessType") ?? undefined;
  const { coordinates, status: locationStatus, message: locationMessage, request: requestLocation } = useUserLocation();
  const urlLatitude = params.get("lat") ? Number(params.get("lat")) : undefined;
  const urlLongitude = params.get("lng") ? Number(params.get("lng")) : undefined;
  const latitude = urlLatitude ?? coordinates?.latitude;
  const longitude = urlLongitude ?? coordinates?.longitude;
  const sort = (params.get("sort") as SearchSort | null) ?? (latitude !== undefined && longitude !== undefined ? "nearby" : "recommended");
  const verified = params.get("verified") === "1";
  const [sessionId] = useState(getSessionId);
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<SearchResultItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const input = useMemo(() => ({ query, city, locality, category, subcategory, businessType, latitude, longitude, sort, verified: verified || undefined, sessionId, offset, limit: 10 }), [query, city, locality, category, subcategory, businessType, latitude, longitude, sort, verified, sessionId, offset]);
  const { data, isLoading, isFetching, error, refetch } = trpc.discovery.search.useQuery(input);
  const { data: categories = [] } = trpc.discovery.categories.useQuery();
  const { data: cities = [] } = trpc.discovery.locations.useQuery();
  const { data: localities = [] } = trpc.discovery.localities.useQuery({ city: city ?? "" }, { enabled: Boolean(city) });
  const interaction = trpc.discovery.interaction.useMutation();
  const selectedCity = cities.find(item => item.slug === city);

  useEffect(() => { setOffset(0); setItems([]); setTotal(null); setSelectedId(undefined); }, [query, city, locality, category, subcategory, businessType, latitude, longitude, sort, verified]);
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

  const updateSearch = (updates: SearchUpdates) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    setLocation(`/search?${next.toString()}`);
  };
  const enableNearby = async () => {
    if (latitude !== undefined && longitude !== undefined) { updateSearch({ sort: "nearby", lat: String(latitude), lng: String(longitude) }); return; }
    const resolved = await requestLocation();
    if (resolved) updateSearch({ sort: "nearby", lat: String(resolved.latitude), lng: String(resolved.longitude) });
  };
  const selectOnMap = (id: number) => { setSelectedId(id); document.getElementById(`listing-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); };
  const recordInteraction = (businessId: number, action: "click" | "call" | "whatsapp" | "directions" | "website") => interaction.mutate({ businessId, action, query, sessionId });
  const headingLocation = locality?.replace(/-/g, " ") ?? city?.replace(/-/g, " ") ?? (latitude !== undefined ? "your area" : "all approved cities");
  const hasFilters = Boolean(city || locality || category || subcategory || businessType || verified || latitude !== undefined || longitude !== undefined || sort !== "recommended");
  const mapHasCoordinates = items.some(item => item.latitude !== null && item.longitude !== null);
  const clearFilters = () => updateSearch({ city: undefined, locality: undefined, category: undefined, subcategory: undefined, businessType: undefined, verified: undefined, lat: undefined, lng: undefined, sort: "recommended" });
  const activeFilters = [
    category && { label: `Category: ${categories.find(item => item.slug === category)?.name ?? category.replace(/-/g, " ")}`, remove: () => updateSearch({ category: undefined, subcategory: undefined, businessType: undefined }) },
    locality && { label: `Locality: ${localities.find(item => item.slug === locality)?.name ?? locality.replace(/-/g, " ")}`, remove: () => updateSearch({ locality: undefined }) },
    verified && { label: "Verified", remove: () => updateSearch({ verified: undefined }) },
    sort === "nearby" && { label: "Nearest first", remove: () => updateSearch({ sort: "recommended", lat: undefined, lng: undefined }) },
    businessType && { label: `Service: ${businessType.replace(/-/g, " ")}`, remove: () => updateSearch({ businessType: undefined }) },
  ].filter(Boolean) as Array<{ label: string; remove: () => void }>;
  const filterControls = <FilterControls categories={categories} localities={localities} selectedCityName={selectedCity?.name} category={category} locality={locality} verified={verified} nearbyActive={sort === "nearby"} locationDisabled={locationStatus === "requesting" || locationStatus === "unsupported"} locationLoading={locationStatus === "requesting"} onUpdate={updateSearch} onNearby={enableNearby} />;

  return <PageFrame>
    <section className="border-b border-[var(--jf-border)] bg-white py-4 sm:py-5"><div className="container"><SearchHero compact initialQuery={query} initialCity={city} initialLocality={locality} /></div></section>
    <section className="container py-7 sm:py-9">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[var(--jf-muted)]"><span>Home</span><span>/</span><span>Explore</span><span>/</span><span className="font-medium text-[var(--jf-text)]">{query || "Local discovery"}</span></nav>
      <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="max-w-3xl"><p className="eyebrow">Decision-ready local search</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-[var(--jf-text)] sm:text-4xl">{query ? `${query} in ${headingLocation}` : `Businesses in ${headingLocation}`}</h1><p className="mt-3 text-sm leading-6 text-[var(--jf-muted)]">{total === null ? "Finding published profiles" : `${total} ${total === 1 ? "published profile" : "published profiles"}`} based on the currently available filters.</p></div>
        {mapHasCoordinates && <Button onClick={() => setMapOpen(value => !value)} variant="outline" className="jf-touch-target hidden rounded-xl lg:inline-flex"><Map className="mr-2 size-4" />{mapOpen ? "List view" : "Map view"}</Button>}
      </div>

      <div className="sticky top-[72px] z-20 -mx-4 mt-5 border-y border-[var(--jf-border)] bg-white/95 px-4 py-3 backdrop-blur lg:hidden"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-[var(--jf-text)]">{total === null ? "Finding results" : `${total} results`}</span><div className="flex gap-2">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}><Button variant="outline" className="jf-touch-target rounded-xl" onClick={() => setFiltersOpen(true)}><Filter className="mr-2 size-4" />Filters{activeFilters.length ? ` (${activeFilters.length})` : ""}</Button><MobileSheet title="Filters" description="Only filters supported by available listing data are shown.">{filterControls}</MobileSheet></Sheet>
        <Sheet open={sortOpen} onOpenChange={setSortOpen}><Button variant="outline" className="jf-touch-target rounded-xl" onClick={() => setSortOpen(true)}><ArrowDownUp className="mr-2 size-4" />Sort</Button><MobileSheet title="Sort results" description="Choose how the current factual result set is ordered."><SortControls sort={sort} onUpdate={updateSearch} hasLocation={latitude !== undefined && longitude !== undefined} onNearby={enableNearby} /></MobileSheet></Sheet>
      </div></div></div>

      {activeFilters.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Applied filters"><span className="mr-1 text-xs font-semibold uppercase tracking-[.08em] text-[var(--jf-muted)]">Applied</span>{activeFilters.map(filter => <button key={filter.label} onClick={filter.remove} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 text-xs font-semibold text-[var(--jf-primary)] hover:bg-blue-100">{filter.label}<X className="size-3.5" /><span className="sr-only">Remove {filter.label} filter</span></button>)}<button onClick={clearFilters} className="min-h-9 px-2 text-xs font-semibold text-[var(--jf-primary)] hover:underline">Clear all</button></div>}
      <p className="mt-3 text-xs leading-5 text-[var(--jf-muted)]">{locationMessage ? locationMessage : latitude === undefined || longitude === undefined ? "Choose Nearby to share your location and calculate available distances." : `Distances are measured from your shared location${coordinates?.accuracyMeters ? ` (approximately ${coordinates.accuracyMeters} m accuracy)` : ""}.`}</p>

      <div className="mt-7 grid gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block"><div className="jf-card sticky top-24 rounded-[22px] p-4"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-[var(--jf-text)]">Filters</h2>{hasFilters && <button onClick={clearFilters} className="text-xs font-semibold text-[var(--jf-primary)] hover:underline">Clear all</button>}</div><p className="mt-1 text-xs leading-5 text-[var(--jf-muted)]">Options appear only when the relevant source data is available.</p><div className="mt-5">{filterControls}</div></div></aside>
        <div className="min-w-0"><div className="mb-4 hidden items-center justify-between gap-3 lg:flex"><p className="text-sm text-[var(--jf-muted)]">{total === null ? "Loading result count…" : `${total} published ${total === 1 ? "result" : "results"}`}</p><SortControls sort={sort} onUpdate={updateSearch} hasLocation={latitude !== undefined && longitude !== undefined} onNearby={enableNearby} compact /></div>
          {mapOpen && mapHasCoordinates && <section className="jf-card mb-4 overflow-hidden rounded-[22px] p-4" aria-label="Map results"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-[var(--jf-text)]">Map results</h2><p className="mt-1 text-xs text-[var(--jf-muted)]">Map availability depends on the current device and connection.</p></div><MapPin className="size-4 text-[var(--jf-primary)]" /></div><div className="h-[380px]"><SearchResultsMap items={items} selectedId={selectedId} onSelect={selectOnMap} /></div></section>}
          <div className={cn("grid gap-4", mapOpen && "hidden")}>{error ? <ErrorState onRetry={() => void refetch()} /> : isLoading && items.length === 0 ? <SearchResultSkeleton /> : items.length ? items.map(item => <div id={`listing-${item.id}`} key={item.id} onClick={() => selectOnMap(item.id)} className={cn("rounded-[22px] transition-shadow", selectedId === item.id && "ring-2 ring-[var(--jf-primary)] ring-offset-2")}><BusinessCard item={item} onInteraction={recordInteraction} /></div>) : <EmptyState onClearFilters={clearFilters} hasFilters={hasFilters} />}{data?.nextOffset && <div ref={triggerRef} className="py-3 text-center text-sm text-[var(--jf-muted)]">{isFetching ? "Finding more published profiles…" : "Scroll to load more"}</div>}{!data?.nextOffset && items.length > 0 && <p className="py-3 text-center text-sm text-[var(--jf-muted)]">You’ve reached the end of these results.</p>}</div>
        </div>
      </div>
    </section>
  </PageFrame>;
}

function FilterControls({ categories, localities, selectedCityName, category, locality, verified, nearbyActive, locationDisabled, locationLoading, onUpdate, onNearby }: { categories: Array<{ id: number; name: string; slug: string }>; localities: Array<{ id: number; name: string; slug: string }>; selectedCityName?: string; category?: string; locality?: string; verified: boolean; nearbyActive: boolean; locationDisabled: boolean; locationLoading: boolean; onUpdate: (updates: SearchUpdates) => void; onNearby: () => void; }) {
  return <div className="grid gap-4">
    {categories.length > 0 && <label className="grid gap-1.5 text-sm font-semibold text-[var(--jf-text)]">Category<select value={category ?? ""} onChange={event => onUpdate({ category: event.target.value || undefined, subcategory: undefined, businessType: undefined })} className="jf-touch-target w-full rounded-xl border border-[var(--jf-border)] bg-white px-3 text-sm font-medium text-[var(--jf-text)] outline-none focus:border-[var(--jf-primary)] focus:ring-2 focus:ring-blue-100"><option value="">All categories</option>{categories.map(item => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>}
    {selectedCityName && localities.length > 0 && <label className="grid gap-1.5 text-sm font-semibold text-[var(--jf-text)]">Locality in {selectedCityName}<select value={locality ?? ""} onChange={event => onUpdate({ locality: event.target.value || undefined })} className="jf-touch-target w-full rounded-xl border border-[var(--jf-border)] bg-white px-3 text-sm font-medium text-[var(--jf-text)] outline-none focus:border-[var(--jf-primary)] focus:ring-2 focus:ring-blue-100"><option value="">All localities</option>{localities.map(item => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>}
    <div className="grid gap-2 border-t border-[var(--jf-border)] pt-4"><p className="text-sm font-semibold text-[var(--jf-text)]">Profile signals</p><button type="button" onClick={() => onUpdate({ verified: verified ? undefined : "1" })} className={toggleClass(verified)}><Check className={cn("size-4", verified ? "opacity-100" : "opacity-0")} />Verified listings only</button></div>
    {!locationDisabled && <div className="grid gap-2 border-t border-[var(--jf-border)] pt-4"><p className="text-sm font-semibold text-[var(--jf-text)]">Distance</p><button type="button" onClick={onNearby} className={toggleClass(nearbyActive)} disabled={locationLoading}><MapPin className="size-4" />{locationLoading ? "Using your location…" : nearbyActive ? "Nearest results" : "Sort by nearest"}</button></div>}
  </div>;
}

function SortControls({ sort, onUpdate, hasLocation, onNearby, compact = false }: { sort: SearchSort; onUpdate: (updates: SearchUpdates) => void; hasLocation: boolean; onNearby: () => void; compact?: boolean }) { return <div className={cn("flex", compact ? "items-center gap-2" : "grid gap-2")}><>{compact && <span className="text-xs font-semibold uppercase tracking-[.08em] text-[var(--jf-muted)]">Sort</span>}</><button type="button" onClick={() => onUpdate({ sort: "recommended", lat: undefined, lng: undefined })} className={compact ? sortButton(sort !== "nearby") : choiceButton(sort !== "nearby")}><Check className={cn("size-4", sort !== "nearby" ? "opacity-100" : "opacity-0")} />Recommended</button><button type="button" onClick={onNearby} className={compact ? sortButton(sort === "nearby") : choiceButton(sort === "nearby")}><MapPin className="size-4" />{hasLocation ? "Nearest first" : "Use my location"}</button></div>; }
function MobileSheet({ title, description, children }: { title: string; description: string; children: ReactNode }) { return <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[24px] bg-white"><SheetHeader><SheetTitle>{title}</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader><div className="px-4 pb-2">{children}</div><SheetFooter><SheetClose asChild><Button className="jf-touch-target w-full rounded-xl">Show results</Button></SheetClose></SheetFooter></SheetContent>; }
function toggleClass(active: boolean) { return cn("jf-touch-target flex w-full items-center gap-2 rounded-xl border px-3 text-left text-sm font-semibold transition-colors", active ? "border-blue-200 bg-blue-50 text-[var(--jf-primary)]" : "border-[var(--jf-border)] bg-white text-[var(--jf-muted)] hover:border-blue-200 hover:text-[var(--jf-primary)]"); }
function choiceButton(active: boolean) { return cn("jf-touch-target flex w-full items-center gap-2 rounded-xl border px-3 text-left text-sm font-semibold transition-colors", active ? "border-blue-200 bg-blue-50 text-[var(--jf-primary)]" : "border-[var(--jf-border)] bg-white text-[var(--jf-muted)]"); }
function sortButton(active: boolean) { return cn("jf-touch-target inline-flex items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors", active ? "border-blue-200 bg-blue-50 text-[var(--jf-primary)]" : "border-[var(--jf-border)] bg-white text-[var(--jf-muted)] hover:border-blue-200"); }
function SearchResultSkeleton() { return <div className="grid gap-4" aria-label="Loading search results" aria-busy="true">{[0, 1, 2].map(index => <div key={index} className="jf-skeleton h-52 p-5"><div className="h-5 w-2/5 rounded bg-white/55" /><div className="mt-4 h-4 w-3/5 rounded bg-white/45" /><div className="mt-7 h-10 w-40 rounded-xl bg-white/55" /></div>)}</div>; }
function EmptyState({ onClearFilters, hasFilters }: { onClearFilters: () => void; hasFilters: boolean }) { return <div className="jf-empty"><SearchX className="mx-auto size-8 text-slate-400" /><h2 className="mt-3 font-semibold text-[var(--jf-text)]">No published profiles match this search</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--jf-muted)]">No published businesses match the current search and filters. Keep your search term, then broaden the available filters.</p>{hasFilters && <Button onClick={onClearFilters} variant="outline" className="jf-touch-target mt-5 rounded-xl">Clear filters</Button>}</div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="rounded-2xl border border-orange-200 bg-orange-50 p-7 text-center"><CircleAlert className="mx-auto size-7 text-orange-600" /><h2 className="mt-3 text-sm font-semibold text-orange-950">Search could not be completed</h2><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-orange-900">Your existing search and filters are still saved. Check your connection, then try the same search again.</p><Button onClick={onRetry} variant="outline" className="jf-touch-target mt-5 border-orange-300 bg-white text-orange-900 hover:bg-orange-100">Try search again</Button></div>; }
