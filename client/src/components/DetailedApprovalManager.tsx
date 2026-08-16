import { CheckCircle2, ChevronRight, ClipboardCheck, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
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
  if (!items.length) return <p className="text-xs text-slate-500">No FAQs are available.</p>;
  return <ol className="grid gap-2">{items.map((item, index) => <li key={`${item.question}-${index}`} className="rounded-lg bg-white p-2 text-xs leading-5 text-slate-700"><strong>Q{index + 1}. {item.question}</strong><br />{item.answer}</li>)}</ol>;
}

function getProfile(content: unknown) {
  if (!content || typeof content !== "object") return null;
  const profile = content as { text?: unknown; title?: unknown; description?: unknown; faqs?: unknown; serviceVerificationQuestions?: unknown; facilityVerificationQuestions?: unknown };
  return {
    text: typeof profile.text === "string" ? profile.text : null,
    title: typeof profile.title === "string" ? profile.title : null,
    description: typeof profile.description === "string" ? profile.description : null,
    faqs: Array.isArray(profile.faqs) ? profile.faqs : [],
    serviceVerificationQuestions: Array.isArray(profile.serviceVerificationQuestions) ? profile.serviceVerificationQuestions.filter((item): item is string => typeof item === "string") : [],
    facilityVerificationQuestions: Array.isArray(profile.facilityVerificationQuestions) ? profile.facilityVerificationQuestions.filter((item): item is string => typeof item === "string") : [],
  };
}

function statusLabel(status?: string | null) {
  if (status === "queued") return "AI queued";
  if (status === "processing") return "AI generating";
  if (status === "completed" || status === "published") return "AI done";
  if (status === "failed") return "AI failed — retry";
  return "No AI profile";
}

