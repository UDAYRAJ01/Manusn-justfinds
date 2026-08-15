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
    <section className="relative overflow-hidden border-b border-[#edf0f7] bg-[linear-gradient(180deg,#fbfcff_0%,#f5f8ff_100%)] pb-14 pt-12 sm:pb-20 sm:pt-20">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(ellipse_at_center_bottom,rgba(47,91,234,.10),transparent_68%)]" />
      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dce5fb] bg-white px-3 py-1.5 text-xs font-semibold text-[#3159c7] shadow-sm"><MapPin className="size-3.5" />Search businesses and services near you</span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold leading-[1.06] tracking-[-.06em] text-[#0c1d4a] sm:text-6xl">Find what you need,<br /><span className="text-[#315cf3]">near you.</span></h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-slate-600 sm:text-lg">Discover useful local businesses, services, places, and opportunities with clear information before you decide.</p>
        </div>
        <div className="relative mx-auto mt-8 max-w-4xl"><div className="absolute -inset-x-9 -inset-y-6 rounded-[36px] bg-white/60 blur-xl" /><div className="relative"><SearchHero /></div></div>
        <div className="relative mt-5 flex flex-wrap justify-center gap-2"><span className="px-2 py-1.5 text-xs font-bold text-slate-600">Popular searches:</span>{["Hospitals", "Restaurants", "Electricians", "Doctors", "Hotels", "Jobs"].map(item => <Link key={item} href={`/search?query=${encodeURIComponent(item)}`} className="rounded-full border border-[#e3e8f3] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-[#b9c9f5] hover:text-[#315cf3]">{item}</Link>)}</div>
      </div>
    </section>

    <section className="py-12 sm:py-16"><div className="container"><SectionHeading eyebrow="Browse locally" title="Explore categories" description="Start with the type of business or service you need." action={{ href: "/categories", label: "View all categories" }} /><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{(categories ?? []).slice(0, 12).map((category, index) => { const Icon = iconMap[category.icon] ?? Building2; return <Link href={`/search?category=${category.slug}`} key={category.slug} className="group flex min-h-32 flex-col items-center justify-center rounded-2xl border border-[#edf0f6] bg-white p-4 text-center shadow-[0_4px_14px_rgba(15,36,82,.035)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#c8d6fb] hover:shadow-[0_12px_24px_rgba(29,63,150,.08)]"><span className={`grid size-11 place-items-center rounded-2xl ${categoryTones[index % categoryTones.length]}`}><Icon className="size-5" /></span><p className="mt-3 text-sm font-bold tracking-[-.02em] text-[#17264b]">{category.name}</p><p className="mt-1 line-clamp-1 text-xs text-slate-500">{category.description ?? "Explore nearby"}</p></Link>; })}</div></div></section>

    <section className="border-y border-[#edf0f7] bg-white py-12 sm:py-16"><div className="container"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><SectionHeading eyebrow="Nearby businesses" title="Popular near you" description="Browse current business profiles based on the information available." /><div className="flex items-center gap-2"><LocationPill /><Link href="/search" className="inline-flex items-center gap-1 text-sm font-bold text-[#315cf3]">Explore all <ChevronRight className="size-4" /></Link></div></div><div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{isLoading ? [...Array(3)].map((_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-slate-100" />) : cardItems.length ? cardItems.map((item, index) => <BusinessCard item={item} imageIndex={index} key={item.id} />) : <div className="col-span-full rounded-2xl border border-dashed border-[#dce4f4] bg-[#fafcff] p-8 text-center text-sm text-slate-500">No local profiles are available for this view yet. Try a wider search.</div>}</div></div></section>

    <section className="py-12 sm:py-16"><div className="container grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-2xl border border-[#dbe4fb] bg-[linear-gradient(135deg,#f3f6ff,#fbfcff)] p-6 sm:p-8"><div className="flex size-11 items-center justify-center rounded-2xl bg-[#e3ebff] text-[#315cf3]"><Sparkles className="size-5" /></div><h2 className="mt-5 text-2xl font-bold tracking-[-.045em] text-[#10214d] sm:text-3xl">Tell Just Finds what you need.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">Search in plain language to find a business, service, place, or job opportunity that matches your local need.</p><Link href="/search" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#2f5bea] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(47,91,234,.18)] hover:bg-[#244bd0]">Try local search <ArrowRight className="size-4" /></Link></div><div className="rounded-2xl border border-[#edf0f7] bg-white p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#315cf3]">Search with confidence</p><div className="mt-5 grid gap-4"><ConfidenceItem icon={BadgeCheck} title="Business information" text="Clear categories, contact details, hours, and service information when a profile provides them." /><ConfidenceItem icon={ShieldCheck} title="Owner-managed profiles" text="Business owners can keep their information up to date through a dedicated workspace." /></div></div></div></section>

    <section className="pb-14 sm:pb-20"><div className="container"><div className="rounded-2xl border border-[#dbe4fb] bg-white p-6 shadow-[0_8px_24px_rgba(30,65,160,.05)] sm:flex sm:items-center sm:justify-between sm:p-8"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#315cf3]">For business owners</p><h2 className="mt-2 text-2xl font-bold tracking-[-.045em] text-[#10214d]">Own a business? Be easier to find.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Create and manage a factual local profile, respond to leads, and organize requests from one workspace.</p></div><div className="mt-5 flex flex-wrap gap-3 sm:mt-0"><Link href="/business"><Button className="rounded-lg bg-[#2f5bea] shadow-[0_8px_16px_rgba(47,91,234,.18)] hover:bg-[#244bd0]">Add your business</Button></Link><Link href="/business"><Button variant="outline" className="rounded-lg border-[#bfcdf5] text-[#3154bb] hover:bg-[#f5f7ff]">Manage listing</Button></Link></div></div></div></section>
  </PageFrame>;
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: { href: string; label: string } }) {
  return <div className="flex items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#315cf3]">{eyebrow}</p><h2 className="mt-2 text-2xl font-bold tracking-[-.045em] text-[#10214d] sm:text-3xl">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>{action && <Link href={action.href} className="hidden shrink-0 items-center gap-1 text-sm font-bold text-[#315cf3] sm:inline-flex">{action.label}<ArrowRight className="size-4" /></Link>}</div>;
}

function ConfidenceItem({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return <div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eff4ff] text-[#315cf3]"><Icon className="size-4" /></span><div><p className="text-sm font-bold text-[#17264b]">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div></div>;
}
