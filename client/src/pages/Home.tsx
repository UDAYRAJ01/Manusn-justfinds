import { Button } from "@/components/ui/button";
import { BusinessCard, BusinessCardData } from "@/components/BusinessCard";
import { LocationPill, PageFrame } from "@/components/PageFrame";
import { SearchHero } from "@/components/SearchHero";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, ChevronRight, HeartPulse, Hotel, MapPin, ShieldCheck, Sparkles, Utensils, Wrench } from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";

const iconMap: Record<string, React.ElementType> = { HeartPulse, Utensils, Wrench, BriefcaseBusiness, Hotel, Building2 };
const categoryTones = ["bg-[#e9f6f0] text-[#159365]", "bg-[#fff3e4] text-[#e87923]", "bg-[#eef1ff] text-[#5169dc]", "bg-[#f3efff] text-[#825ad2]", "bg-[#eef8f2] text-[#17876f]", "bg-[#eef3ff] text-[#315fda]"];

export default function Home() {
  const searchInput = useMemo(() => ({ query: "", offset: 0, limit: 3 }), []);
  const { data: featured, isLoading } = trpc.discovery.search.useQuery(searchInput);
  const { data: categories } = trpc.discovery.categories.useQuery();
  const cardItems = (featured?.items ?? []) as BusinessCardData[];

  return <PageFrame>
    <section className="border-b border-[var(--jf-border)] bg-white pb-14 pt-12 sm:pb-20 sm:pt-20">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[var(--jf-primary)]"><MapPin className="size-3.5" />Search businesses and services near you</span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold leading-[1.06] tracking-[-.05em] text-[var(--jf-text)] sm:text-6xl">Find what you need,<br /><span className="text-[var(--jf-primary)]">near you.</span></h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-[var(--jf-muted)] sm:text-lg">Discover useful local businesses, services, places, and opportunities with clear information before you decide.</p>
        </div>
        <div className="mx-auto mt-8 max-w-4xl"><SearchHero /></div>
        <div className="mt-5 flex flex-wrap justify-center gap-2"><span className="px-2 py-1.5 text-xs font-bold text-[var(--jf-muted)]">Popular searches:</span>{["Hospitals", "Restaurants", "Electricians", "Doctors", "Hotels", "Jobs"].map(item => <Link key={item} href={`/search?query=${encodeURIComponent(item)}`} className="rounded-full border border-[var(--jf-border)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:text-[var(--jf-primary)]">{item}</Link>)}</div>
      </div>
    </section>

    <section className="jf-section"><div className="container"><SectionHeading eyebrow="Browse locally" title="Explore categories" description="Start with the type of business or service you need." action={{ href: "/categories", label: "View all categories" }} /><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{(categories ?? []).slice(0, 12).map((category, index) => { const Icon = iconMap[category.icon] ?? Building2; return <Link href={`/search?category=${category.slug}`} key={category.slug} className="jf-card jf-card-interactive group flex min-h-32 flex-col items-center justify-center rounded-2xl p-4 text-center"><span className={`grid size-11 place-items-center rounded-xl ${categoryTones[index % categoryTones.length]}`}><Icon className="size-5" /></span><p className="mt-3 text-sm font-bold tracking-[-.02em] text-[var(--jf-text)]">{category.name}</p><p className="mt-1 line-clamp-1 text-xs text-[var(--jf-muted)]">{category.description ?? "Explore nearby"}</p></Link>; })}</div></div></section>

    <section className="border-y border-[var(--jf-border)] bg-white"><div className="container jf-section"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><SectionHeading eyebrow="Nearby businesses" title="Popular near you" description="Browse current business profiles based on the information available." /><div className="flex items-center gap-2"><LocationPill /><Link href="/search" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--jf-primary)]">Explore all <ChevronRight className="size-4" /></Link></div></div><div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{isLoading ? [...Array(3)].map((_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-slate-100" />) : cardItems.length ? cardItems.map((item, index) => <BusinessCard item={item} imageIndex={index} key={item.id} />) : <div className="jf-empty col-span-full text-sm text-[var(--jf-muted)]">No local profiles are available for this view yet. Try a wider search.</div>}</div></div></section>

    <section className="jf-section"><div className="container grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="jf-card rounded-2xl p-6 sm:p-8"><div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-[var(--jf-primary)]"><Sparkles className="size-5" /></div><h2 className="mt-5 text-2xl font-bold tracking-[-.04em] text-[var(--jf-text)] sm:text-3xl">Tell Just Finds what you need.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-[var(--jf-muted)]">Search in plain language to find a business, service, place, or job opportunity that matches your local need.</p><Link href="/search" className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-[var(--jf-primary)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--jf-primary-hover)]">Try local search <ArrowRight className="size-4" /></Link></div><div className="jf-card rounded-2xl p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--jf-primary)]">Search with confidence</p><div className="mt-5 grid gap-4"><ConfidenceItem icon={BadgeCheck} title="Business information" text="Clear categories, contact details, hours, and service information when a profile provides them." /><ConfidenceItem icon={ShieldCheck} title="Owner-managed profiles" text="Business owners can keep their information up to date through a dedicated workspace." /></div></div></div></section>

    <section className="pb-14 sm:pb-20"><div className="container"><div className="jf-card rounded-2xl p-6 sm:flex sm:items-center sm:justify-between sm:p-8"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--jf-primary)]">For business owners</p><h2 className="mt-2 text-2xl font-bold tracking-[-.04em] text-[var(--jf-text)]">Own a business? Be easier to find.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--jf-muted)]">Create and manage a factual local profile, respond to leads, and organize requests from one workspace.</p></div><div className="mt-5 flex flex-wrap gap-3 sm:mt-0"><Link href="/business"><Button>Add your business</Button></Link><Link href="/business"><Button variant="outline" className="border-blue-200 text-[var(--jf-primary)] hover:bg-blue-50">Manage listing</Button></Link></div></div></div></section>
  </PageFrame>;
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: { href: string; label: string } }) {
  return <div className="flex items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--jf-primary)]">{eyebrow}</p><h2 className="mt-2 text-2xl font-bold tracking-[-.04em] text-[var(--jf-text)] sm:text-3xl">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--jf-muted)]">{description}</p></div>{action && <Link href={action.href} className="hidden shrink-0 items-center gap-1 text-sm font-bold text-[var(--jf-primary)] sm:inline-flex">{action.label}<ArrowRight className="size-4" /></Link>}</div>;
}

function ConfidenceItem({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return <div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-blue-50 text-[var(--jf-primary)]"><Icon className="size-4" /></span><div><p className="text-sm font-bold text-[var(--jf-text)]">{title}</p><p className="mt-1 text-xs leading-5 text-[var(--jf-muted)]">{text}</p></div></div>;
}
