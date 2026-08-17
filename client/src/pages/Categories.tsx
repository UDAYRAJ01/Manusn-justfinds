import { PageFrame } from "@/components/PageFrame";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BriefcaseBusiness, Building2, HeartPulse, Home, Landmark, Search, SearchX, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const categoryIcons: Record<string, React.ElementType> = {
  healthcare: HeartPulse,
  "food-dining": UtensilsCrossed,
  education: Landmark,
  "home-services": Home,
  "professional-services": Building2,
  jobs: BriefcaseBusiness,
};

export default function Categories() {
  const { data, isLoading, error, refetch } = trpc.discovery.categories.useQuery();
  const [query, setQuery] = useState("");
  const categories = data ?? [];
  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return categories;
    return categories.filter(category => [category.name, category.description ?? ""].some(value => value.toLocaleLowerCase().includes(normalizedQuery)));
  }, [categories, query]);

  return <PageFrame>
    <section className="border-b border-[var(--jf-border)] bg-white py-9 sm:py-12"><div className="container max-w-5xl">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[var(--jf-muted)]"><Link href="/" className="hover:text-[var(--jf-primary)]">Home</Link><span aria-hidden="true">/</span><span className="font-medium text-[var(--jf-text)]">Categories</span></nav>
      <div className="mt-5 max-w-2xl"><p className="eyebrow">Browse categories</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[var(--jf-text)] sm:text-4xl">Explore local categories</h1><p className="mt-3 text-sm leading-6 text-[var(--jf-muted)] sm:text-base">Choose a category to continue into published local profiles and available subcategories.</p></div>
      <div className="relative mt-6 max-w-xl"><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--jf-muted)]" /><label className="sr-only" htmlFor="category-directory-search">Search categories</label><input id="category-directory-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search categories" className="min-h-12 w-full rounded-xl border border-[var(--jf-border)] bg-white py-3 pl-11 pr-4 text-sm text-[var(--jf-text)] outline-none transition focus:border-[var(--jf-primary)] focus:ring-4 focus:ring-blue-100" /></div>
    </div></section>
    <section className="container max-w-5xl py-9 sm:py-12"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.13em] text-[var(--jf-muted)]">Available categories</p><h2 className="mt-2 text-xl font-semibold tracking-[-.03em] text-[var(--jf-text)]">{query.trim() ? `Matches for “${query.trim()}”` : "All categories"}</h2></div>{!isLoading && !error && <span className="text-sm text-[var(--jf-muted)]">{filteredCategories.length} {filteredCategories.length === 1 ? "category" : "categories"}</span>}</div>
      {isLoading ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div className="h-32 animate-pulse rounded-2xl border border-[var(--jf-border)] bg-slate-50" key={index} />)}</div> : error ? <DirectoryError onRetry={() => void refetch()} /> : filteredCategories.length ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{filteredCategories.map(category => { const Icon = categoryIcons[category.slug] ?? Building2; return <Link href={`/category/${category.slug}`} key={category.id} className="group flex min-h-[132px] flex-col rounded-2xl border border-[var(--jf-border)] bg-white p-4 transition duration-150 hover:border-blue-200 hover:shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"><span className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600"><Icon className="size-4" /></span><h3 className="mt-auto text-sm font-semibold leading-5 text-[var(--jf-text)] group-hover:text-[var(--jf-primary)]">{category.name}</h3><span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--jf-muted)] group-hover:text-[var(--jf-primary)]">Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span></Link>; })}</div> : <DirectoryNoResults query={query} onClear={() => setQuery("")} />}
    </section>
  </PageFrame>;
}

function DirectoryError({ onRetry }: { onRetry: () => void }) {
  return <div className="mt-6 rounded-[22px] border border-red-100 bg-red-50 p-7"><h2 className="text-lg font-semibold text-red-900">Categories could not be loaded</h2><p className="mt-2 text-sm leading-6 text-red-800">Try loading the available category directory again.</p><Button onClick={onRetry} variant="outline" className="mt-4 min-h-11 border-red-200 bg-white text-red-800 hover:bg-red-100">Try again</Button></div>;
}

function DirectoryNoResults({ query, onClear }: { query: string; onClear: () => void }) {
  const hasQuery = Boolean(query.trim());
  return <div className="mt-6 rounded-[22px] border border-dashed border-[var(--jf-border)] bg-[var(--jf-canvas)] p-8 text-center sm:p-10"><SearchX className="mx-auto size-7 text-[var(--jf-muted)]" /><h2 className="mt-3 text-lg font-semibold text-[var(--jf-text)]">{hasQuery ? "No categories match that search" : "No categories are available yet"}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--jf-muted)]">{hasQuery ? "Try a shorter category name or clear the search to view the complete directory." : "Public category options will appear here once they are configured."}</p>{hasQuery ? <Button variant="outline" onClick={onClear} className="mt-5 min-h-11 rounded-xl">Clear search</Button> : <Link href="/search"><Button variant="outline" className="mt-5 min-h-11 rounded-xl">Search published profiles</Button></Link>}</div>;
}
