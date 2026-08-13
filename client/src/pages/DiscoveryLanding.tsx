import { PageFrame } from "@/components/PageFrame";
import { SearchHero } from "@/components/SearchHero";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowRight, MapPin, SearchX, Tag } from "lucide-react";
import { Link, useLocation } from "wouter";

function titleCase(value: string) { return value.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }

export function CategoryLanding() {
  const [location] = useLocation();
  const [, categorySlug, subcategorySlug] = location.split("?")[0].split("/").filter(Boolean);
  const { data: category, isLoading } = trpc.discovery.category.useQuery({ slug: categorySlug ?? "" }, { enabled: Boolean(categorySlug) });
  const { data: subcategories } = trpc.discovery.subcategories.useQuery({ category: categorySlug ?? "" }, { enabled: Boolean(categorySlug) });
  const label = category?.name ?? titleCase(categorySlug ?? "Category");
  const query = new URLSearchParams({ category: categorySlug ?? "" });
  if (subcategorySlug) query.set("subcategory", subcategorySlug);
  return <PageFrame><section className="border-b border-slate-200 bg-[#f8f8f6] py-5"><div className="container"><SearchHero compact initialQuery={label} /></div></section><section className="container py-12 sm:py-16">{isLoading ? <div className="h-48 animate-pulse rounded-3xl bg-slate-100" /> : !category ? <LandingUnavailable label="category" /> : <><p className="eyebrow">Category discovery</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.055em] text-slate-950 sm:text-5xl">{subcategorySlug ? `${titleCase(subcategorySlug)} in ${label}` : label}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{category.description ?? "Browse published local profiles using the fields and filters configured for this category."}</p><Link href={`/search?${query.toString()}`}><Button className="mt-7 rounded-xl bg-[#173d9c]">Browse published profiles <ArrowRight className="ml-2 size-4" /></Button></Link>{!subcategorySlug && <div className="mt-12"><h2 className="text-2xl font-semibold tracking-[-.04em] text-slate-900">Subcategories</h2>{subcategories?.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{subcategories.map(item => <Link key={item.id} href={`/category/${categorySlug}/${item.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"><Tag className="size-4 text-[#1f51c8]" /><h3 className="mt-4 font-semibold text-slate-900">{item.name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{item.description ?? "Browse published profiles in this subcategory."}</p></Link>)}</div> : <p className="mt-4 text-sm text-slate-500">Subcategories will appear here once they are configured by an administrator.</p>}</div>}</>}</section></PageFrame>;
}

export function CityLanding() {
  const [location] = useLocation();
  const [, citySlug, localitySlug] = location.split("?")[0].split("/").filter(Boolean);
  const { data: city, isLoading } = trpc.discovery.city.useQuery({ slug: citySlug ?? "" }, { enabled: Boolean(citySlug) });
  const { data: localities } = trpc.discovery.localities.useQuery({ city: citySlug ?? "" }, { enabled: Boolean(citySlug) });
  const label = city?.name ?? titleCase(citySlug ?? "City");
  const query = new URLSearchParams({ city: citySlug ?? "" });
  if (localitySlug) query.set("locality", localitySlug);
  return <PageFrame><section className="border-b border-slate-200 bg-[#f8f8f6] py-5"><div className="container"><SearchHero compact initialCity={citySlug} initialLocality={localitySlug} /></div></section><section className="container py-12 sm:py-16">{isLoading ? <div className="h-48 animate-pulse rounded-3xl bg-slate-100" /> : !city ? <LandingUnavailable label="city" /> : <><p className="eyebrow">Location discovery</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.055em] text-slate-950 sm:text-5xl">{localitySlug ? `${titleCase(localitySlug)}, ${label}` : label}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Browse published local profiles in this location. Distance ordering becomes available when a visitor shares approximate device location.</p><Link href={`/search?${query.toString()}`}><Button className="mt-7 rounded-xl bg-[#173d9c]">Search this location <ArrowRight className="ml-2 size-4" /></Button></Link>{!localitySlug && <div className="mt-12"><h2 className="text-2xl font-semibold tracking-[-.04em] text-slate-900">Localities</h2>{localities?.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{localities.map(item => <Link key={item.id} href={`/city/${citySlug}/${item.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"><MapPin className="size-4 text-[#d25b3f]" /><h3 className="mt-4 font-semibold text-slate-900">{item.name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">View published profiles in this locality.</p></Link>)}</div> : <p className="mt-4 text-sm text-slate-500">Localities will appear here once they are configured by an administrator.</p>}</div>}</>}</section></PageFrame>;
}

function LandingUnavailable({ label }: { label: string }) { return <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><SearchX className="mx-auto size-8 text-slate-400" /><h1 className="mt-3 text-xl font-semibold text-slate-800">This {label} is not available</h1><p className="mt-2 text-sm text-slate-500">It may be inactive or not yet configured for public discovery.</p><Link href="/search"><Button variant="outline" className="mt-5 rounded-xl">Return to search</Button></Link></div>; }
