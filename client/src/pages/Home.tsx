import { BusinessCard, BusinessCardData } from "@/components/BusinessCard";
import { LocationPill, PageFrame } from "@/components/PageFrame";
import { SearchHero } from "@/components/SearchHero";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BriefcaseBusiness, Building2, ChevronRight, HeartPulse, Hotel, MapPin, Utensils, Wrench } from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";

const iconMap: Record<string, React.ElementType> = { HeartPulse, Utensils, Wrench, BriefcaseBusiness, Hotel, Building2 };
const categoryTones = ["bg-blue-50 text-blue-600", "bg-orange-50 text-orange-600", "bg-indigo-50 text-indigo-600", "bg-sky-50 text-sky-600", "bg-emerald-50 text-emerald-600", "bg-violet-50 text-violet-600"];

export default function Home() {
  const searchInput = useMemo(() => ({ query: "", offset: 0, limit: 6 }), []);
  const { data: featured, isLoading } = trpc.discovery.search.useQuery(searchInput);
  const { data: categories } = trpc.discovery.categories.useQuery();
  const cardItems = (featured?.items ?? []) as BusinessCardData[];
  const discoveryCategories = (categories ?? []).slice(0, 5);

  return <PageFrame>
    <section className="border-b border-[var(--jf-border)] bg-[#f8fafc]">
      <div className="container grid gap-7 py-10 sm:py-14 lg:grid-cols-12 lg:items-center lg:gap-10 lg:py-20">
        <div className="lg:col-span-7">
          <span className="jf-kicker"><MapPin className="size-3.5" />India-first local discovery</span>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-bold leading-[1.08] tracking-[-.05em] text-[var(--jf-text)] sm:text-5xl lg:text-[3.5rem]">What are you looking for,<br /><span className="text-[var(--jf-primary)]">and where?</span></h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-[var(--jf-muted)] sm:text-lg">Search local businesses, services, and opportunities with clear information before you decide.</p>
          <div className="jf-home-search mt-7"><SearchHero /></div>
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 text-xs font-bold text-[var(--jf-muted)]">Try a search:</span>
            {["Hospitals", "Restaurants", "Electricians", "Doctors", "Hotels", "Jobs"].map(item => <Link key={item} href={`/search?query=${encodeURIComponent(item)}`} className="shrink-0 rounded-full border border-[var(--jf-border)] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:text-[var(--jf-primary)]">{item}</Link>)}
          </div>
        </div>
        <aside className="jf-card rounded-[22px] p-5 sm:p-6 lg:col-span-5" aria-label="Browse factual categories">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--jf-primary)]">Browse locally</p>
          <h2 className="mt-2 text-xl font-bold tracking-[-.035em] text-[var(--jf-text)]">Start with a category</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--jf-muted)]">Choose the kind of local business or service you need.</p>
          {discoveryCategories.length ? <div className="mt-5 grid gap-2">{discoveryCategories.map((category, index) => {
            const Icon = iconMap[category.icon] ?? Building2;
            return <Link key={category.slug} href={`/search?category=${category.slug}`} className="group flex min-h-11 items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-[var(--jf-border)] hover:bg-slate-50">
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${categoryTones[index % categoryTones.length]}`}><Icon className="size-4" /></span>
              <span className="flex-1 text-sm font-semibold text-[var(--jf-text)]">{category.name}</span>
              <ChevronRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--jf-primary)]" />
            </Link>;
          })}</div> : <div className="jf-empty mt-5 text-sm text-[var(--jf-muted)]">Categories will appear here when they are available.</div>}
          <Link href="/categories" className="mt-5 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--jf-primary)]">Explore all categories <ArrowRight className="size-4" /></Link>
        </aside>
      </div>
    </section>

    <section className="border-b border-[var(--jf-border)] bg-white py-5 sm:py-6">
      <div className="container"><div className="flex items-center gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Browse categories">
        <span className="shrink-0 text-xs font-bold uppercase tracking-[.12em] text-[var(--jf-muted)]">Explore</span>
        {(categories ?? []).slice(0, 10).map(category => <Link key={category.slug} href={`/search?category=${category.slug}`} className="shrink-0 rounded-full border border-[var(--jf-border)] bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[var(--jf-primary)]">{category.name}</Link>)}
      </div></div>
    </section>

    <section className="jf-section"><div className="container"><SectionHeading eyebrow="Explore by category" title="Find the local help you need" description="Browse the current business and service categories on Just Finds." action={{ href: "/categories", label: "View all categories" }} /><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{(categories ?? []).slice(0, 12).map((category, index) => { const Icon = iconMap[category.icon] ?? Building2; return <Link href={`/search?category=${category.slug}`} key={category.slug} className="jf-card jf-card-interactive group flex min-h-[104px] items-center gap-3 rounded-2xl p-4"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${categoryTones[index % categoryTones.length]}`}><Icon className="size-5" /></span><p className="text-sm font-bold tracking-[-.02em] text-[var(--jf-text)]">{category.name}</p></Link>; })}</div></div></section>

    <section className="border-y border-[var(--jf-border)] bg-white"><div className="container jf-section"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><SectionHeading eyebrow="Published profiles" title="Available local profiles" description="Browse the current profiles available on Just Finds." /><div className="flex items-center gap-2"><LocationPill /><Link href="/search" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--jf-primary)]">Explore all <ChevronRight className="size-4" /></Link></div></div><div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{isLoading ? [...Array(3)].map((_, index) => <div key={index} className="h-64 animate-pulse rounded-[22px] bg-slate-100" aria-label="Loading local profiles" />) : cardItems.length ? cardItems.map(item => <BusinessCard item={item} key={item.id} />) : <div className="jf-empty col-span-full text-sm text-[var(--jf-muted)]">There are no published local profiles to show yet. Try browsing categories or searching by city.</div>}</div></div></section>
  </PageFrame>;
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: { href: string; label: string } }) {
  return <div className="flex items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--jf-primary)]">{eyebrow}</p><h2 className="mt-2 text-2xl font-bold tracking-[-.04em] text-[var(--jf-text)] sm:text-3xl">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--jf-muted)]">{description}</p></div>{action && <Link href={action.href} className="hidden min-h-11 shrink-0 items-center gap-1 text-sm font-bold text-[var(--jf-primary)] sm:inline-flex">{action.label}<ArrowRight className="size-4" /></Link>}</div>;
}
