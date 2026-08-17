import { BusinessCard } from "@/components/BusinessCard";
import { PageFrame } from "@/components/PageFrame";
import { SearchHero } from "@/components/SearchHero";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowRight, MapPin, SearchX, Tag } from "lucide-react";
import { Link, useLocation } from "wouter";

function titleCase(value: string) {
  return value.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[var(--jf-muted)]">
    {items.map((item, index) => <span className="flex items-center gap-2" key={`${item.label}-${index}`}>
      {index > 0 && <span aria-hidden="true">/</span>}
      {item.href ? <Link href={item.href} className="font-medium hover:text-[var(--jf-primary)]">{item.label}</Link> : <span className="font-medium text-[var(--jf-text)]">{item.label}</span>}
    </span>)}
  </nav>;
}

function PublishedListings({ city, locality, category, subcategory, businessType, heading }: { city?: string; locality?: string; category?: string; subcategory?: string; businessType?: string; heading: string }) {
  const listingQuery = trpc.discovery.search.useQuery({ query: "", city, locality, category, subcategory, businessType, sort: "recommended", limit: 10 });
  const items = listingQuery.data?.items ?? [];
  return <section className="mt-12 border-t border-[var(--jf-border)] pt-9 sm:mt-14 sm:pt-11" aria-labelledby="published-profiles-heading">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Local exploration</p><h2 id="published-profiles-heading" className="mt-2 text-2xl font-semibold tracking-[-.04em] text-[var(--jf-text)]">{heading}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--jf-muted)]">Only published profiles that match this page are shown.</p></div>{!listingQuery.isLoading && items.length > 0 && <span className="text-sm font-medium text-[var(--jf-muted)]">{listingQuery.data?.total ?? items.length} {listingQuery.data?.total === 1 ? "profile" : "profiles"}</span>}</div>
    {listingQuery.isLoading ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><ListingSkeleton /><ListingSkeleton /><ListingSkeleton /></div> : listingQuery.error ? <div className="mt-5 rounded-[22px] border border-red-100 bg-red-50 p-6"><h3 className="font-semibold text-red-900">Profiles could not be loaded</h3><p className="mt-2 text-sm leading-6 text-red-800">Your selected page is still available. Try loading its published profiles again.</p><Button onClick={() => void listingQuery.refetch()} variant="outline" className="mt-4 min-h-11 border-red-200 bg-white text-red-800 hover:bg-red-100">Try again</Button></div> : items.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <BusinessCard key={item.id} item={item} />)}</div> : <LandingEmptyState />}
  </section>;
}

function ListingSkeleton() {
  return <div className="jf-card min-h-[208px] rounded-[22px] p-5"><div className="h-4 w-24 animate-pulse rounded bg-slate-100" /><div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-slate-100" /><div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-100" /><div className="mt-8 h-4 w-full animate-pulse rounded bg-slate-100" /><div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-slate-100" /></div>;
}

function LandingEmptyState() {
  return <div className="mt-5 rounded-[22px] border border-dashed border-[var(--jf-border)] bg-[var(--jf-canvas)] p-7 sm:p-9"><SearchX className="size-6 text-[var(--jf-muted)]" /><h3 className="mt-3 text-lg font-semibold text-[var(--jf-text)]">No published profiles match this page yet</h3><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--jf-muted)]">This category or location can still be explored. Browse the approved India city catalogue or another configured category to continue.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/search"><Button className="min-h-11 rounded-xl bg-[var(--jf-primary)] hover:bg-[var(--jf-primary-hover)]">Explore approved cities <ArrowRight className="ml-2 size-4" /></Button></Link><Link href="/categories"><Button variant="outline" className="min-h-11 rounded-xl">Browse categories</Button></Link></div></div>;
}

function LandingUnavailable({ label }: { label: string }) {
  return <div className="rounded-[22px] border border-dashed border-[var(--jf-border)] bg-[var(--jf-canvas)] p-8 text-center sm:p-10"><SearchX className="mx-auto size-8 text-[var(--jf-muted)]" /><h1 className="mt-3 text-xl font-semibold text-[var(--jf-text)]">This {label} is not available</h1><p className="mt-2 text-sm leading-6 text-[var(--jf-muted)]">It may be inactive or outside the supported public discovery catalogue.</p><div className="mt-5 flex justify-center gap-3"><Link href="/search"><Button variant="outline" className="min-h-11 rounded-xl">Explore approved cities</Button></Link><Link href="/categories"><Button variant="outline" className="min-h-11 rounded-xl">Browse categories</Button></Link></div></div>;
}

