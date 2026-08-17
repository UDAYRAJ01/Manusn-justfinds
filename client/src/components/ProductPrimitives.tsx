import { cn } from "@/lib/utils";
import { CircleAlert, CircleCheck, CircleDashed, type LucideIcon } from "lucide-react";
import React from "react";
import { Link, useLocation } from "wouter";

export type StatusTone = "neutral" | "info" | "positive" | "warning" | "danger";

export const statusToneClasses: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
};

export function StatusBadge({ label, tone = "neutral", icon: Icon, detail, className }: { label: string; tone?: StatusTone; icon?: LucideIcon; detail?: string; className?: string }) {
  return <span title={detail} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold", statusToneClasses[tone], className)}>{Icon && <Icon aria-hidden className="size-3.5" />}{label}</span>;
}

export function SectionHeader({ eyebrow, title, description, action, className }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}><div className="min-w-0">{eyebrow && <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--jf-primary)]">{eyebrow}</p>}<h2 className="mt-1 text-xl font-bold tracking-[-.04em] text-[var(--jf-text)]">{title}</h2>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--jf-muted)]">{description}</p>}</div>{action && <div className="shrink-0">{action}</div>}</div>;
}

export function EmptyState({ title, description, icon: Icon = CircleDashed, action, className }: { title: string; description: string; icon?: LucideIcon; action?: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center", className)}><Icon className="mx-auto size-7 text-slate-400" aria-hidden /><p className="mt-3 text-sm font-semibold text-slate-800">{title}</p><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">{description}</p>{action && <div className="mt-4 flex justify-center">{action}</div>}</div>;
}

export function MetricCard({ label, value, helper, tone = "neutral", icon: Icon, className }: { label: string; value: React.ReactNode; helper?: string; tone?: StatusTone; icon?: LucideIcon; className?: string }) {
  const iconClass = tone === "positive" ? "bg-emerald-50 text-emerald-700" : tone === "warning" ? "bg-amber-50 text-amber-800" : tone === "danger" ? "bg-rose-50 text-rose-700" : tone === "info" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600";
  return <section className={cn("rounded-2xl border border-slate-200 bg-white p-4", className)}><div className="flex items-start justify-between gap-3"><p className="text-xs font-bold text-slate-500">{label}</p>{Icon && <span className={cn("grid size-8 place-items-center rounded-xl", iconClass)}><Icon className="size-4" aria-hidden /></span>}</div><p className="mt-2 text-2xl font-bold tracking-[-.05em] text-[var(--jf-text)]">{value}</p>{helper && <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>}</section>;
}

export function DataTable({ title, description, children, className }: { title?: string; description?: string; children: React.ReactNode; className?: string }) {
  return <section className={cn("overflow-hidden rounded-2xl border border-slate-200 bg-white", className)}>{(title || description) && <div className="border-b border-slate-100 px-5 py-4">{title && <h3 className="font-bold text-slate-900">{title}</h3>}{description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}</div>}<div className="overflow-x-auto">{children}</div></section>;
}

export type MobileBottomNavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

export function isNavigationItemActive(location: string, item: Pick<MobileBottomNavItem, "href" | "exact">) {
  return item.exact || item.href === "/" ? location === item.href : location === item.href || location.startsWith(`${item.href}/`);
}

export function MobileBottomNav({ items, tone = "light", label = "Mobile navigation", className }: { items: MobileBottomNavItem[]; tone?: "light" | "dark"; label?: string; className?: string }) {
  const [location] = useLocation();
  const dark = tone === "dark";
  return <nav className={cn("fixed inset-x-0 bottom-0 z-50 mx-auto grid max-w-[640px] grid-flow-col auto-cols-fr border-x border-t px-1 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_24px_rgba(15,23,42,.10)] backdrop-blur", dark ? "border-slate-800 bg-[#0f172a]/95" : "border-[var(--jf-border)] bg-white/95", className)} aria-label={label}>{items.map(item => { const active = isNavigationItemActive(location, item); return <Link href={item.href} key={item.href} className={cn("grid min-h-12 place-items-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-bold transition-colors", active ? dark ? "text-blue-200" : "bg-blue-50 text-[var(--jf-primary)]" : dark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-[var(--jf-muted)] hover:bg-slate-50 hover:text-[var(--jf-text)]")}><span className={cn("grid size-7 place-items-center rounded-lg", active && !dark && "bg-[var(--jf-primary)] text-white shadow-sm")}><item.icon className="size-4" aria-hidden /></span><span className="max-w-full truncate">{item.label}</span></Link>; })}</nav>;
}

export function StickyActionBar({ children, label = "Actions", className }: { children: React.ReactNode; label?: string; className?: string }) {
  return <div className={cn("sticky bottom-0 z-20 -mx-4 border-t border-[var(--jf-border)] bg-white/95 px-4 py-3 shadow-[0_-8px_20px_rgba(15,23,42,.06)] backdrop-blur sm:mx-0 sm:rounded-b-2xl sm:border-x", className)} role="group" aria-label={label}>{children}</div>;
}

export const feedbackIcons = { success: CircleCheck, error: CircleAlert };
