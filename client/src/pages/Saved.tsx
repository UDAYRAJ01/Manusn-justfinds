import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { PageFrame } from "@/components/PageFrame";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Bookmark, Building2, CheckCircle2, MapPin, RotateCcw, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Link } from "wouter";

type SortMode = "recent" | "name" | "city";
type SavedListing = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  address: string;
  isVerified: boolean;
  category: string;
  categorySlug: string;
  city: string;
  citySlug: string;
  locality: string | null;
  savedAt: Date | string;
};

function listingHref(listing: Pick<SavedListing, "categorySlug" | "citySlug" | "slug">) {
  return `/${listing.categorySlug}/${listing.citySlug}/${listing.slug}`;
}

function savedDate(value: Date | string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Saved" : `Saved ${date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
}

export function sortSavedListings(listings: SavedListing[], mode: SortMode) {
  return [...listings].sort((left, right) => {
    if (mode === "name") return left.name.localeCompare(right.name);
    if (mode === "city") return `${left.city} ${left.name}`.localeCompare(`${right.city} ${right.name}`);
    return new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime();
  });
}

export default function Saved() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const [sort, setSort] = useState<SortMode>("recent");
  const [lastRemoved, setLastRemoved] = useState<{ id: number; name: string } | null>(null);
  const collection = trpc.discovery.savedListings.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const toggleSave = trpc.discovery.toggleSave.useMutation();
  const listings = collection.data ?? [];
  const visibleListings = useMemo(() => sortSavedListings(listings, sort), [listings, sort]);

  const refreshCollection = () => {
    void utils.discovery.savedListings.invalidate();
  };

  const removeListing = (listing: SavedListing) => {
    toggleSave.mutate({ businessId: listing.id }, {
      onSuccess: result => {
        if (!result.saved && result.reason === "removed") {
          setLastRemoved({ id: listing.id, name: listing.name });
          refreshCollection();
        }
      },
    });
  };

  const undoRemoval = () => {
    if (!lastRemoved) return;
    toggleSave.mutate({ businessId: lastRemoved.id }, {
      onSuccess: result => {
        if (result.saved) {
          setLastRemoved(null);
          refreshCollection();
        }
      },
    });
  };

  return <PageFrame>
    <main className="container min-h-[62vh] py-7 pb-28 sm:py-10">
      <header className="flex flex-col gap-4 border-b border-[var(--jf-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[var(--jf-primary)]">Your collection</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.05em] text-[var(--jf-text)] sm:text-4xl">Saved listings</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--jf-muted)]">Places you save appear here privately, ready when you want to compare or contact them.</p>
        </div>
        {isAuthenticated && listings.length > 1 && <label className="flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-slate-700 sm:self-auto">Sort
          <select value={sort} onChange={event => setSort(event.target.value as SortMode)} className="h-11 rounded-xl border border-[var(--jf-border)] bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-[var(--jf-primary)] focus:ring-2 focus:ring-blue-100" aria-label="Sort saved listings">
            <option value="recent">Recently saved</option>
            <option value="name">Business name</option>
            <option value="city">City</option>
          </select>
        </label>}
      </header>

      {loading ? <SavedSkeleton /> : !isAuthenticated ? <SignInState /> : collection.isLoading ? <SavedSkeleton /> : collection.error ? <ErrorState onRetry={() => void collection.refetch()} /> : visibleListings.length ? <>
        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Saved business listings">
          {visibleListings.map(listing => <SavedListingCard key={listing.id} listing={listing} disabled={toggleSave.isPending} onRemove={() => removeListing(listing)} />)}
        </section>
        {lastRemoved && <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 mx-auto flex max-w-md flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm text-white shadow-xl sm:bottom-5" role="status" aria-live="polite">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-300" />
          <p className="min-w-0 flex-1"><span className="font-semibold">{lastRemoved.name}</span> removed from saved listings.</p>
          <button type="button" onClick={undoRemoval} disabled={toggleSave.isPending} className="min-h-11 rounded-xl px-3 text-sm font-bold text-white underline decoration-blue-300 underline-offset-4 transition-colors hover:text-blue-200 disabled:opacity-60">Undo</button>
        </div>}
      </> : <EmptyState />}
    </main>
  </PageFrame>;
}

