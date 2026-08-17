import { startLogin } from "@/const";
import { JustFindsLogo } from "@/components/JustFindsLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronRight, CircleHelp, LogOut, Menu, X } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "wouter";

export type WorkspaceNavItem = { href: string; label: string; icon: React.ElementType };

type WorkspaceShellProps = {
  title: string;
  subtitle: string;
  items: WorkspaceNavItem[];
  children: React.ReactNode;
  requireAdmin?: boolean;
  context?: React.ReactNode;
};

export function WorkspaceShell({ title, subtitle, items, children, requireAdmin = false, context }: WorkspaceShellProps) {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const adminAllowed = user?.role === "admin" || user?.role === "super_admin";
  const ownerMode = items.some(item => item.href === "/business");
  const topItems = items.slice(0, 5);
  const isActive = (href: string) => location === href || (href !== "/owner" && location.startsWith(`${href}/`));

  if (loading) return <div className="jf-workspace-page p-6"><div className="h-10 w-32 animate-pulse rounded-xl bg-slate-200" /><div className="mt-10 h-80 animate-pulse rounded-3xl bg-slate-100" /></div>;
  if (!user || (requireAdmin && !adminAllowed)) return <div className="jf-workspace-page grid min-h-screen place-items-center p-5"><div className="jf-card max-w-md rounded-3xl p-8 text-center"><JustFindsLogo /><h1 className="mt-8 text-2xl font-semibold tracking-[-.04em] text-[var(--jf-text)]">{requireAdmin && user ? "Administrator access required" : "Sign in to continue"}</h1><p className="mt-3 text-sm leading-6 text-[var(--jf-muted)]">{requireAdmin && user ? "This workspace is protected for Just Finds administrators." : "Business and administration workspaces use your Just Finds account to keep data isolated."}</p><div className="mt-7 flex justify-center gap-3"><Button asChild variant="outline"><Link href="/"><ArrowLeft className="mr-2 size-4" />Home</Link></Button>{!user && <Button className="jf-action-primary" onClick={() => startLogin()}>Sign in</Button>}</div></div></div>;

  const sidebarBase = ownerMode ? "border-slate-800 bg-[#0f172a] text-white shadow-[10px_0_30px_rgba(15,23,42,.15)]" : "border-[var(--jf-border)] bg-white text-[var(--jf-text)] shadow-[10px_0_24px_rgba(15,23,42,.045)]";
  const muted = ownerMode ? "text-slate-400" : "text-[var(--jf-muted)]";
  const inactiveNav = ownerMode ? "text-slate-300 hover:bg-white/8 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-[var(--jf-primary)]";

  return <div className="jf-workspace-page text-[var(--jf-text)]"><a href="#workspace-main" className="skip-link">Skip to workspace content</a><div className="flex min-h-screen"><aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r p-4 transition-transform duration-200 md:sticky md:translate-x-0", sidebarBase, open ? "translate-x-0" : "-translate-x-full")}><div className="flex items-center justify-between px-2 py-2"><JustFindsLogo /><button onClick={() => setOpen(false)} className={cn("grid size-9 place-items-center rounded-xl md:hidden", ownerMode ? "text-slate-300 hover:bg-white/10" : "text-[var(--jf-muted)] hover:bg-slate-100")} aria-label="Close menu"><X className="size-4" /></button></div><div className={cn("mt-6 rounded-2xl border px-3.5 py-3.5", ownerMode ? "border-white/10 bg-white/6" : "border-blue-100 bg-blue-50/75")}><p className={cn("text-[10px] font-extrabold uppercase tracking-[.14em]", ownerMode ? "text-blue-300" : "text-[var(--jf-primary)]")}>{title}</p><p className={cn("mt-1 text-xs leading-5", muted)}>{subtitle}</p></div>{context && <div className={cn("mt-3", ownerMode ? "[&_select]:border-white/10 [&_select]:bg-slate-900 [&_select]:text-white" : "")}>{context}</div>}<nav className="mt-6 grid gap-1" aria-label={`${title} navigation`}>{items.map(item => { const active = isActive(item.href); return <Link href={item.href} key={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors", active ? "bg-[var(--jf-primary)] text-white shadow-sm" : inactiveNav)}><item.icon className="size-[18px]" />{item.label}{active && <ChevronRight className="ml-auto size-4" />}</Link>; })}</nav><div className={cn("mt-auto rounded-2xl border p-3", ownerMode ? "border-white/10 bg-white/6" : "border-[var(--jf-border)] bg-slate-50/80")}><div className="flex items-center gap-2.5"><span className={cn("grid size-10 place-items-center rounded-xl text-sm font-bold", ownerMode ? "bg-blue-500/20 text-blue-200" : "bg-blue-100 text-[var(--jf-primary)]")}>{user.name?.slice(0, 1).toUpperCase() ?? "J"}</span><div className="min-w-0"><p className={cn("truncate text-xs font-bold", ownerMode ? "text-white" : "text-slate-900")}>{user.name ?? "Just Finds user"}</p><p className={cn("truncate text-[11px] capitalize", muted)}>{user.role.replace(/_/g, " ")}</p></div></div>{ownerMode && <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-4 text-slate-400"><CircleHelp className="mt-0.5 size-3.5 shrink-0" />Review and completion messages appear in your selected listing workspace.</p>}<button onClick={logout} className={cn("mt-3 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold", muted, ownerMode ? "hover:bg-white/8 hover:text-white" : "hover:bg-white hover:text-rose-700")}><LogOut className="size-3.5" />Sign out</button></div></aside>{open && <button onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-slate-950/30 md:hidden" aria-label="Close menu" />}<div className="min-w-0 flex-1"><header className="jf-toolbar sticky top-0 z-30 px-4 md:px-8"><button onClick={() => setOpen(true)} className="mr-3 grid size-10 place-items-center rounded-xl border border-[var(--jf-border)] bg-white text-slate-700 hover:bg-slate-50 md:hidden" aria-label="Open workspace menu"><Menu className="size-4" /></button><div><p className="text-sm font-bold text-[var(--jf-text)]">{title}</p><p className="text-xs text-[var(--jf-muted)]">{subtitle}</p></div><Link href="/" className="ml-auto rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-[var(--jf-primary)] shadow-sm transition-colors hover:bg-blue-50">View public site</Link></header><main id="workspace-main" tabIndex={-1} className="p-4 pb-28 md:p-8 md:pb-10">{children}</main></div></div><nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--jf-border)] bg-white/95 px-1 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_20px_rgba(15,23,42,.06)] backdrop-blur md:hidden" aria-label={`${title} quick navigation`}>{topItems.map(item => { const active = isActive(item.href); return <Link href={item.href} key={item.href} className={cn("grid min-h-12 place-items-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-bold", active ? "text-[var(--jf-primary)]" : "text-slate-500")}><item.icon className="size-4" /><span className="max-w-full truncate">{item.label}</span></Link>; })}</nav></div>;
}
