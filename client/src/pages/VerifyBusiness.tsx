import React from "react";
import { PageFrame } from "@/components/PageFrame";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { publicVerificationStatus, verificationEvidenceGuidance } from "@/lib/utilityPageContent";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, CircleAlert, FileCheck2, LockKeyhole, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function VerifyBusiness({ params }: { params: { slug: string } }) {
  const { data, isLoading } = trpc.discovery.certificate.useQuery({ slug: params.slug }, { enabled: Boolean(params.slug) });

  if (isLoading) {
    return <PageFrame><div className="container py-12 sm:py-16"><div className="mx-auto max-w-3xl animate-pulse rounded-3xl border border-[var(--jf-border)] bg-white p-6 sm:p-8"><div className="h-5 w-36 rounded bg-slate-200" /><div className="mt-5 h-10 w-2/3 rounded bg-slate-100" /><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="h-28 rounded-2xl bg-slate-100" /><div className="h-28 rounded-2xl bg-slate-100" /><div className="h-28 rounded-2xl bg-slate-100" /></div></div></div></PageFrame>;
  }

  if (!data) {
    return <PageFrame><PageMeta /><main className="container py-12 sm:py-20"><section className="mx-auto max-w-xl rounded-3xl border border-[var(--jf-border)] bg-white p-6 text-center shadow-sm sm:p-10"><CircleAlert className="mx-auto size-9 text-[var(--jf-warning)]" /><p className="mt-5 text-xs font-semibold uppercase tracking-[.16em] text-[var(--jf-muted)]">Verification record</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--jf-text)]">Verification link unavailable</h1><p className="mt-3 text-sm leading-6 text-[var(--jf-muted)]">Just Finds could not find a published business record for this link. Secure evidence and private review information are never shown here.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild><Link href="/search">Search businesses</Link></Button><Button asChild variant="outline"><Link href="/categories">Browse categories</Link></Button></div></section></main></PageFrame>;
  }

  const { business, certificate } = data;
  const status = publicVerificationStatus(data.valid);
  const statusClasses = status.tone === "verified" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900";

  return <PageFrame><PageMeta business={{ name: business.name, address: business.address }} /><main className="container py-8 sm:py-12"><div className="mx-auto max-w-3xl"><header className="rounded-3xl border border-[var(--jf-border)] bg-white px-6 py-7 shadow-sm sm:px-8"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[var(--jf-primary)]"><ShieldCheck className="size-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--jf-primary)]">Just Finds verification</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--jf-text)] sm:text-3xl">Business verification record</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--jf-muted)]">This page confirms the status recorded for a published Just Finds listing. It does not endorse business claims, ratings, reviews, or guarantees.</p></div></div></header>

  <section className="mt-5 rounded-3xl border border-[var(--jf-border)] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--jf-muted)]">Business identity</p><h2 className="mt-2 text-xl font-semibold text-[var(--jf-text)] sm:text-2xl">{business.name}</h2><p className="mt-2 flex items-start gap-2 text-sm leading-6 text-[var(--jf-muted)]"><MapPin className="mt-1 size-4 shrink-0 text-[var(--jf-discovery)]" />{business.address}</p></div><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${status.tone === "verified" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{status.tone === "verified" ? <BadgeCheck className="size-5" /> : <FileCheck2 className="size-5" />}</span></div>
  <div className={`mt-6 rounded-2xl border p-4 ${statusClasses}`}><p className="text-sm font-semibold">{status.title}</p><p className="mt-1 text-sm leading-6 opacity-90">{status.detail}</p></div>{certificate.certificateId && <p className="mt-5 text-xs text-[var(--jf-muted)]">Certificate ID: <span className="font-mono text-[var(--jf-text)]">{certificate.certificateId}</span></p>}</section>

  <section className="mt-5 rounded-3xl border border-[var(--jf-border)] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 size-5 text-[var(--jf-primary)]" /><div><h2 className="text-lg font-semibold text-[var(--jf-text)]">How verification works</h2><p className="mt-1 text-sm leading-6 text-[var(--jf-muted)]">Verification is used when a business owner wants Just Finds to review evidence supporting the listing record. Uploads and review notes remain private to authorized owners and administrators.</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-3">{verificationEvidenceGuidance.map((item, index) => <article key={item.title} className="rounded-2xl border border-[var(--jf-border)] bg-[var(--jf-canvas)] p-4"><p className="text-xs font-semibold text-[var(--jf-primary)]">0{index + 1}</p><h3 className="mt-3 text-sm font-semibold text-[var(--jf-text)]">{item.title}</h3><p className="mt-1 text-sm leading-5 text-[var(--jf-muted)]">{item.detail}</p></article>)}</div><p className="mt-5 text-sm leading-6 text-[var(--jf-muted)]">Submission state and secure upload status are available only inside the authorized owner workspace. This public record intentionally does not show documents, personal information, or review notes.</p></section>

  <nav aria-label="Verification recovery" className="mt-5 flex flex-col gap-3 pb-4 sm:flex-row"><Button asChild><Link href={`/${business.slug}`}>View business profile</Link></Button><Button asChild variant="outline"><Link href="/search">Search businesses</Link></Button></nav></div></main></PageFrame>;
}
