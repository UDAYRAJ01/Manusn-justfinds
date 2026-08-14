import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { BriefcaseBusiness, Building2, Heart, Home, LayoutDashboard, MapPin, Menu, Search, UserRound, X } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { JustFindsLogo } from "./JustFindsLogo";

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
  return (
    <div className={cn("min-h-screen bg-[#f8f8f6] text-slate-950", className)}>
      <a
        href="#main-content"
        className="skip-link"
        data-focused={skipFocused ? "true" : undefined}
        onFocus={() => setSkipFocused(true)}
        onBlur={() => setSkipFocused(false)}
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#fcfcfa]/92 backdrop-blur-xl">
        <div className="container flex h-[72px] items-center justify-between gap-4">
          <JustFindsLogo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {links.map(link => (
              <Link key={link.href} href={link.href} className={cn("rounded-xl px-3.5 py-2 text-sm font-medium transition-colors", location.startsWith(link.href.split("?")[0]) ? "bg-blue-50 text-[#1f51c8]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" className="text-slate-700 hover:text-slate-950"><Link href="/business">Manage a listing</Link></Button>
            {canAccessAdmin && <Button asChild variant="outline" className="rounded-xl bg-white"><Link href="/admin">Admin workspace</Link></Button>}
            {user ? <Button asChild className="rounded-xl bg-[#173d9c] px-4 shadow-[0_8px_16px_rgba(23,61,156,.18)] hover:bg-[#123587]"><Link href="/business">My listings</Link></Button> : <Button asChild className="rounded-xl bg-[#173d9c] px-4 shadow-[0_8px_16px_rgba(23,61,156,.18)] hover:bg-[#123587]"><Link href="/login">Sign in</Link></Button>}
          </div>
          <button onClick={() => setMenuOpen(value => !value)} className="grid size-10 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 md:hidden" aria-label="Open navigation menu" aria-expanded={menuOpen}>
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuOpen && <div className="border-t border-slate-200 bg-[#fcfcfa] px-4 py-3 md:hidden">
          <div className="container grid gap-1 px-0">
            {links.map(link => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"><link.icon className="size-4 text-[#1f51c8]" />{link.label}</Link>)}
            <Link href="/business" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"><LayoutDashboard className="size-4 text-[#1f51c8]" />Manage a listing</Link>
            {canAccessAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"><LayoutDashboard className="size-4 text-[#1f51c8]" />Admin workspace</Link>}
            {user ? <Link href="/business" onClick={() => setMenuOpen(false)} className="mt-2 flex items-center justify-center rounded-xl bg-[#173d9c] px-4 py-2 text-sm font-medium text-white">My listings</Link> : <Link href="/login" onClick={() => setMenuOpen(false)} className="mt-2 flex items-center justify-center rounded-xl bg-[#173d9c] px-4 py-2 text-sm font-medium text-white">Sign in</Link>}
          </div>
        </div>}
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <nav className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-[420px] items-center justify-around rounded-2xl border border-white/50 bg-slate-950 px-2 py-2 shadow-[0_20px_45px_rgba(15,23,42,.32)] md:hidden" aria-label="Mobile navigation">
        <MobileNav href="/" icon={Home} label="Home" active={location === "/"} />
        <MobileNav href="/search" icon={Search} label="Search" active={location.startsWith("/search")} />
        <MobileNav href="/saved" icon={Heart} label="Saved" active={location.startsWith("/saved")} />
        <MobileNav href="/jobs" icon={BriefcaseBusiness} label="Jobs" active={location.startsWith("/jobs")} />
        <MobileNav href={user ? "/business" : "/login"} icon={UserRound} label={user ? "Listings" : "Sign in"} active={location.startsWith("/business") || location === "/login"} />
      </nav>
      <footer className="border-t border-slate-200 bg-white pb-24 pt-10 md:pb-10">
        <div className="container grid gap-8 md:grid-cols-[1.2fr_.8fr_.8fr]">
          <div><JustFindsLogo /><p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">A local discovery layer designed for clear business information, useful connections, and responsible search.</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Discover</p><div className="mt-3 grid gap-2 text-sm text-slate-600"><Link href="/search">Find nearby businesses</Link><Link href="/jobs">Explore local jobs</Link></div></div>
          <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">For businesses</p><div className="mt-3 grid gap-2 text-sm text-slate-600"><Link href="/business">Manage a listing</Link><Link href="/admin">Administrator access</Link></div></div>
        </div>
      </footer>
    </div>
  );
}

function MobileNav({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active: boolean }) {
  return <Link href={href} className={cn("flex min-w-12 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium", active ? "bg-white/15 text-white" : "text-slate-400")}><Icon className="size-[18px]" />{label}</Link>;
}

export function LocationPill({ city = "Kanpur" }: { city?: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm"><MapPin className="size-3.5 text-[#d25b3f]" />{city}</span>;
}
