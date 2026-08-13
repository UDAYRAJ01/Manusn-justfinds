import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, FileText, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";

const CONTENT_TYPES = [
  ["short_description", "Short description"],
  ["about_business", "About the business"],
  ["seo_title", "SEO title"],
  ["meta_description", "Meta description"],
  ["faq", "FAQs"],
  ["service_description", "Service description"],
  ["category_description", "Category description"],
  ["local_landing", "Local landing page"],
  ["business_highlights", "Business highlights"],
  ["cta_copy", "Call-to-action copy"],
] as const;

type ContentType = (typeof CONTENT_TYPES)[number][0];
type ManagedBusiness = { id: number; name: string; status: string };

export function AiContentWorkspace({ businesses }: { businesses: ManagedBusiness[] }) {
  const [businessId, setBusinessId] = useState("");
  const [contentType, setContentType] = useState<ContentType>("short_description");
  const selectedId = Number(businessId) || 0;
  const utils = trpc.useUtils();
  const provider = trpc.aiContent.getProviderStatus.useQuery();
  const facts = trpc.aiContent.getBusinessFactsPreview.useQuery({ businessId: selectedId }, { enabled: selectedId > 0 });
  const content = trpc.aiContent.preview.useQuery({ businessId: selectedId, contentType }, { enabled: selectedId > 0 });
  const knowledge = trpc.ai.knowledgeSources.useQuery({ businessId: selectedId }, { enabled: selectedId > 0 });
  const unanswered = trpc.ai.unansweredQuestions.useQuery({ businessId: selectedId }, { enabled: selectedId > 0 });
  const generate = trpc.aiContent.generate.useMutation({ onSuccess: () => { void content.refetch(); void utils.aiContent.preview.invalidate({ businessId: selectedId }); } });
  const submit = trpc.aiContent.submitForReview.useMutation({ onSuccess: () => void content.refetch() });
  const refreshKnowledge = trpc.ai.refreshKnowledge.useMutation({ onSuccess: () => void knowledge.refetch() });
  const resolve = trpc.ai.resolveUnansweredQuestion.useMutation({ onSuccess: () => void unanswered.refetch() });
  const version = content.data?.[0];
  const selected = businesses.find(item => item.id === selectedId);
  const factsCount = facts.data ? Object.values(facts.data).filter(value => value !== null && value !== undefined && String(value).trim() !== "").length : 0;

  return <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
    <section className="rounded-[24px] border border-slate-200 bg-white p-6">
      <div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-[#1f51c8]"><Sparkles className="size-5" /></span><div><p className="eyebrow">Fact-grounded studio</p><h2 className="mt-1 text-xl font-semibold tracking-[-.035em] text-slate-900">Generate useful copy without inventing facts</h2><p className="mt-2 text-sm leading-6 text-slate-600">Every draft is produced from the selected business context, stored as a new version, and kept private until it passes administrator review.</p></div></div>
      <div className="mt-6 grid gap-4"><label className="grid gap-1.5 text-xs font-medium text-slate-700"><span>Business profile</span><select value={businessId} onChange={event => { setBusinessId(event.target.value); generate.reset(); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Choose a profile</option>{businesses.map(item => <option value={item.id} key={item.id}>{item.name} · {item.status}</option>)}</select></label><label className="grid gap-1.5 text-xs font-medium text-slate-700"><span>Content type</span><select value={contentType} onChange={event => setContentType(event.target.value as ContentType)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">{CONTENT_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
      {selectedId > 0 && <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600"><p className="font-semibold text-slate-800">Grounding check for {selected?.name}</p><p className="mt-1">{facts.isLoading ? "Reading approved and owner-supplied facts…" : `${factsCount} populated fact groups are available. Empty fields remain empty rather than being guessed.`}</p><p className="mt-1">Provider: {provider.data?.configured ? "Managed AI provider available" : "AI provider is not configured"}</p></div>}
      <div className="mt-5 flex flex-wrap items-center gap-3"><Button disabled={!selectedId || !provider.data?.configured || generate.isPending} onClick={() => generate.mutate({ businessId: selectedId, contentType })} className="rounded-xl bg-[#173d9c]">{generate.isPending ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Generating grounded draft…</> : <><Sparkles className="mr-2 size-4" />Generate new draft</>}</Button>{generate.isPending && <span className="text-xs text-slate-500" role="status" aria-live="polite">Validating sources, checking claims, and saving a new version.</span>}</div>
      {generate.error && <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800" role="alert"><div className="flex items-center gap-2 font-semibold"><AlertCircle className="size-4" />Generation was not saved</div><p className="mt-1 text-xs leading-5">{generate.error.message}</p></div>}
      {version ? <div className="mt-6 rounded-2xl border border-slate-200 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Latest {contentType.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-500">Version {version.version} · {version.status}</p></div><FileText className="size-5 text-[#1f51c8]" /></div><pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{JSON.stringify(version.structured, null, 2)}</pre><div className="mt-4 flex flex-wrap gap-2"><Button disabled={version.status !== "draft" || submit.isPending} onClick={() => submit.mutate({ versionId: version.id })} className="rounded-xl">{submit.isPending ? "Submitting…" : "Submit draft for review"}<CheckCircle2 className="ml-2 size-4" /></Button></div>{submit.error && <p className="mt-3 text-xs text-rose-700" role="alert">{submit.error.message}</p>}</div> : selectedId > 0 && <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-5 text-sm leading-6 text-slate-600">No generated version exists for this content type yet. Generate a draft only when the factual business context is ready.</div>}
    </section>
    <div className="grid gap-6 content-start">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Business knowledge base</h2><p className="mt-1 text-xs leading-5 text-slate-500">Refresh the isolated sources used by this business assistant. No other listing is eligible.</p></div><Button variant="outline" className="bg-white" disabled={!selectedId || refreshKnowledge.isPending} onClick={() => refreshKnowledge.mutate({ businessId: selectedId })} aria-label="Refresh business knowledge"><RefreshCw className={`size-4 ${refreshKnowledge.isPending ? "animate-spin" : ""}`} /></Button></div>{selectedId ? <div className="mt-4 grid gap-2">{knowledge.data?.length ? knowledge.data.map(item => <div key={item.id} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-800">{item.sourceType.replaceAll("_", " ")}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.label}</p></div>) : <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No scoped knowledge sources have been indexed yet.</p>}</div> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Choose a profile to inspect its isolated knowledge sources.</p>}</section>
      <section className="rounded-[24px] border border-slate-200 bg-white p-6"><h2 className="font-semibold text-slate-900">Unanswered questions</h2><p className="mt-1 text-xs leading-5 text-slate-500">Questions the assistant could not answer are surfaced for owner follow-up instead of guessed responses.</p>{selectedId ? <div className="mt-4 grid gap-3">{unanswered.data?.length ? unanswered.data.map(item => <div className="rounded-xl bg-amber-50 p-3" key={item.id}><p className="text-xs leading-5 text-amber-950">{item.question}</p><div className="mt-2 flex gap-2"><Button variant="outline" className="h-8 bg-white text-xs" onClick={() => resolve.mutate({ businessId: selectedId, id: item.id, status: "resolved" })}>Mark resolved</Button><Button variant="outline" className="h-8 bg-white text-xs" onClick={() => resolve.mutate({ businessId: selectedId, id: item.id, status: "dismissed" })}>Dismiss</Button></div></div>) : <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No unanswered questions are waiting.</p>}</div> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Choose a profile to inspect question feedback.</p>}</section>
    </div>
  </div>;
}