export function CategoryLanding() {
  const [location] = useLocation();
  const [, categorySlug, subcategorySlug, businessTypeSlug] = location.split("?")[0].split("/").filter(Boolean);
  const { data: category, isLoading } = trpc.discovery.category.useQuery({ slug: categorySlug ?? "" }, { enabled: Boolean(categorySlug) });
  const { data: subcategories } = trpc.discovery.subcategories.useQuery({ category: categorySlug ?? "" }, { enabled: Boolean(categorySlug) });
  const { data: businessTypes } = trpc.discovery.businessTypes.useQuery({ category: categorySlug ?? "", subcategory: subcategorySlug ?? "" }, { enabled: Boolean(categorySlug && subcategorySlug) });
  const label = category?.name ?? titleCase(categorySlug ?? "Category");
  const contextLabel = businessTypeSlug ? titleCase(businessTypeSlug) : subcategorySlug ? titleCase(subcategorySlug) : label;
  const heading = businessTypeSlug ? `${contextLabel} in ${titleCase(subcategorySlug ?? "")}` : subcategorySlug ? `${contextLabel} in ${label}` : label;

  return <PageFrame><section className="border-b border-[var(--jf-border)] bg-white py-4 sm:py-5"><div className="container"><SearchHero compact initialQuery={label} /></div></section><section className="container py-8 sm:py-11">{isLoading ? <div className="h-64 animate-pulse rounded-[22px] bg-slate-100" /> : !category ? <LandingUnavailable label="category" /> : <><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Categories", href: "/categories" }, { label, href: `/category/${categorySlug}` }, ...(subcategorySlug ? [{ label: titleCase(subcategorySlug), href: `/category/${categorySlug}/${subcategorySlug}` }] : []), ...(businessTypeSlug ? [{ label: titleCase(businessTypeSlug) }] : [])]} /><div className="mt-5 max-w-3xl"><p className="eyebrow">Category exploration</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[var(--jf-text)] sm:text-4xl">{heading}</h1><p className="mt-3 text-base leading-7 text-[var(--jf-muted)]">{category.description ?? "Explore published local profiles through the category fields configured for this directory."}</p></div>
    {!subcategorySlug && <RelatedNavigation title="Explore subcategories" items={subcategories?.map(item => ({ id: item.id, name: item.name, href: `/category/${categorySlug}/${item.slug}`, description: item.description ?? "Browse published profiles in this subcategory." })) ?? []} icon={<Tag className="size-4" />} empty="Subcategories will appear here when they are configured for public discovery." />}
    {subcategorySlug && !businessTypeSlug && <RelatedNavigation title="Explore business types" items={businessTypes?.map(item => ({ id: item.id, name: item.name, href: `/category/${categorySlug}/${subcategorySlug}/${item.slug}`, description: item.description ?? "Browse published profiles of this business type." })) ?? []} icon={<Tag className="size-4" />} empty="Business types are being configured for this subcategory." />}
    <PublishedListings category={categorySlug} subcategory={subcategorySlug} businessType={businessTypeSlug} heading={`Published ${contextLabel} profiles`} />
  </>}</section></PageFrame>;
}

export function CityLanding() {
  const [location] = useLocation();
  const [, citySlug, localitySlug] = location.split("?")[0].split("/").filter(Boolean);
  const { data: city, isLoading } = trpc.discovery.city.useQuery({ slug: citySlug ?? "" }, { enabled: Boolean(citySlug) });
  const { data: localities } = trpc.discovery.localities.useQuery({ city: citySlug ?? "" }, { enabled: Boolean(citySlug) });
  const label = city?.name ?? titleCase(citySlug ?? "City");
  const localityLabel = localitySlug ? titleCase(localitySlug) : undefined;
  const heading = localityLabel ? `${localityLabel}, ${label}` : label;

  return <PageFrame><section className="border-b border-[var(--jf-border)] bg-white py-4 sm:py-5"><div className="container"><SearchHero compact initialCity={citySlug} initialLocality={localitySlug} /></div></section><section className="container py-8 sm:py-11">{isLoading ? <div className="h-64 animate-pulse rounded-[22px] bg-slate-100" /> : !city ? <LandingUnavailable label="city" /> : <><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Approved cities", href: "/search" }, { label, href: `/city/${citySlug}` }, ...(localityLabel ? [{ label: localityLabel }] : [])]} /><div className="mt-5 max-w-3xl"><p className="eyebrow">Location exploration</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[var(--jf-text)] sm:text-4xl">{heading}</h1><p className="mt-3 text-base leading-7 text-[var(--jf-muted)]">Browse published local profiles in this approved Indian location. Distance ordering becomes available when a visitor shares approximate device location.</p></div>
    {!localitySlug && <RelatedNavigation title={`Explore localities in ${label}`} items={localities?.map(item => ({ id: item.id, name: item.name, href: `/city/${citySlug}/${item.slug}`, description: "View published profiles in this locality." })) ?? []} icon={<MapPin className="size-4" />} empty="Localities will appear here when they are configured for public discovery." />}
    <PublishedListings city={citySlug} locality={localitySlug} heading={`Published profiles in ${heading}`} />
  </>}</section></PageFrame>;
}

function RelatedNavigation({ title, items, icon, empty }: { title: string; items: Array<{ id: number; name: string; href: string; description: string }>; icon: React.ReactNode; empty: string }) {
  return <section className="mt-9" aria-labelledby={`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-heading`}><h2 id={`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-heading`} className="text-xl font-semibold tracking-[-.03em] text-[var(--jf-text)]">{title}</h2>{items.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(item => <Link key={item.id} href={item.href} className="group rounded-2xl border border-[var(--jf-border)] bg-white p-4 transition duration-150 hover:border-blue-200 hover:shadow-sm"><span className="grid size-8 place-items-center rounded-xl bg-blue-50 text-[var(--jf-primary)]">{icon}</span><h3 className="mt-4 font-semibold text-[var(--jf-text)] group-hover:text-[var(--jf-primary)]">{item.name}</h3><p className="mt-1.5 text-sm leading-6 text-[var(--jf-muted)]">{item.description}</p></Link>)}</div> : <p className="mt-3 text-sm leading-6 text-[var(--jf-muted)]">{empty}</p>}</section>;
}
