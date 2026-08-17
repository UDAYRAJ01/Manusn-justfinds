import React, { useEffect, useMemo, useState } from "react";
import WebsiteRenderer from "@/components/WebsiteRenderer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  ImagePlus,
  Layers3,
  LayoutTemplate,
  Loader2,
  Monitor,
  Palette,
  PanelRight,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Type,
  WandSparkles,
} from "lucide-react";

type PreviewMode = "desktop" | "tablet" | "mobile";
type BuilderSection = { id?: number; sectionType: string; displayOrder: number; enabled: boolean; config?: Record<string, unknown> };

const modeWidth: Record<PreviewMode, string> = {
  desktop: "w-full",
  tablet: "max-w-[760px]",
  mobile: "max-w-[390px]",
};

export function restorePreviewDesign(previousDesign: Record<string, unknown> | null, previousDirty: boolean) {
  return { design: previousDesign, dirty: previousDirty };
}

export function canSaveWebsiteDraft(dirty: boolean, savedVersionCount: number) {
  return dirty || savedVersionCount === 0;
}

function deviceOptions() {
  return [
    ["desktop", Monitor, "Desktop"],
    ["tablet", Tablet, "Tablet"],
    ["mobile", Smartphone, "Mobile"],
  ] as const;
}

function sectionTitle(type: string) {
  return type.replace(/-/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function WebsiteBuilder({ businessId }: { businessId: number }) {
  const builder = trpc.website.builder.useQuery({ businessId });
  const detail = trpc.business.businessDetail.useQuery({ businessId });
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<PreviewMode>("desktop");
  const [dirty, setDirty] = useState(false);
  const [sections, setSections] = useState<BuilderSection[]>([]);
  const [design, setDesign] = useState<Record<string, unknown> | null>(null);
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [aiProposal, setAiProposal] = useState<Record<string, unknown> | null>(null);
  const [previewBaseDesign, setPreviewBaseDesign] = useState<Record<string, unknown> | null>(null);
  const [previewBaseDirty, setPreviewBaseDirty] = useState(false);
  const [sectionInstruction, setSectionInstruction] = useState("");
  const [aiGenerated, setAiGenerated] = useState(false);
  const [imageSuggestions, setImageSuggestions] = useState<{ sectionType: string; message: string | null; items: Array<{ imageId: number; url: string; alt?: string | null; imageType: string; reason: string }> } | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const save = trpc.website.saveDraft.useMutation({
    onSuccess: () => { setDirty(false); void utils.website.builder.invalidate({ businessId }); },
  });
  const publish = trpc.website.publish.useMutation({
    onSuccess: () => { setPublishOpen(false); void utils.website.builder.invalidate({ businessId }); },
  });
  const suggestRedesign = trpc.website.suggestRedesign.useMutation({
    onSuccess: result => setAiProposal(result.proposal as Record<string, unknown>),
  });
  const generateDraft = trpc.website.generateDraft.useMutation({
    onSuccess: result => {
      setSections(result.draft.sections.map((section, displayOrder) => ({ sectionType: section.sectionType, displayOrder, enabled: true, config: section.config })));
      setSeoTitle(result.draft.seoTitle);
      setMetaDescription(result.draft.metaDescription);
      setDesign(null);
      setSelectedIndex(0);
      setAiGenerated(true);
      setDirty(true);
    },
  });
  const regenerateSection = trpc.website.regenerateSection.useMutation({
    onSuccess: result => {
      setSections(currentSections.map((section, index) => index === selectedIndex ? { ...section, config: result.config } : section));
      setSectionInstruction("");
      setDirty(true);
    },
  });
  const suggestSectionImages = trpc.website.suggestSectionImages.useMutation({
    onSuccess: result => setImageSuggestions({ sectionType: result.sectionType, message: result.message ?? null, items: result.suggestions }),
  });
  const applyRedesign = trpc.website.applyRedesign.useMutation({
    onSuccess: () => {
      setPreviewBaseDesign(null);
      setPreviewBaseDirty(false);
      if (aiProposal) { setDesign(aiProposal); setAiProposal(null); setDirty(true); }
      void utils.website.builder.invalidate({ businessId });
    },
  });
  const rejectRedesign = trpc.website.rejectRedesign.useMutation({
    onSuccess: () => {
      const restored = restorePreviewDesign(previewBaseDesign, previewBaseDirty);
      setDesign(restored.design);
      setDirty(restored.dirty);
      setPreviewBaseDesign(null);
      setAiProposal(null);
    },
  });
  const submitForReview = trpc.website.submitForReview.useMutation({ onSuccess: () => void utils.website.builder.invalidate({ businessId }) });

  const sourceSections = builder.data?.sections ?? [];
  const currentSections = sections.length
    ? sections
    : sourceSections.map(section => ({ id: section.id, sectionType: section.sectionType, displayOrder: section.displayOrder, enabled: section.enabled, config: (section.config ?? {}) as Record<string, unknown> }));
  const currentDesign = design ?? (builder.data?.designConfig as Record<string, unknown> | undefined) ?? {};
  const savedVersionCount = builder.data?.versions.length ?? 0;
  const canSaveDraft = canSaveWebsiteDraft(dirty, savedVersionCount);
  const selected = currentSections[selectedIndex];
  const previewSections = useMemo(() => currentSections.filter(section => section.enabled), [currentSections]);
  const registry = builder.data?.registry ?? [];
  const listing = detail.data?.business;
  const status = dirty ? "Unsaved changes" : builder.data?.page.status === "published" ? "Published" : savedVersionCount ? "Draft saved" : "Ready to create";

  useEffect(() => {
    if (!builder.data) return;
    setSeoTitle(builder.data.page.seoTitle ?? "");
    setMetaDescription(builder.data.page.metaDescription ?? "");
  }, [builder.data?.page.seoTitle, builder.data?.page.metaDescription]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const changeDesign = (key: string, value: string) => { setDesign({ ...currentDesign, [key]: value }); setDirty(true); };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= currentSections.length) return;
    const next = [...currentSections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next.map((section, displayOrder) => ({ ...section, displayOrder })));
    setSelectedIndex(selectedIndex === index ? target : selectedIndex === target ? index : selectedIndex);
    setDirty(true);
  };
  const selectSection = (index: number) => { setSelectedIndex(index); };
  const add = (sectionType: string) => {
    if (currentSections.some(section => section.sectionType === sectionType)) return;
    setSections([...currentSections, { sectionType, displayOrder: currentSections.length, enabled: true, config: {} }]);
    setSelectedIndex(currentSections.length);
    setDirty(true);
  };
  const toggle = (index: number) => {
    setSections(currentSections.map((section, sectionIndex) => sectionIndex === index ? { ...section, enabled: !section.enabled } : section));
    setDirty(true);
  };
  const updateSelectedConfig = (key: string, value: string) => {
    if (!selected) return;
    setSections(currentSections.map((section, index) => index === selectedIndex ? { ...section, config: { ...(section.config ?? {}), [key]: value } } : section));
    setDirty(true);
  };
  const setCtaPlacement = (placement: "top" | "middle" | "bottom") => {
    const ctaIndex = currentSections.findIndex(section => section.sectionType === "cta");
    if (ctaIndex < 0) return;
    const next = [...currentSections];
    const [cta] = next.splice(ctaIndex, 1);
    const nextIndex = placement === "top" ? Math.min(1, next.length) : placement === "middle" ? Math.floor(next.length / 2) : next.length;
    next.splice(nextIndex, 0, cta);
    setSections(next.map((section, displayOrder) => ({ ...section, displayOrder })));
    setSelectedIndex(nextIndex);
    setDirty(true);
  };

  if (builder.isLoading) return <div className="flex items-center gap-2 p-8 text-slate-500"><Loader2 className="size-4 animate-spin" />Loading website studio…</div>;
  if (builder.error || !builder.data) return <div className="rounded-2xl bg-rose-50 p-6 text-rose-800">Website Builder is unavailable. Please refresh and try again.</div>;

  const renderDeviceSelector = (className = "") => <div className={`flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm ${className}`} role="group" aria-label="Website preview mode">
    {deviceOptions().map(([value, Icon, label]) => <Button key={value} type="button" variant={mode === value ? "default" : "ghost"} size="sm" className="gap-1.5 rounded-lg px-2.5" aria-label={`Show ${value} preview`} aria-pressed={mode === value} onClick={() => setMode(value)}><Icon className="size-4" /><span>{label}</span></Button>)}
  </div>;

  const renderInspector = (mobile = false) => <section className={`${mobile ? "xl:hidden" : "hidden xl:block"} rounded-2xl border border-slate-200 bg-white p-4 shadow-sm`} aria-label="Selected section inspector">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">Contextual inspector</p><h3 className="mt-1 font-semibold text-slate-950">{selected ? sectionTitle(selected.sectionType) : "Select a section"}</h3></div>
      <PanelRight className="size-4 text-slate-400" />
    </div>
    {selected ? <div className="mt-4 space-y-4">
      <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">Edit presentation copy and display settings for this section. Listing facts below remain protected.</div>
      <label className="block text-xs font-semibold text-slate-700">Section label<input className="field mt-1" value={String(selected.config?.label ?? "")} placeholder={sectionTitle(selected.sectionType)} onChange={event => updateSelectedConfig("label", event.target.value)} /></label>
      <label className="block text-xs font-semibold text-slate-700">Supporting text<textarea className="field mt-1 min-h-24" value={String(selected.config?.body ?? "")} placeholder="Helpful, factual supporting text" onChange={event => updateSelectedConfig("body", event.target.value)} /></label>
      {selected.sectionType === "hero" && <label className="block text-xs font-semibold text-slate-700">Hero headline<input className="field mt-1" value={String(selected.config?.headline ?? "")} placeholder="A clear customer-facing headline" onChange={event => updateSelectedConfig("headline", event.target.value)} /></label>}
      <div className="grid grid-cols-2 gap-2"><Button type="button" size="sm" variant="outline" onClick={() => move(selectedIndex, -1)} disabled={selectedIndex === 0}><ChevronUp className="mr-1 size-4" />Up</Button><Button type="button" size="sm" variant="outline" onClick={() => move(selectedIndex, 1)} disabled={selectedIndex === currentSections.length - 1}><ChevronDown className="mr-1 size-4" />Down</Button></div>
      <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => toggle(selectedIndex)}>{selected.enabled ? "Hide" : "Show"} section</Button>
      <div className="border-t border-slate-100 pt-4"><p className="text-xs font-semibold text-slate-700">AI refinement</p><input className="field mt-2" value={sectionInstruction} placeholder="Make this clearer and shorter" onChange={event => setSectionInstruction(event.target.value)} /><div className="mt-2 grid gap-2"><Button type="button" size="sm" variant="outline" disabled={regenerateSection.isPending || !sectionInstruction.trim()} onClick={() => regenerateSection.mutate({ businessId, sectionType: selected.sectionType, instruction: sectionInstruction.trim() })}>{regenerateSection.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}Refine section with AI</Button><Button type="button" size="sm" variant="outline" disabled={suggestSectionImages.isPending} onClick={() => suggestSectionImages.mutate({ businessId, sectionType: selected.sectionType })}><ImagePlus className="mr-2 size-4" />Suggest photos with AI</Button></div></div>
      {imageSuggestions?.sectionType === selected.sectionType && <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-xs text-violet-950"><p className="font-semibold">Photo suggestions</p><p className="mt-1">{imageSuggestions.message ?? `${imageSuggestions.items.length} owner-uploaded photo match(es) found.`}</p>{imageSuggestions.items.map(item => <p key={item.imageId} className="mt-1 text-violet-800">• {item.reason}</p>)}</div>}
    </div> : <p className="mt-4 text-sm text-slate-500">Choose a section from the structure panel to edit its presentation.</p>}
  </section>;

  return <div className="space-y-5">
    <header className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
        <div className="max-w-2xl"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-100"><LayoutTemplate className="size-3.5" />Website studio</span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${dirty ? "bg-amber-400/15 text-amber-100" : builder.data.page.status === "published" ? "bg-emerald-400/15 text-emerald-100" : "bg-white/10 text-slate-200"}`}><span className={`size-1.5 rounded-full ${dirty ? "bg-amber-300" : builder.data.page.status === "published" ? "bg-emerald-300" : "bg-slate-300"}`} />{status}</span></div><h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Edit your website with confidence</h2><p className="mt-2 text-sm leading-6 text-slate-300">Design, layout, section order, and calls to action are editable here. Verified listing facts are protected and stay linked to the business profile.</p></div>
        <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" disabled={generateDraft.isPending} className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => generateDraft.mutate({ businessId })}><Sparkles className="mr-2 size-4" />{generateDraft.isPending ? "Generating…" : "Generate with AI"}</Button><Button type="button" variant="outline" disabled={suggestRedesign.isPending} className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => suggestRedesign.mutate({ businessId })}><WandSparkles className="mr-2 size-4" />{suggestRedesign.isPending ? "Drafting…" : "AI design"}</Button><Button type="button" variant="outline" disabled={!dirty} className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => { setSections([]); setDesign(null); setSeoTitle(builder.data.page.seoTitle ?? ""); setMetaDescription(builder.data.page.metaDescription ?? ""); setDirty(false); }}>Reset</Button><Button type="button" disabled={!canSaveDraft || save.isPending} className="bg-blue-500 text-white hover:bg-blue-400" onClick={() => save.mutate({ businessId, sections: currentSections, designConfig: currentDesign, seoTitle: seoTitle.trim() || undefined, metaDescription: metaDescription.trim() || undefined })}>{save.isPending ? <Loader2 className="size-4 animate-spin" /> : savedVersionCount === 0 ? "Create first draft" : "Save draft"}</Button></div>
      </div>
    </header>

    {(save.error || publish.error || submitForReview.error || generateDraft.error || regenerateSection.error || suggestSectionImages.error || suggestRedesign.error) && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{save.error?.message ?? publish.error?.message ?? submitForReview.error?.message ?? generateDraft.error?.message ?? regenerateSection.error?.message ?? suggestSectionImages.error?.message ?? suggestRedesign.error?.message}</div>}
    {aiGenerated && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><p className="font-semibold">Factual AI website draft is ready</p><p className="mt-1 text-emerald-800">Review its presentation and save a private draft. It cannot create or change business ratings, reviews, services, or listing facts.</p></div>}
    {aiProposal && <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Presentation-only design proposal</p><p className="mt-1 text-blue-800">This affects theme, typography, spacing, and color only. Verified business facts are unchanged.</p></div><div className="flex shrink-0 gap-2"><Button type="button" size="sm" variant="outline" onClick={() => { setPreviewBaseDesign(currentDesign); setPreviewBaseDirty(dirty); setDesign(aiProposal); setDirty(true); }}>Preview</Button><Button type="button" size="sm" variant="outline" onClick={() => rejectRedesign.mutate({ businessId })}>Reject</Button><Button type="button" size="sm" onClick={() => applyRedesign.mutate({ businessId, designConfig: aiProposal as never })}>Apply</Button></div></div>}

    <div className="grid gap-5 xl:grid-cols-[292px_minmax(0,1fr)_312px] xl:items-start">
      <aside className="hidden space-y-5 xl:block xl:sticky xl:top-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><Palette className="size-4 text-blue-600" /><div><h3 className="font-semibold text-slate-950">Design settings</h3><p className="text-xs text-slate-500">Presentation only</p></div></div><div className="mt-4 space-y-3"><label className="block text-xs font-semibold text-slate-700">Theme<select className="field mt-1" value={String(currentDesign.theme ?? "modern")} onChange={event => changeDesign("theme", event.target.value)}><option value="modern">Modern</option><option value="editorial">Editorial</option><option value="minimal">Minimal</option></select></label><label className="block text-xs font-semibold text-slate-700">Typography<select className="field mt-1" value={String(currentDesign.typography ?? "clean")} onChange={event => changeDesign("typography", event.target.value)}><option value="clean">Clean</option><option value="serif">Editorial serif</option><option value="compact">Compact</option></select></label><label className="block text-xs font-semibold text-slate-700">Layout width<select className="field mt-1" value={String(currentDesign.sectionWidth ?? "wide")} onChange={event => changeDesign("sectionWidth", event.target.value)}><option value="contained">Contained</option><option value="wide">Wide</option><option value="full">Full</option></select></label><label className="block text-xs font-semibold text-slate-700">Spacing<select className="field mt-1" value={String(currentDesign.spacing ?? "comfortable")} onChange={event => changeDesign("spacing", event.target.value)}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="airy">Airy</option></select></label><label className="block text-xs font-semibold text-slate-700">CTA placement<select className="field mt-1" value={selected?.sectionType === "cta" ? "middle" : "bottom"} onChange={event => setCtaPlacement(event.target.value as "top" | "middle" | "bottom")} disabled={!currentSections.some(section => section.sectionType === "cta")}><option value="top">Near the top</option><option value="middle">Mid-page</option><option value="bottom">Near the bottom</option></select></label></div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><Layers3 className="size-4 text-blue-600" /><div><h3 className="font-semibold text-slate-950">Sections</h3><p className="text-xs text-slate-500">Add approved layouts</p></div></div><div className="mt-3 grid grid-cols-2 gap-2">{registry.map(item => <Button key={item.type} type="button" size="sm" variant="outline" className="h-auto min-h-9 justify-start text-left text-xs" disabled={currentSections.some(section => section.sectionType === item.type)} onClick={() => add(item.type)}>+ {item.label}</Button>)}</div></section>
        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-blue-700" /><div><h3 className="text-sm font-semibold text-blue-950">Protected business facts</h3><p className="text-xs text-blue-700">Read-only in Website Builder</p></div></div><dl className="mt-3 space-y-2 text-xs text-blue-950"><div><dt className="text-blue-700">Business</dt><dd className="mt-0.5 font-medium">{listing?.name ?? builder.data.business.name}</dd></div><div><dt className="text-blue-700">Address</dt><dd className="mt-0.5 font-medium">{listing?.address ?? "From approved listing"}</dd></div><div><dt className="text-blue-700">Services & photos</dt><dd className="mt-0.5 font-medium">Managed in the business profile</dd></div></dl><p className="mt-3 border-t border-blue-200 pt-3 text-[11px] leading-5 text-blue-800">To correct these facts, use the business profile—not this design studio.</p></section>
      </aside>

      <main className="min-w-0 space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Eye className="size-4 text-blue-600" /><h3 className="font-semibold text-slate-950">Responsive preview</h3></div><p className="mt-1 text-xs text-slate-500">Changes appear here immediately. Customer actions stay disabled in preview.</p></div>{renderDeviceSelector()}</div><div className="xl:hidden"><div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2"><Button type="button" size="sm" variant="outline" onClick={() => document.getElementById("mobile-design-settings")?.scrollIntoView({ behavior: "smooth", block: "start" })}><Palette className="mr-2 size-4" />Design</Button><Button type="button" size="sm" variant="outline" onClick={() => document.getElementById("mobile-section-editor")?.scrollIntoView({ behavior: "smooth", block: "start" })}><PanelRight className="mr-2 size-4" />Edit section</Button></div></div><div data-preview-mode={mode} className={`mx-auto mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,.45)] transition-all duration-200 ${modeWidth[mode]}`}>{detail.data ? <WebsiteRenderer preview data={{ page: { ...builder.data.page, id: builder.data.page.id ?? 0 }, business: detail.data.business, sections: previewSections.map((section, index) => ({ ...section, id: section.id ?? index + 1 })), services: detail.data.services.map(service => ({ id: service.id, name: service.name, description: service.description })), images: detail.data.images, reviews: [], category: undefined, city: undefined }} /> : <div className="p-10 text-sm text-slate-500">Loading verified listing facts…</div>}</div></section>
        <section id="mobile-design-settings" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 xl:hidden"><div className="flex items-center gap-2"><Palette className="size-4 text-blue-600" /><div><h3 className="font-semibold">Focused mobile controls</h3><p className="text-xs text-slate-500">Choose one design setting at a time.</p></div></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-700">Theme<select className="field mt-1" value={String(currentDesign.theme ?? "modern")} onChange={event => changeDesign("theme", event.target.value)}><option value="modern">Modern</option><option value="editorial">Editorial</option><option value="minimal">Minimal</option></select></label><label className="text-xs font-semibold text-slate-700">Typography<select className="field mt-1" value={String(currentDesign.typography ?? "clean")} onChange={event => changeDesign("typography", event.target.value)}><option value="clean">Clean</option><option value="serif">Editorial serif</option><option value="compact">Compact</option></select></label></div></section>
        <div id="mobile-section-editor">{renderInspector(true)}</div>
      </main>

      <aside className="space-y-5 xl:sticky xl:top-5">
        {renderInspector(false)}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><Layers3 className="size-4 text-blue-600" /><div><h3 className="font-semibold text-slate-950">Page structure</h3><p className="text-xs text-slate-500">Select, order, show or hide sections</p></div></div><div className="mt-4 space-y-2">{currentSections.map((section, index) => <div key={`${section.sectionType}-${index}`} className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${selectedIndex === index ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"} ${section.enabled ? "" : "border-dashed opacity-60"}`}><button type="button" className="min-w-0 flex-1 truncate text-left text-sm font-medium text-slate-800" onClick={() => selectSection(index)}>{section.sectionType}</button><Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => toggle(index)}>{section.enabled ? "Hide" : "Show"}</Button></div>)}</div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><Type className="size-4 text-blue-600" /><div><h3 className="font-semibold text-slate-950">Search settings</h3><p className="text-xs text-slate-500">Website metadata, not listing facts</p></div></div><label className="mt-4 block text-xs font-semibold text-slate-700">SEO title<input className="field mt-1" maxLength={180} value={seoTitle} placeholder="A clear title for search results" onChange={event => { setSeoTitle(event.target.value); setDirty(true); }} /></label><label className="mt-3 block text-xs font-semibold text-slate-700">Meta description<textarea className="field mt-1 min-h-20" maxLength={300} value={metaDescription} placeholder="A concise, factual description" onChange={event => { setMetaDescription(event.target.value); setDirty(true); }} /></label></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" /><div><h3 className="font-semibold text-slate-950">Publishing</h3><p className="text-xs text-slate-500">Status: {builder.data.page.status}</p></div></div><p className="mt-3 text-xs leading-5 text-slate-600">Publishing uses your saved draft. It never writes to your core business listing or protected facts.</p><div className="mt-3 grid gap-2"><Button type="button" variant="outline" disabled={submitForReview.isPending || dirty} onClick={() => submitForReview.mutate({ businessId })}>{submitForReview.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Submit for review</Button><Button type="button" disabled={publish.isPending || dirty || savedVersionCount === 0} onClick={() => setPublishOpen(true)}>{publish.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}{dirty ? "Save draft before publishing" : "Publish website"}</Button></div>{dirty && <p className="mt-2 text-xs text-amber-700">Save your draft before publishing or submitting for review.</p>}</section>
      </aside>
    </div>

    <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Publish this saved website?</AlertDialogTitle><AlertDialogDescription>Your saved design, enabled sections, and metadata will be published according to the current website workflow. This action does not change your business name, address, services, photos, ratings, or reviews.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={() => publish.mutate({ businessId })} disabled={publish.isPending}>{publish.isPending ? "Publishing…" : "Confirm publish"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
