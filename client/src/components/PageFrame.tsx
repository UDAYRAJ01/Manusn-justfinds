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

  return <div className={cn("jf-page flex min-h-screen flex-col text-[var(--jf-text)]", className)}>
    <a href="#main-content" className="skip-link" data-focused={skipFocused ? "true" : undefined} onFocus={() => setSkipFocused(true)} onBlur={() => setSkipFocused(false)}>Skip to main content</a>
    <header className="sticky top-0 z-40 border-b border-[var(--jf-border)] bg-white/95 shadow-[0_1px_0_rgba(15,23,42,.02)] backdrop-blur-xl">
      <div className="container flex h-[68px] items-center justify-between gap-3">
        <JustFindsLogo />
        <Link href="/search" className="hidden items-center gap-2 rounded-xl border border-[var(--jf-border)] bg-slate-50/70 px-3 py-2 text-xs font-semibold text-[var(--jf-muted)] transition-colors hover:border-blue-200 hover:bg-blue-50/70 lg:inline-flex"><MapPin className="size-3.5 text-[var(--jf-primary)]" />Search by city<ChevronDown className="size-3.5 text-slate-400" /></Link>
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Main navigation">
          {links.map(link => <Link key={link.href} href={link.href} className={cn("rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors", location.startsWith(link.href) ? "bg-blue-50 text-[var(--jf-primary)]" : "text-slate-700 hover:bg-slate-50 hover:text-[var(--jf-primary)]")}>{link.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <NotificationBell />
          <Button asChild variant="ghost" size="sm" className="px-3 text-[13px] text-slate-700 hover:text-[var(--jf-primary)]"><Link href="/business">Manage a listing</Link></Button>
          {canAccessAdmin && <Button asChild variant="outline" size="sm" className="border-blue-200 px-3 text-[13px] text-[var(--jf-primary)] hover:bg-blue-50 hover:text-[var(--jf-primary)]"><Link href="/admin">Admin workspace</Link></Button>}
          <Button asChild size="sm" className="jf-action-primary px-4 text-[13px]"><Link href={primaryHref}>{primaryLabel}</Link></Button>
        </div>
        <div className="flex items-center gap-2 md:hidden"><NotificationBell /><button onClick={() => setMenuOpen(value => !value)} className="grid size-10 place-items-center rounded-[10px] border border-[var(--jf-border)] bg-white text-[var(--jf-text)] hover:bg-slate-50" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen}>{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button></div>
      </div>
      {menuOpen && <div className="border-t border-[var(--jf-border)] bg-white px-4 py-3 md:hidden"><div className="container grid gap-1 px-0">
        {links.map(link => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><link.icon className="size-4 text-[var(--jf-primary)]" />{link.label}</Link>)}
        <Link href="/business" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><LayoutDashboard className="size-4 text-[var(--jf-primary)]" />Manage a listing</Link>
        {canAccessAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><LayoutDashboard className="size-4 text-[var(--jf-primary)]" />Admin workspace</Link>}
        <Link href={primaryHref} onClick={() => setMenuOpen(false)} className="jf-action-primary mt-2 flex items-center justify-center px-4 py-3 text-sm font-semibold">{primaryLabel}</Link>
      </div></div>}
    </header>
    <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[640px] items-center justify-around rounded-t-[1.35rem] border-x border-t border-[var(--jf-border)] bg-white/95 px-2 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_28px_rgba(15,23,42,.10)] backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
      <MobileNav href="/" icon={Home} label="Home" active={location === "/"} />
      <MobileNav href="/search" icon={Search} label="Search" active={location.startsWith("/search")} />
      <MobileNav href="/saved" icon={Heart} label="Saved" active={location.startsWith("/saved")} />
      <MobileNav href="/jobs" icon={BriefcaseBusiness} label="Jobs" active={location.startsWith("/jobs")} />
      <MobileNav href={primaryHref} icon={UserRound} label={user ? "Listings" : "Sign in"} active={location.startsWith("/business") || location === "/login"} />
    </nav>
    <footer className="border-t border-[var(--jf-border)] bg-white pb-24 pt-10 text-[var(--jf-text)] md:pb-10">
      <div className="container grid gap-8 md:grid-cols-[1.2fr_.8fr_.8fr_.9fr]">
        <div><JustFindsLogo /><p className="mt-4 max-w-sm text-sm leading-6 text-[var(--jf-muted)]">Find local businesses, services, and opportunities with clear, factual information.</p></div>
        <FooterColumn title="Discover" links={[{ href: "/categories", label: "Categories" }, { href: "/search", label: "Nearby businesses" }, { href: "/jobs", label: "Local jobs" }]} />
        <FooterColumn title="For business" links={[{ href: "/business", label: "Add a business" }, { href: "/business", label: "Manage a listing" }, { href: "/business", label: "Claim a listing" }]} />
        <div><p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--jf-muted)]">Ready to be found?</p><p className="mt-3 text-sm leading-6 text-[var(--jf-muted)]">Create a factual business profile and manage it from your workspace.</p><Link href="/business" className="jf-action-primary mt-4 inline-flex px-4 py-2.5 text-sm font-semibold">Add your business</Link></div>
      </div>
      <div className="container mt-9 border-t border-slate-100 pt-5 text-xs text-slate-400">© {new Date().getFullYear()} Just Finds. Local discovery with clearer information.</div>
    </footer>
  </div>;
}

function MobileNav({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active: boolean }) {
  return <Link href={href} className={cn("flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition-colors", active ? "bg-blue-50 text-[var(--jf-primary)]" : "text-[var(--jf-muted)] hover:bg-slate-50 hover:text-[var(--jf-text)]")}><span className={cn("grid size-7 place-items-center rounded-lg", active && "bg-[var(--jf-primary)] text-white shadow-sm")}><Icon className="size-[17px]" /></span>{label}</Link>;
}

function FooterColumn({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return <div><p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--jf-muted)]">{title}</p><div className="mt-3 grid gap-2.5 text-sm font-medium text-slate-600">{links.map(link => <Link key={link.href + link.label} href={link.href} className="hover:text-[var(--jf-primary)]">{link.label}</Link>)}</div></div>;
}

export function LocationPill({ city = "Kanpur" }: { city?: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800"><MapPin className="size-3.5 text-[var(--jf-primary)]" />{city}</span>;
}
