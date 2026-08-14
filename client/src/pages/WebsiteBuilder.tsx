import React, { useEffect, useMemo, useState } from "react";
import WebsiteRenderer from "@/components/WebsiteRenderer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Monitor, MoveDown, MoveUp, Smartphone, Tablet, WandSparkles } from "lucide-react";

type PreviewMode = "desktop" | "tablet" | "mobile";

export function restorePreviewDesign(previousDesign: Record<string, unknown> | null, previousDirty: boolean) {
  return { design: previousDesign, dirty: previousDirty };
}

const modeWidth: Record<PreviewMode, string> = { desktop: "w-full", tablet: "max-w-2xl", mobile: "max-w-sm" };

export function canSaveWebsiteDraft(dirty: boolean, savedVersionCount: number) {
  return dirty || savedVersionCount === 0;
}

export default function WebsiteBuilder({ businessId }: { businessId: number }) {
  const builder = trpc.website.builder.useQuery({ businessId });
  const detail = trpc.business.businessDetail.useQuery({ businessId });
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<PreviewMode>("desktop");
  const [dirty, setDirty] = useState(false);
  const [sections, setSections] = useState<Array<{ id?: number; sectionType: string; displayOrder: number; enabled: boolean; config?: Record<string, unknown> }>>([]);
  const [design, setDesign] = useState<Record<string, unknown> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [aiProposal, setAiProposal] = useState<Record<string, unknown> | null>(null);
  const [previewBaseDesign, setPreviewBaseDesign] = useState<Record<string, unknown> | null>(null);
  const [previewBaseDirty, setPreviewBaseDirty] = useState(false);
  const save = trpc.website.saveDraft.useMutation({ onSuccess: () => { setDirty(false); void utils.website.builder.invalidate({ businessId }); } });
  const publish = trpc.website.publish.useMutation({ onSuccess: () => void utils.website.builder.invalidate({ businessId }) });
  const suggestRedesign = trpc.website.suggestRedesign.useMutation({ onSuccess: result => setAiProposal(result.proposal as Record<string, unknown>) });
  const applyRedesign = trpc.website.applyRedesign.useMutation({ onSuccess: () => { setPreviewBaseDesign(null); setPreviewBaseDirty(false); if (aiProposal) { setDesign(aiProposal); setAiProposal(null); setDirty(true); } void utils.website.builder.invalidate({ businessId }); } });
  const rejectRedesign = trpc.website.rejectRedesign.useMutation({ onSuccess: () => { const restored = restorePreviewDesign(previewBaseDesign, previewBaseDirty); setDesign(restored.design); setDirty(restored.dirty); setPreviewBaseDesign(null); setAiProposal(null); } });
  const submitForReview = trpc.website.submitForReview.useMutation({ onSuccess: () => void utils.website.builder.invalidate({ businessId }) });
  const sourceSections = builder.data?.sections ?? [];
  const currentSections = sections.length ? sections : sourceSections.map(section => ({ id: section.id, sectionType: section.sectionType, displayOrder: section.displayOrder, enabled: section.enabled, config: (section.config ?? {}) as Record<string, unknown> }));
  const currentDesign = design ?? (builder.data?.designConfig as Record<string, unknown> | undefined) ?? {};
  const savedVersionCount = builder.data?.versions.length ?? 0;
  const canSaveDraft = canSaveWebsiteDraft(dirty, savedVersionCount);
  const registry = builder.data?.registry ?? [];
  const move = (index: number, direction: -1 | 1) => {
    const next = [...currentSections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next.map((section, displayOrder) => ({ ...section, displayOrder })));
    setDirty(true);
  };
  const add = (sectionType: string) => {
    if (currentSections.some(section => section.sectionType === sectionType)) return;
    setSections([...currentSections, { sectionType, displayOrder: currentSections.length, enabled: true, config: {} }]);
    setDirty(true);
  };
  const toggle = (index: number) => {
    setSections(currentSections.map((section, i) => i === index ? { ...section, enabled: !section.enabled } : section));
    setDirty(true);
  };
  const previewSections = useMemo(() => currentSections.filter(section => section.enabled), [currentSections]);
  const selected = currentSections[selectedIndex];
  const updateSelectedConfig = (key: string, value: string) => { if (!selected) return; setSections(currentSections.map((section, index) => index === selectedIndex ? { ...section, config: { ...(section.config ?? {}), [key]: value } } : section)); setDirty(true); };
  useEffect(() => { const handler = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } }; window.addEventListener("beforeunload", handler); return () => window.removeEventListener("beforeunload", handler); }, [dirty]);
  if (builder.isLoading) return <div className="flex items-center gap-2 p-8 text-slate-500"><Loader2 className="size-4 animate-spin" />Loading website builder…</div>;
  if (builder.error || !builder.data) return <div className="rounded-2xl bg-rose-50 p-6 text-rose-800">Website builder is unavailable. Please refresh and try again.</div>;
  return <div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-3xl bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Phase 7 website builder</p><h2 className="mt-2 text-2xl font-semibold">Build a trustworthy website from verified business facts</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Design controls change layout and presentation only. Business facts, services, images, and reviews continue to come from the owner-scoped listing.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={suggestRedesign.isPending} className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => suggestRedesign.mutate({ businessId })}><WandSparkles className="mr-2 size-4" />{suggestRedesign.isPending ? "Drafting…" : "AI redesign draft"}</Button><Button variant="outline" disabled={!dirty} className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => { setSections([]); setDesign(null); setDirty(false); }}>Reset changes</Button><Button disabled={!canSaveDraft || save.isPending} className="bg-blue-500 hover:bg-blue-400" onClick={() => save.mutate({ businessId, sections: currentSections, designConfig: currentDesign, seoTitle: builder.data.page.seoTitle ?? undefined, metaDescription: builder.data.page.metaDescription ?? undefined })}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : savedVersionCount === 0 ? "Create first draft" : "Save draft"}</Button><Button disabled={publish.isPending} className="bg-emerald-500 hover:bg-emerald-400" onClick={() => publish.mutate({ businessId })}>{publish.isPending ? <Loader2 className="size-4 animate-spin" /> : "Publish"}</Button><Button variant="outline" disabled={submitForReview.isPending || dirty} className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => submitForReview.mutate({ businessId })}>{submitForReview.isPending ? <Loader2 className="size-4 animate-spin" /> : "Submit for review"}</Button></div>
    </div>
    {save.error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{save.error.message}</p>}
    {suggestRedesign.error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">AI redesign is unavailable: {suggestRedesign.error.message}</p>}
    {aiProposal && <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Presentation-only redesign ready</p><p className="mt-1 text-blue-800">This proposal changes visual settings only. Your verified facts, services, images, reviews, and ratings are unchanged.</p></div><div className="flex shrink-0 gap-2"><Button size="sm" variant="outline" onClick={() => { setPreviewBaseDesign(currentDesign); setPreviewBaseDirty(dirty); setDesign(aiProposal); setDirty(true); }}>Preview</Button><Button size="sm" variant="outline" onClick={() => rejectRedesign.mutate({ businessId })}>Reject</Button><Button size="sm" onClick={() => applyRedesign.mutate({ businessId, designConfig: aiProposal as never })}>Apply</Button></div></div>}
    {publish.error && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{publish.error.message}</p>}
    {submitForReview.error && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{submitForReview.error.message}</p>}
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_260px]">
      <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4"><div><h3 className="font-semibold">Section library</h3><p className="mt-1 text-xs leading-5 text-slate-500">Add only sections supported by the shared renderer.</p></div><div className="space-y-2">{registry.map(item => <Button key={item.type} variant="outline" className="w-full justify-start rounded-xl" disabled={currentSections.some(section => section.sectionType === item.type)} onClick={() => add(item.type)}>{item.label}</Button>)}</div></aside>
      <main className="min-w-0 rounded-2xl border border-slate-200 bg-slate-100 p-3 sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Live canvas</h3><p className="text-xs text-slate-500">{dirty ? "Unsaved changes" : "Saved design"}</p></div><div className="flex rounded-xl bg-white p-1 shadow-sm">{([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([value, Icon]) => <Button key={value} variant={mode === value ? "default" : "ghost"} size="sm" className="rounded-lg" onClick={() => setMode(value)}><Icon className="size-4" /></Button>)}</div></div><div className={`mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all ${modeWidth[mode]}`}>{detail.data ? <WebsiteRenderer preview data={{ page: { ...builder.data.page, id: builder.data.page.id ?? 0 }, business: detail.data.business, sections: previewSections.map((section, index) => ({ ...section, id: section.id ?? index + 1 })), services: detail.data.services.map(service => ({ id: service.id, name: service.name, description: service.description })), images: detail.data.images, reviews: [], category: undefined, city: undefined }} /> : <div className="p-8 text-sm text-slate-500">Loading verified listing facts…</div>}</div></main>
      <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4"><div><h3 className="font-semibold">Page structure</h3><p className="mt-1 text-xs leading-5 text-slate-500">Reorder, disable, or restore sections. No business fact is generated here.</p></div><div className="space-y-2">{currentSections.map((section, index) => <div key={`${section.sectionType}-${index}`} className={`flex items-center gap-2 rounded-xl border p-2 ${selectedIndex === index ? "border-blue-400 bg-blue-50" : "border-slate-200"} ${section.enabled ? "" : "border-dashed opacity-60"}`}><button type="button" className="min-w-0 flex-1 truncate text-left text-sm font-medium" onClick={() => setSelectedIndex(index)}>{section.sectionType}</button><Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => toggle(index)}>{section.enabled ? "Hide" : "Show"}</Button><Button variant="ghost" size="icon" className="size-7" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move section up"><MoveUp className="size-4" /></Button><Button variant="ghost" size="icon" className="size-7" disabled={index === currentSections.length - 1} onClick={() => move(index, 1)} aria-label="Move section down"><MoveDown className="size-4" /></Button></div>)}</div><div className="border-t pt-4"><h3 className="font-semibold">Properties</h3><label className="mt-3 block text-xs font-medium text-slate-600">Theme<select className="field mt-1" value={String(currentDesign.theme ?? "modern")} onChange={event => { setDesign({ ...currentDesign, theme: event.target.value }); setDirty(true); }}><option value="modern">Modern</option><option value="editorial">Editorial</option><option value="minimal">Minimal</option></select></label><label className="mt-3 block text-xs font-medium text-slate-600">Corner radius<select className="field mt-1" value={String(currentDesign.radius ?? "lg")} onChange={event => { setDesign({ ...currentDesign, radius: event.target.value }); setDirty(true); }}><option value="sm">Compact</option><option value="lg">Soft</option><option value="xl">Rounded</option></select></label>{selected && <label className="mt-3 block text-xs font-medium text-slate-600">Section label<input className="field mt-1" value={String(selected.config?.label ?? "")} placeholder={selected.sectionType} onChange={event => updateSelectedConfig("label", event.target.value)} /></label>}</div></aside>
    </div>
  </div>;
}