function SavedListingCard({ listing, disabled, onRemove }: { listing: SavedListing; disabled: boolean; onRemove: () => void }) {
  return <article className="jf-card group flex min-h-[202px] flex-col rounded-[20px] p-4 transition-shadow hover:shadow-[0_12px_26px_rgba(15,23,42,.06)]">
    <div className="flex items-start justify-between gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[var(--jf-primary)]"><Building2 className="size-5" /></span>
      <button type="button" onClick={onRemove} disabled={disabled} className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60" aria-label={`Remove ${listing.name} from saved listings`}><Trash2 className="size-4" /></button>
    </div>
    <div className="mt-4 min-w-0">
      <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[var(--jf-primary)]">{listing.category}</p>
      <Link href={listingHref(listing)} className="mt-1 inline-flex max-w-full text-lg font-bold tracking-[-.035em] text-[var(--jf-text)] transition-colors hover:text-[var(--jf-primary)]"><span className="truncate">{listing.name}</span></Link>
      <p className="mt-2 flex items-start gap-1.5 text-sm leading-5 text-[var(--jf-muted)]"><MapPin className="mt-0.5 size-3.5 shrink-0 text-[var(--jf-warm)]" /><span>{[listing.locality, listing.city].filter(Boolean).join(", ") || listing.address}</span></p>
      {listing.shortDescription && <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{listing.shortDescription}</p>}
    </div>
    <footer className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5 text-xs">
      <span className="text-[var(--jf-muted)]">{savedDate(listing.savedAt)}</span>
      <Link href={listingHref(listing)} className="inline-flex min-h-11 items-center gap-1 font-bold text-[var(--jf-primary)]">View <ArrowRight className="size-3.5" /></Link>
    </footer>
  </article>;
}

function SignInState() {
  return <section className="grid min-h-[42vh] place-items-center py-12 text-center"><div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-[var(--jf-primary)]"><Bookmark className="size-6" /></span><h2 className="mt-5 text-2xl font-bold tracking-[-.04em] text-[var(--jf-text)]">Keep places handy</h2><p className="mt-3 text-sm leading-6 text-[var(--jf-muted)]">Sign in to view the listings you have saved to your private Just Finds collection.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/search"><Button variant="outline" className="min-h-11 rounded-xl bg-white">Explore discovery</Button></Link><Button onClick={() => startLogin()} className="min-h-11 rounded-xl bg-[var(--jf-primary)]">Sign in</Button></div></div></section>;
}

function EmptyState() {
  return <section className="grid min-h-[42vh] place-items-center py-12 text-center"><div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-[var(--jf-primary)]"><Bookmark className="size-6" /></span><h2 className="mt-5 text-2xl font-bold tracking-[-.04em] text-[var(--jf-text)]">No saved places yet</h2><p className="mt-3 text-sm leading-6 text-[var(--jf-muted)]">Saved places appear here after you save them from a business listing.</p><Link href="/search" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--jf-primary)] px-4 text-sm font-bold text-white transition-colors hover:bg-[var(--jf-primary-hover)]">Explore discovery <ArrowRight className="size-4" /></Link></div></section>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <section className="grid min-h-[42vh] place-items-center py-12 text-center"><div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-700"><Bookmark className="size-6" /></span><h2 className="mt-5 text-2xl font-bold tracking-[-.04em] text-[var(--jf-text)]">Saved places could not load</h2><p className="mt-3 text-sm leading-6 text-[var(--jf-muted)]">Your saved places were not changed. Please try again.</p><Button onClick={onRetry} className="mt-6 min-h-11 rounded-xl">Try again</Button></div></section>;
}

function SavedSkeleton() {
  return <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading saved listings">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[202px] animate-pulse rounded-[20px] border border-slate-100 bg-white p-4"><div className="size-11 rounded-2xl bg-slate-100" /><div className="mt-5 h-3 w-20 rounded bg-slate-100" /><div className="mt-3 h-5 w-4/5 rounded bg-slate-100" /><div className="mt-3 h-3 w-3/5 rounded bg-slate-100" /><div className="mt-10 h-3 w-1/2 rounded bg-slate-100" /></div>)}</section>;
}
