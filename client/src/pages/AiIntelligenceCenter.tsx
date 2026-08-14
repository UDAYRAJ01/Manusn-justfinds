import { Sparkles, CheckCircle2, ShieldCheck, Activity, Cpu, Bot, Search } from "lucide-react";

export function AiIntelligenceCenter() {
  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-[#173d9c]">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">AI Intelligence Center</h2>
            <p className="mt-1 text-sm text-slate-500">Monitor system-wide AI services, automated jobs, content intelligence, and search query parsing health.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Provider</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-600" /> READY
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-900">Forge LLM Proxy</p>
            <p className="mt-1 text-xs text-slate-500">Connected via secure system bearer token.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Content Generation</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-600" /> READY
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-900">Factual AI Content</p>
            <p className="mt-1 text-xs text-slate-500">Strict grounding & approval workflows active.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Search Parser</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-600" /> READY
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-900">Intent & Entity Parser</p>
            <p className="mt-1 text-xs text-slate-500">Deterministic query intent extraction.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Business Chatbot</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-600" /> READY
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-900">Isolated Knowledge Bot</p>
            <p className="mt-1 text-xs text-slate-500">Scoped per business profile.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recommendation Engine</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-600" /> READY
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-900">Reputation Score</p>
            <p className="mt-1 text-xs text-slate-500">Explainable multi-signal ranking.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">SEO Automation</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-600" /> READY
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-900">Sitemaps & Schema</p>
            <p className="mt-1 text-xs text-slate-500">Published-only public indexing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
