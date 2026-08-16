import { CheckCircle2, ClipboardCheck, Sparkles } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function valueOrMissing(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "Not supplied" : String(value);
}

function hoursText(hours: Array<{ dayOfWeek: number; opensAt: string | null; closesAt: string | null; isClosed: boolean; isTwentyFourHours: boolean }>) {
  if (!hours.length) return "Not supplied";
  return hours.map(hour => `${dayNames[hour.dayOfWeek] ?? "Day"}: ${hour.isClosed ? "Closed" : hour.isTwentyFourHours ? "Open 24 hours" : `${hour.opensAt ?? "?"}–${hour.closesAt ?? "?"}`}`).join(" · ");
}

function Fact({ label, value, wide = false }: { label: string; value: string | number | null | undefined; wide?: boolean }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-3 ${wide ? "sm:col-span-2" : ""}`}><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-1 break-words text-xs leading-5 text-slate-800">{valueOrMissing(value)}</p></div>;
}

function FaqList({ faqs }: { faqs: unknown[] }) {
  const items = faqs.filter((item): item is { question: string; answer: string } => item !== null && typeof item === "object" && "question" in item && "answer" in item).slice(0, 10);
  if (!items.length) return <p className="text-xs text-slate-500">No source FAQs were supplied.</p>;
  return <ol className="grid gap-2">{items.map((item, index) => <li key={`${item.question}-${index}`} className="rounded-lg bg-white p-2 text-xs leading-5 text-slate-700"><strong>Q{index + 1}. {item.question}</strong><br />{item.answer}</li>)}</ol>;
}

export function DetailedApprovalManager() {
  const utils = trpc.useUtils();
  const { data: pending = [], isLoading } = trpc.workspace.pendingBusinesses.useQuery();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const review = trpc.workspace.reviewBusiness.useMutation({ onSuccess: () => { void utils.workspace.pendingBusinesses.invalidate(); void utils.workspace.adminOverview.invalidate(); } });
  const generateSeoPack = trpc.aiContent.generateSeoPack.useMutation({ onSuccess: () => { void utils.aiContent.reviewQueue.invalidate(); } });
  const busy = review.isPending || generateSeoPack.isPending || Boolean(progress);
  const toggle = (businessId: number) => setSelectedIds(current => current.includes(businessId) ? current.filter(id => id !== businessId) : current.length < 5 ? [...current, businessId] : current);
  const runPack = async (businessId: number) => {
    setError(null); setNotice(null);
    try {
      const result = await generateSeoPack.mutateAsync({ businessId });
      setNotice(result.completed ? "One private Best AI SEO Profile was created. Review, approve, and publish the complete profile in AI governance." : "The Best AI SEO Profile could not be created. Check the actionable error below.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The Best AI SEO Profile could not be created."); }
  };
  const runSelected = async () => {
    const ids = selectedIds.slice(0, 5); if (!ids.length) return;
    setError(null); setNotice(null); setProgress({ completed: 0, total: ids.length });
      let completed = 0;
    try {
      for (let index = 0; index < ids.length; index += 1) {
        const result = await generateSeoPack.mutateAsync({ businessId: ids[index]! });
        completed += result.completed;
        setProgress({ completed: index + 1, total: ids.length });
      }
      setSelectedIds([]);
      setNotice(`${completed} private Best AI SEO profiles were created. Open AI governance to compare, approve, and publish each complete profile.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The selected Best AI SEO profiles could not be created."); }
    finally { setProgress(null); void utils.aiContent.reviewQueue.invalidate(); }
  };
  return <section className="mt-8 space-y-5">
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Listing approval</p><h2 className="mt-1 text-xl font-semibold tracking-[-.035em] text-slate-900">Full business details before approval</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">Every source field is shown separately. One Best AI SEO Profile uses only the factual fields below, stays private until approved, and never turns import ratings or review totals into public customer reviews.</p></div><div className="flex items-center gap-2"><span className="text-xs font-medium text-slate-500">{selectedIds.length}/5 selected</span><Button disabled={!selectedIds.length || busy} onClick={() => void runSelected()} className="h-9 rounded-lg text-xs"><Sparkles className="mr-1.5 size-3.5" />{progress ? `Creating ${progress.completed}/${progress.total}` : "Create best AI profiles"}</Button><ClipboardCheck className="size-5 text-[#1f51c8]" /></div></div>
      {notice && <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900"><span>{notice}</span><a href="/admin/ai" className="font-semibold underline underline-offset-2">Open AI governance</a></div>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</p>}
    </div>
    {isLoading ? <div className="h-64 animate-pulse rounded-[24px] bg-slate-100" /> : pending.length ? pending.map(business => <article key={business.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 gap-3"><label className="mt-1"><input aria-label={`Select ${business.businessName} for AI SEO generation`} type="checkbox" className="size-4 rounded border-slate-300 text-indigo-600" checked={selectedIds.includes(business.id)} disabled={busy || (!selectedIds.includes(business.id) && selectedIds.length >= 5)} onChange={() => toggle(business.id)} /></label><div><h3 className="text-base font-semibold text-slate-950">{business.businessName}</h3><p className="mt-1 text-xs text-slate-500">Submitted for review · {business.mainCategory} · {business.city}</p></div></div><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => void runPack(business.id)} variant="outline" className="h-9 rounded-lg border-indigo-200 bg-white text-xs text-indigo-700 hover:bg-indigo-50"><Sparkles className="mr-1.5 size-3.5" />{generateSeoPack.isPending ? "Creating private drafts…" : "AI SEO + 10 FAQs"}</Button><Button disabled={busy} onClick={() => review.mutate({ businessId: business.id, decision: "published" })} className="h-9 rounded-lg text-xs">Approve listing</Button><Button disabled={busy} onClick={() => review.mutate({ businessId: business.id, decision: "rejected", reviewerNote: "Please review your profile details before resubmitting." })} variant="outline" className="h-9 rounded-lg bg-white text-xs">Return</Button></div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Fact label="Business Name" value={business.businessName} /><Fact label="Main Category" value={business.mainCategory} /><Fact label="Subcategory" value={business.subcategory} /><Fact label="Business Type" value={business.businessType} /><Fact label="Description (About)" value={business.description} wide /><Fact label="Address" value={business.address} wide /><Fact label="City" value={business.city} /><Fact label="Locality" value={business.locality} /><Fact label="State" value={business.state} /><Fact label="Country" value={business.country} /><Fact label="Latitude" value={business.latitude} /><Fact label="Longitude" value={business.longitude} /><Fact label="Phone" value={business.phone} /><Fact label="Email" value={business.email} /><Fact label="Website" value={business.website} wide /><Fact label="Hours" value={hoursText(business.hours)} wide /><Fact label="Rating (audit only)" value={business.ratingAudit ?? "Not linked to this imported record"} /><Fact label="Total Reviews (audit only)" value={business.totalReviewsAudit ?? "Not linked to this imported record"} /></div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2"><section className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Services supplied</p>{business.services.length ? <ul className="mt-2 flex flex-wrap gap-2">{business.services.map((service, index) => <li key={`${service.name}-${index}`} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-800">{service.name}</li>)}</ul> : <p className="mt-2 text-xs text-slate-500">No services were supplied. AI will not invent public services.</p>}</section><section className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Source FAQs</p><div className="mt-2"><FaqList faqs={business.faqs} /></div></section></div>
      <p className="mt-3 text-[11px] leading-5 text-slate-500">{business.ratingAuditNote} Any unverified service idea remains a private reviewer suggestion and is never auto-published.</p>
      {review.error && <p className="mt-3 text-xs text-rose-600">{review.error.message}</p>}
    </article>) : <div className="grid place-items-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><CheckCircle2 className="size-7 text-slate-400" /><p className="mt-3 text-sm text-slate-500">No submitted business profiles are awaiting review.</p></div>}
  </section>;
}