export function DetailedApprovalManager() {
  const utils = trpc.useUtils();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openBusinessId, setOpenBusinessId] = useState<number | null>(null);
  const { data: pending = [], isLoading } = trpc.workspace.pendingBusinesses.useQuery(undefined, { refetchInterval: activeBatchId ? 2500 : false });
  const batch = trpc.aiContent.batch.useQuery({ batchId: activeBatchId ?? "pending-batch" }, { enabled: Boolean(activeBatchId), refetchInterval: activeBatchId ? 2500 : false });
  const review = trpc.workspace.reviewBusiness.useMutation({ onSuccess: () => { void utils.workspace.pendingBusinesses.invalidate(); void utils.workspace.adminOverview.invalidate(); } });
  const generateSeoPack = trpc.aiContent.generateSeoPack.useMutation();
  const bulkBestProfiles = trpc.aiContent.bulkBestProfiles.useMutation();
  const applyBestProfile = trpc.aiContent.applyBestProfile.useMutation({ onSuccess: () => { void utils.workspace.pendingBusinesses.invalidate(); } });
  const revertBestProfile = trpc.aiContent.revertBestProfile.useMutation({ onSuccess: () => { void utils.workspace.pendingBusinesses.invalidate(); } });
  const busy = review.isPending || generateSeoPack.isPending || bulkBestProfiles.isPending || applyBestProfile.isPending || revertBestProfile.isPending;

  useEffect(() => {
    if (!batch.data || batch.data.status !== "completed") return;
    setNotice(`AI batch complete: ${batch.data.completed} done, ${batch.data.failed} failed. Open a listing to review the result.`);
    void utils.workspace.pendingBusinesses.invalidate();
    setActiveBatchId(null);
  }, [batch.data, utils.workspace.pendingBusinesses]);

  const toggle = (businessId: number) => setSelectedIds(current => current.includes(businessId) ? current.filter(id => id !== businessId) : current.length < 1000 ? [...current, businessId] : current);
  const queueOne = async (businessId: number) => {
    setError(null); setNotice(null);
    try {
      const result = await generateSeoPack.mutateAsync({ businessId });
      setActiveBatchId(result.batchId);
      setNotice("AI profile is queued. It will appear in this business panel when generation is complete.");
      void utils.workspace.pendingBusinesses.invalidate();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The AI profile could not be queued."); }
  };
  const queueSelected = async () => {
    if (!selectedIds.length) return;
    setError(null); setNotice(null);
    try {
      const result = await bulkBestProfiles.mutateAsync({ businessIds: selectedIds });
      setSelectedIds([]); setActiveBatchId(result.batchId);
      setNotice(`${result.queued} business profiles are queued in the background. You can keep this page open or close it.`);
      void utils.workspace.pendingBusinesses.invalidate();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The AI profile batch could not be queued."); }
  };
  const apply = async (versionId: number) => {
    setError(null);
    try { await applyBestProfile.mutateAsync({ versionId }); setNotice("AI profile applied to the private listing. You can revert to the original factual content at any time."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The AI profile could not be applied."); }
  };
  const revert = async (businessId: number) => {
    setError(null);
    try { await revertBestProfile.mutateAsync({ businessId }); setNotice("Original factual content has been restored. Customer ratings and reviews were not changed."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The original content could not be restored."); }
  };

  return <section className="mt-8 space-y-5">
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Listing approval</p><h2 className="mt-1 text-xl font-semibold tracking-[-.035em] text-slate-900">Business list and AI rewrite status</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">Select businesses or open one row for details. The secure AI service generates one factual profile with 5–10 FAQs in the background. Ratings and customer reviews are never generated, modified, or published by AI.</p></div><div className="flex items-center gap-2"><span className="text-xs font-medium text-slate-500">{selectedIds.length} selected</span><Button disabled={!selectedIds.length || busy} onClick={() => void queueSelected()} className="h-9 rounded-lg text-xs"><Sparkles className="mr-1.5 size-3.5" />{bulkBestProfiles.isPending ? "Queueing…" : "Generate selected profiles"}</Button><ClipboardCheck className="size-5 text-[#1f51c8]" /></div></div>
      {activeBatchId && batch.data && <div role="status" className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900"><LoaderCircle className="mr-2 inline size-3.5 animate-spin" />AI batch: {batch.data.completed}/{batch.data.totalJobs} done · {batch.data.failed} failed · {batch.data.pending} pending</div>}
      {notice && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900">{notice}</div>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</p>}
    </div>
    {isLoading ? <div className="h-64 animate-pulse rounded-[24px] bg-slate-100" /> : pending.length ? <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">{pending.map(business => {
      const profile = getProfile(business.aiProfile?.structured ?? business.aiProfile?.content);
      const aiStatus = business.aiRewriteJob?.status ?? business.aiProfile?.status ?? null;
      const isOpen = openBusinessId === business.id;
      return <article key={business.id} className="border-b border-slate-200 last:border-b-0"><div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"><input aria-label={`Select ${business.businessName} for AI generation`} type="checkbox" className="size-4 rounded border-slate-300 text-indigo-600" checked={selectedIds.includes(business.id)} disabled={busy} onChange={() => toggle(business.id)} /><button type="button" onClick={() => setOpenBusinessId(isOpen ? null : business.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left"><ChevronRight className={`size-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`} /><span className="truncate text-sm font-semibold text-slate-950">{business.businessName}</span><span className="hidden truncate text-xs text-slate-500 sm:inline">{business.mainCategory} · {business.city}</span></button><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${aiStatus === "failed" ? "bg-rose-50 text-rose-700" : aiStatus === "queued" || aiStatus === "processing" ? "bg-blue-50 text-blue-700" : aiStatus ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel(aiStatus)}</span><Button disabled={busy || aiStatus === "queued" || aiStatus === "processing"} onClick={() => void queueOne(business.id)} variant="outline" className="h-8 rounded-lg text-xs"><Sparkles className="mr-1 size-3" />{aiStatus === "failed" ? "Rewrite" : "AI rewrite"}</Button></div>
      {isOpen && <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5"><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => review.mutate({ businessId: business.id, decision: "published" })} className="h-8 rounded-lg text-xs">Approve listing</Button><Button disabled={busy} onClick={() => review.mutate({ businessId: business.id, decision: "rejected", reviewerNote: "Please review your profile details before resubmitting." })} variant="outline" className="h-8 rounded-lg bg-white text-xs">Return</Button>{business.aiProfile?.id && business.aiProfile.status !== "published" && <Button disabled={busy} onClick={() => void apply(business.aiProfile!.id)} className="h-8 rounded-lg bg-emerald-700 text-xs hover:bg-emerald-800"><CheckCircle2 className="mr-1 size-3" />Apply AI profile</Button>}{business.aiProfile?.status === "published" && <Button disabled={busy} onClick={() => void revert(business.id)} variant="outline" className="h-8 rounded-lg border-amber-200 bg-amber-50 text-xs text-amber-800 hover:bg-amber-100"><RotateCcw className="mr-1 size-3" />Revert to original</Button>}</div>
        {profile && <section className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-indigo-700">Generated Best AI SEO Profile</p><p className="mt-1 text-xs text-indigo-900">This is the generated result for this business. No original-versus-draft comparison is required.</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700">{statusLabel(business.aiProfile?.status)}</span></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><Fact label="SEO Title" value={profile.title} /><Fact label="Meta Description" value={profile.description} /></div>{profile.text && <div className="mt-3 rounded-xl bg-white p-3 text-xs leading-6 text-slate-800">{profile.text}</div>}<div className="mt-3"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Generated FAQs</p><FaqList faqs={profile.faqs} /></div>{(profile.serviceVerificationQuestions.length > 0 || profile.facilityVerificationQuestions.length > 0) && <div className="mt-3 grid gap-3 lg:grid-cols-2"><section className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-amber-800">Service details to verify</p><ul className="mt-2 grid gap-1.5 text-xs leading-5 text-amber-950">{profile.serviceVerificationQuestions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></section><section className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-amber-800">Facility details to verify</p><ul className="mt-2 grid gap-1.5 text-xs leading-5 text-amber-950">{profile.facilityVerificationQuestions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></section></div>}<p className="mt-3 text-[11px] leading-5 text-indigo-900">Verification questions are private guidance only. They are never added to the public listing until an administrator confirms the fact.</p></section>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Fact label="Business Name" value={business.businessName} /><Fact label="Main Category" value={business.mainCategory} /><Fact label="Subcategory" value={business.subcategory} /><Fact label="Business Type" value={business.businessType} /><Fact label="Description (About)" value={business.description} wide /><Fact label="Address" value={business.address} wide /><Fact label="City" value={business.city} /><Fact label="Locality" value={business.locality} /><Fact label="State" value={business.state} /><Fact label="Country" value={business.country} /><Fact label="Latitude" value={business.latitude} /><Fact label="Longitude" value={business.longitude} /><Fact label="Phone" value={business.phone} /><Fact label="Email" value={business.email} /><Fact label="Website" value={business.website} wide /><Fact label="Hours" value={hoursText(business.hours)} wide /><Fact label="Rating (audit only)" value={business.ratingAudit ?? "Not linked to this imported record"} /><Fact label="Total Reviews (audit only)" value={business.totalReviewsAudit ?? "Not linked to this imported record"} /></div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2"><section className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Services supplied</p>{business.services.length ? <ul className="mt-2 flex flex-wrap gap-2">{business.services.map((service, index) => <li key={`${service.name}-${index}`} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-800">{service.name}</li>)}</ul> : <p className="mt-2 text-xs text-slate-500">No services were supplied. AI does not invent public services.</p>}</section><section className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Source FAQs</p><div className="mt-2"><FaqList faqs={business.faqs} /></div></section></div><p className="mt-3 text-[11px] leading-5 text-slate-500">{business.ratingAuditNote} Any service or facility idea requires factual verification before it can be added to the listing.</p>{review.error && <p className="mt-3 text-xs text-rose-600">{review.error.message}</p>}</div>}
    </article>;
    })}</div> : <div className="grid place-items-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><CheckCircle2 className="size-7 text-slate-400" /><p className="mt-3 text-sm text-slate-500">No submitted business profiles are awaiting review.</p></div>}
  </section>;
}
