import { PageFrame } from "@/components/PageFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { BriefcaseBusiness, Building2, ChevronRight, Clock3, FileText, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

export default function Jobs() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const input = useMemo(() => ({ query: submitted }), [submitted]);
  const { data: jobs, isLoading } = trpc.jobs.list.useQuery(input);

  return <PageFrame>
    <section className="border-b border-slate-200 bg-[linear-gradient(135deg,#f7f9ff_0%,#ffffff_52%,#edf3ff_100%)] py-12 sm:py-16">
      <div className="container">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-[#2456c8] shadow-sm"><BriefcaseBusiness className="size-3.5" />Just Finds Jobs</span>
        <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-.06em] text-slate-950 sm:text-5xl">Find work that is closer to home.</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">Explore moderated local roles connected to real Just Finds business profiles. Search by role, category, or employer.</p>
        <div className="mt-8 flex max-w-2xl rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_14px_32px_rgba(15,23,42,.08)]"><Search className="ml-3 mt-3 size-5 shrink-0 text-slate-400" /><Input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === "Enter" && setSubmitted(query)} placeholder="Job title, category, or business" className="h-11 border-0 text-slate-900 shadow-none focus-visible:ring-0" /><Button onClick={() => setSubmitted(query)} className="rounded-xl px-5">Search</Button></div>
      </div>
    </section>
    <section className="container py-10 sm:py-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Local opportunity</p><h2 className="section-title">Open roles near you</h2><p className="mt-2 text-sm text-slate-500">Only published roles appear in public discovery.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="bg-white"><MapPin className="mr-2 size-4" />Kanpur</Button><Button variant="outline" className="bg-white"><SlidersHorizontal className="mr-2 size-4" />Filters</Button></div></div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"><div className="grid gap-3">
        {isLoading ? [...Array(3)].map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />) : jobs?.length ? jobs.map(job => <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_7px_18px_rgba(15,23,42,.035)] transition-shadow hover:shadow-[0_12px_24px_rgba(15,23,42,.07)]"><div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#2456c8]"><BriefcaseBusiness className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold tracking-[-.025em] text-slate-950">{job.title}</h3><p className="mt-1 text-sm text-slate-500">{job.company}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{job.jobType}</span></div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{job.city}</span><span className="inline-flex items-center gap-1"><Building2 className="size-3.5" />{job.category}</span><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{job.experience}</span><span>{job.salary}</span></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-400">{job.posted instanceof Date ? job.posted.toLocaleDateString() : job.posted}</span><JobApplyDialog jobId={job.id} title={job.title} /></div></div></div></article>) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><FileText className="mx-auto size-8 text-slate-400" /><h3 className="mt-3 font-semibold text-slate-900">No local jobs match that search.</h3><p className="mt-2 text-sm text-slate-500">Try a broader search or check back as moderated roles are published.</p></div>}
      </div><aside className="h-fit rounded-2xl border border-blue-100 bg-blue-50/70 p-6"><span className="grid size-10 place-items-center rounded-xl bg-[#2456c8] text-white"><Building2 className="size-5" /></span><h3 className="mt-5 text-xl font-semibold tracking-[-.035em] text-slate-950">Hiring locally?</h3><p className="mt-3 text-sm leading-6 text-slate-600">Use your business workspace to draft roles, review applicants, and submit listings for approval.</p><Link href="/owner/jobs"><Button className="mt-6 w-full">Open employer tools</Button></Link><p className="mt-3 text-center text-[11px] leading-4 text-slate-500">Publication requires Just Finds moderation.</p></aside></div>
    </section>
  </PageFrame>;
}

function JobApplyDialog({ jobId, title }: { jobId: number; title: string }) {
  const { isAuthenticated } = useAuth(); const [note, setNote] = useState(""); const apply = trpc.jobs.submitApplication.useMutation();
  return <Dialog><DialogTrigger asChild><Button variant="outline" className="h-9 bg-white text-xs">View role <ChevronRight className="ml-1 size-3.5" /></Button></DialogTrigger><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Applications are private to the employer and are available only for approved published roles.</DialogDescription></DialogHeader>{!isAuthenticated ? <div className="rounded-xl bg-slate-50 p-5"><p className="text-sm leading-6 text-slate-600">Sign in to apply and to keep a private record of your local job applications.</p><Button onClick={() => startLogin()} className="mt-4">Sign in to apply</Button></div> : <div className="grid gap-3"><label className="text-sm font-semibold text-slate-700">Message to employer<textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Briefly introduce yourself and your relevant experience." className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-blue-400" /></label><Button disabled={apply.isPending || apply.isSuccess} onClick={() => apply.mutate({ jobId, note: note || undefined })}>{apply.isSuccess ? "Application submitted" : apply.isPending ? "Submitting…" : "Submit application"}</Button>{apply.error && <p className="rounded-lg bg-rose-50 p-3 text-xs leading-5 text-rose-700">{apply.error.message}</p>}</div>}</DialogContent></Dialog>;
}
