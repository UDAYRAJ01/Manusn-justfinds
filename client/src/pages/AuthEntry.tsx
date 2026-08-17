import { JustFindsLogo } from "@/components/JustFindsLogo";
import { Button } from "@/components/ui/button";
import { authEntryContent, secureSignInAction } from "@/lib/authEntryContent";
import { startLogin } from "@/const";
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function AuthEntry() {
  const [location] = useLocation();
  const content = authEntryContent[location as keyof typeof authEntryContent] ?? authEntryContent["/login"];

  return <div className="min-h-screen bg-[var(--jf-canvas)] text-[var(--jf-text)]">
    <header className="border-b border-[var(--jf-border)] bg-white"><div className="container flex h-16 items-center justify-between sm:h-[72px]"><JustFindsLogo /><Link href="/search" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[var(--jf-muted)] transition-colors hover:text-[var(--jf-primary)]"><ArrowLeft className="size-4" />Explore locally</Link></div></header>
    <main className="container grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-10 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))] sm:min-h-[calc(100vh-4.5rem)] sm:py-16"><section aria-labelledby="auth-entry-title" className="w-full max-w-[29rem] rounded-2xl border border-[var(--jf-border)] bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,.06)] sm:p-8"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-[var(--jf-primary)]"><LockKeyhole className="size-5" /></span><p className="mt-6 eyebrow">{content.eyebrow}</p><h1 id="auth-entry-title" className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[var(--jf-text)]">{content.title}</h1><p className="mt-3 text-sm leading-6 text-[var(--jf-muted)]">{content.description}</p><Button onClick={() => startLogin()} className="mt-7 h-12 w-full rounded-xl">{secureSignInAction}<ArrowRight className="ml-2 size-4" /></Button><div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs leading-5 text-[var(--jf-muted)]"><p className="flex items-center gap-1.5 font-semibold text-slate-800"><ShieldCheck className="size-4 text-emerald-600" />Private, managed sign-in</p><p className="mt-1">This page sends you to the secure sign-in service. It does not collect a password here.</p></div><p className="mt-5 text-center text-xs leading-5 text-[var(--jf-muted)]">Need to browse first? <Link href="/search" className="font-semibold text-[var(--jf-primary)] hover:underline">Return to local discovery</Link>.</p></section></main>
  </div>;
}
