import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { BriefcaseBusiness, Building2, ChevronDown, Heart, Home, LayoutDashboard, MapPin, Menu, Search, UserRound, X } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { JustFindsLogo } from "./JustFindsLogo";
import { NotificationBell } from "./NotificationBell";

const links = [
  { label: "Explore", href: "/search", icon: Search },
  { label: "Categories", href: "/categories", icon: Building2 },
  { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
];

export function PageFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [skipFocused, setSkipFocused] = useState(false);
  const { user } = useAuth();
  const canAccessAdmin = user?.role === "admin" || user?.role === "super_admin";
  const primaryHref = user ? "/business" : "/login";
  const primaryLabel = user ? "My listings" : "Sign in";

  return <div className={cn("min-h-screen bg-[#fbfcff] text-[#0e1b3d]", className)}>
    <a href="#main-content" className="skip-link" data-focused={skipFocused ? "true" : undefined} onFocus={() => setSkipFocused(true)} onBlur={() => setSkipFocused(false)}>Skip to main content</a>
    <header className="sticky top-0 z-40 border-b border-[#e8edf6] bg-white/95 text-[#0e1b3d] shadow-[0_4px_18px_rgba(15,36,82,.04)] backdrop-blur-xl">
      <div className="container flex h-[70px] items-center justify-between gap-3">
        <JustFindsLogo />
        <Link href="/search" className="hidden items-center gap-2 rounded-lg border border-[#e5eaf4] bg-[#fbfcff] px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm lg:inline-flex"><MapPin className="size-3.5 text-[#315cf3]" />Search by city<ChevronDown className="size-3.5 text-slate-400" /></Link>
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Main navigation">
          {links.map(link => <Link key={link.href} href={link.href} className={cn("rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors", location.startsWith(link.href) ? "bg-[#edf2ff] text-[#2457d6]" : "text-slate-700 hover:bg-[#f3f6ff] hover:text-[#2457d6]")}>{link.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <NotificationBell />
          <Button asChild variant="ghost" className="h-9 px-3 text-[13px] font-semibold text-slate-700 hover:bg-[#f3f6ff] hover:text-[#2457d6]"><Link href="/business">Manage a listing</Link></Button>
          {canAccessAdmin && <Button asChild variant="outline" className="h-9 rounded-lg border-[#c9d6f8] bg-white px-3 text-[13px] font-semibold text-[#2457d6] hover:bg-[#f5f8ff] hover:text-[#1e4dcc]"><Link href="/admin">Admin workspace</Link></Button>}
          <Button asChild className="h-9 rounded-lg bg-[#2f5bea] px-4 text-[13px] font-semibold shadow-[0_8px_16px_rgba(47,91,234,.18)] hover:bg-[#244bd0]"><Link href={primaryHref}>{primaryLabel}</Link></Button>
        </div>
        <div className="flex items-center gap-2 md:hidden"><NotificationBell /><button onClick={() => setMenuOpen(value => !value)} className="grid size-10 place-items-center rounded-xl border border-[#e5eaf4] bg-white text-[#0e1b3d] hover:bg-[#f3f6ff]" aria-label="Open navigation menu" aria-expanded={menuOpen}>{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button></div>
      </div>
      {menuOpen && <div className="border-t border-[#e8edf6] bg-white px-4 py-3 md:hidden"><div className="container grid gap-1 px-0">
        {links.map(link => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-[#f3f6ff]"><link.icon className="size-4 text-[#315cf3]" />{link.label}</Link>)}
        <Link href="/business" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-[#f3f6ff]"><LayoutDashboard className="size-4 text-[#315cf3]" />Manage a listing</Link>
        {canAccessAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-[#f3f6ff]"><LayoutDashboard className="size-4 text-[#315cf3]" />Admin workspace</Link>}
        <Link href={primaryHref} onClick={() => setMenuOpen(false)} className="mt-2 flex items-center justify-center rounded-xl bg-[#2f5bea] px-4 py-2.5 text-sm font-semibold text-white">{primaryLabel}</Link>
      </div></div>}
    </header>
    <main id="main-content" tabIndex={-1}>{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[560px] items-center justify-around rounded-t-[26px] border-x border-t border-[#dce4f1] bg-white/95 px-2 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_32px_rgba(14,27,61,.12)] backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
      <MobileNav href="/" icon={Home} label="Home" active={location === "/"} />
      <MobileNav href="/search" icon={Search} label="Search" active={location.startsWith("/search")} />
      <MobileNav href="/saved" icon={Heart} label="Saved" active={location.startsWith("/saved")} />
      <MobileNav href="/jobs" icon={BriefcaseBusiness} label="Jobs" active={location.startsWith("/jobs")} />
      <MobileNav href={primaryHref} icon={UserRound} label={user ? "Listings" : "Sign in"} active={location.startsWith("/business") || location === "/login"} />
    </nav>
    <footer className="border-t border-[#e6ebf4] bg-white pb-24 pt-10 text-[#0e1b3d] md:pb-10">
      <div className="container grid gap-8 md:grid-cols-[1.2fr_.8fr_.8fr_.9fr]">
        <div><JustFindsLogo /><p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">Find local businesses, services, and opportunities with clear, factual information.</p></div>
        <FooterColumn title="Discover" links={[{ href: "/categories", label: "Categories" }, { href: "/search", label: "Nearby businesses" }, { href: "/jobs", label: "Local jobs" }]} />
        <FooterColumn title="For business" links={[{ href: "/business", label: "Add a business" }, { href: "/business", label: "Manage a listing" }, { href: "/business", label: "Claim a listing" }]} />
        <div><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Ready to be found?</p><p className="mt-3 text-sm leading-6 text-slate-500">Create a factual business profile and manage it from your workspace.</p><Link href="/business" className="mt-4 inline-flex rounded-lg bg-[#2f5bea] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(47,91,234,.16)] hover:bg-[#244bd0]">Add your business</Link></div>
      </div>
      <div className="container mt-9 border-t border-[#edf0f6] pt-5 text-xs text-slate-400">© {new Date().getFullYear()} Just Finds. Local discovery with clearer information.</div>
    </footer>
  </div>;
}

function MobileNav({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active: boolean }) {
  return <Link href={href} className={cn("flex min-w-[58px] flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] font-bold transition-colors", active ? "bg-[#eaf0ff] text-[#2559d6]" : "text-slate-500 hover:bg-slate-50 hover:text-[#0e1b3d]")}><span className={cn("grid size-7 place-items-center rounded-xl", active && "bg-[#2559d6] text-white shadow-[0_5px_10px_rgba(37,89,214,.23)]")}><Icon className="size-[17px]" /></span>{label}</Link>;
}

function FooterColumn({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return <div><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">{title}</p><div className="mt-3 grid gap-2.5 text-sm font-medium text-slate-600">{links.map(link => <Link key={link.href + link.label} href={link.href} className="hover:text-[#2457d6]">{link.label}</Link>)}</div></div>;
}

export function LocationPill({ city = "Kanpur" }: { city?: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dae3f8] bg-[#f6f8ff] px-3 py-1.5 text-xs font-semibold text-[#284781] shadow-sm"><MapPin className="size-3.5 text-[#d46847]" />{city}</span>;
}
