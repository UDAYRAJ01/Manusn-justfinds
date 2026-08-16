import { AlertTriangle, BarChart3, CheckCircle2, FileCheck2, Sparkles, type LucideIcon } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export function AiAdminWorkspace() {
  const utils = trpc.useUtils();
  const analytics = trpc.aiContent.analytics.useQuery();
  const queue = trpc.aiContent.reviewQueue.useQuery();
  const [noteFor, setNoteFor] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const approve = trpc.aiContent.approve.useMutation({ onSuccess: () => { void utils.aiContent.reviewQueue.invalidate(); setNoteFor(null); setNote(""); } });
  const reject = trpc.aiContent.reject.useMutation({ onSuccess: () => { void utils.aiContent.reviewQueue.invalidate(); setNoteFor(null); setNote(""); } });
  const publish = trpc.aiContent.publish.useMutation({ onSuccess: () => { void utils.aiContent.reviewQueue.invalidate(); setNoteFor(null); setNote(""); } });
  const busy = approve.isPending || reject.isPending || publish.isPending;

  return <section className="mt-8 space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Jobs today" value={analytics.isLoading ? "…" : String(analytics.data?.today ?? 0)} icon={BarChart3} />
      <Metric label="Jobs this month" value={analytics.isLoading ? "…" : String(analytics.data?.month ?? 0)} icon={Sparkles} />
      <Metric label="Pending work" value={analytics.isLoading ? "…" : String(analytics.data?.pending ?? 0)} icon={FileCheck2} />
      <Metric label="Failed jobs" value={analytics.isLoading ? "…" : String(analytics.data?.failed ?? 0)} icon={AlertTriangle} />
    </div>
    {analytics.data?.costMessage && <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">{analytics.data.costMessage} Provider cost data is intentionally not estimated.</p>}
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">AI governance</p><h2 className="mt-1 text-xl font-semibold tracking-[-.035em] text-slate-900">Content review queue</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Only fact-grounded versions that entered the moderation workflow appear here. Publishing an approved Best AI SEO Profile updates its private listing’s About, SEO title, meta description, and grounded FAQs together while preserving the version record.</p></div><CheckCircle2 className="size-6 text-emerald-600" /></div>
      {queue.error && <p className="mt-4 text-xs text-rose-600">{queue.error.message}</p>}
      <div className="mt-5 grid gap-3">
        {queue.isLoading ? <div className="h-24 animate-pulse rounded-2xl bg-slate-100" /> : queue.data?.length ? queue.data.map(item => <article className="rounded-2xl border border-slate-200 p-4" key={item.id}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-slate-900">{item.businessName}</h3><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-blue-700">{item.contentType}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-600">{item.status}</span></div><p className="mt-2 text-xs leading-5 text-slate-600">Version {item.version} · {formatValidationFlags(item.validationFlags)}</p></div></div>
          <details className="mt-3 rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-semibold text-slate-700">Compare original and AI draft</summary><div className="mt-3 grid gap-3 lg:grid-cols-2"><div className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">{originalLabel(item.contentType)}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">{originalContent(item)}</p></div><div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-indigo-700">AI-generated {draftLabel(item.contentType)}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-700">{draftContent(item)}</p></div></div></details>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.status === "pending_review" && <><Button disabled={busy} onClick={() => approve.mutate({ versionId: item.id, note: noteFor === item.id ? note : undefined })} className="h-9 rounded-lg text-xs">Approve</Button><Button disabled={busy} onClick={() => setNoteFor(noteFor === item.id ? null : item.id)} variant="outline" className="h-9 rounded-lg bg-white text-xs">Return for changes</Button></>}
            {item.status === "approved" && <Button disabled={busy} onClick={() => publish.mutate({ versionId: item.id, note: noteFor === item.id ? note : undefined })} className="h-9 rounded-lg text-xs">Publish {draftLabel(item.contentType)} to listing</Button>}
          </div>
          {noteFor === item.id && <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"><input value={note} onChange={event => setNote(event.target.value)} placeholder="Optional review note" className="h-9 rounded-lg border border-slate-200 px-3 text-xs" />{item.status === "pending_review" && <Button disabled={!note.trim() || busy} onClick={() => reject.mutate({ versionId: item.id, note })} variant="outline" className="h-9 rounded-lg border-rose-200 bg-white text-xs text-rose-700">Return with note</Button>}</div>}
          {(approve.error || reject.error || publish.error) && <p className="mt-2 text-xs text-rose-600">{approve.error?.message ?? reject.error?.message ?? publish.error?.message}</p>}
        </article>) : <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><CheckCircle2 className="size-7 text-slate-400" /><p className="mt-3 text-sm text-slate-500">No AI content versions are waiting for administrator review.</p></div>}
      </div>
    </section>
  </section>;
}

function formatValidationFlags(value: unknown) {
  if (Array.isArray(value) && value.length) return `Validation flags: ${value.map(String).join(", ")}`;
  if (value && typeof value === "object") return "Validation metadata is available for review";
  return "No validation flags";
}

function originalLabel(contentType: string) {
  if (contentType === "business_seo_profile") return "Current business profile";
  if (contentType === "seo_title") return "Current SEO title";
  if (contentType === "meta_description") return "Current meta description";
  if (contentType === "faq") return "Current FAQs";
  return "Original About";
}

function draftLabel(contentType: string) {
  if (contentType === "business_seo_profile") return "Best AI SEO Profile";
  if (contentType === "seo_title") return "SEO title";
  if (contentType === "meta_description") return "meta description";
  if (contentType === "faq") return "10 FAQs";
  return "About";
}

function originalContent(item: { contentType: string; originalAbout?: string | null; originalShortDescription?: string | null; originalSeoTitle?: string | null; originalMetaDescription?: string | null; originalFaqs?: unknown }) {
  if (item.contentType === "business_seo_profile") return [item.originalAbout || item.originalShortDescription || "No prior About text was saved.", `SEO title: ${item.originalSeoTitle || "Not saved"}`, `Meta description: ${item.originalMetaDescription || "Not saved"}`, formatFaqs(item.originalFaqs) ? `FAQs:\n${formatFaqs(item.originalFaqs)}` : "FAQs: Not saved"].join("\n\n");
  if (item.contentType === "seo_title") return item.originalSeoTitle || "No SEO title has been saved.";
  if (item.contentType === "meta_description") return item.originalMetaDescription || "No meta description has been saved.";
  if (item.contentType === "faq") return formatFaqs(item.originalFaqs) || "No prior FAQs were saved.";
  return item.originalAbout || item.originalShortDescription || "No prior About text was saved.";
}

function draftContent(item: { contentType: string; content: string; structured?: unknown }) {
  if (item.contentType === "business_seo_profile") {
    const profile = item.structured && typeof item.structured === "object" ? item.structured as { title?: unknown; description?: unknown; faqs?: unknown } : {};
    return [item.content, `SEO title: ${typeof profile.title === "string" ? profile.title : "Not generated"}`, `Meta description: ${typeof profile.description === "string" ? profile.description : "Not generated"}`, formatFaqs(profile.faqs) ? `FAQs:\n${formatFaqs(profile.faqs)}` : "FAQs: Not generated"].join("\n\n");
  }
  return item.contentType === "faq" ? formatFaqs(item.structured) || item.content : item.content;
}

function formatFaqs(value: unknown) {
  const entries = value && typeof value === "object" && "faqs" in value ? (value as { faqs?: unknown }).faqs : value;
  if (!Array.isArray(entries)) return "";
  return entries.map((entry, index) => entry && typeof entry === "object" && "question" in entry && "answer" in entry ? `${index + 1}. ${(entry as { question: string }).question}\n${(entry as { answer: string }).answer}` : "").filter(Boolean).join("\n\n");
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return <div className="rounded-[20px] border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{label}</p><Icon className="size-4 text-[#1f51c8]" /></div><p className="mt-4 text-2xl font-semibold tracking-[-.04em] text-slate-900">{value}</p></div>;
}

export default AiAdminWorkspace;
