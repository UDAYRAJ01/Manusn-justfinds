import { PageFrame } from "@/components/PageFrame";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, CircleAlert, FileCheck2, MapPin, ShieldCheck } from "lucide-react";
import { Link, useRoute } from "wouter";

export default function VerifyBusiness() {
  const [, params] = useRoute("/verify/:slug");
  const { data, isLoading } = trpc.discovery.certificate.useQuery({ slug: params?.slug ?? "" }, { enabled: Boolean(params?.slug) });

  if (isLoading) {
    return <PageFrame><div className="container py-16"><div className="mx-auto max-w-xl animate-pulse rounded-[28px] bg-white p-8 shadow-sm"><div className="h-7 w-56 rounded bg-slate-200" /><div className="mt-5 h-16 rounded bg-slate-100" /><div className="mt-5 h-20 rounded bg-slate-100" /></div></div></PageFrame>;
  }

  if (!data) {
    return <PageFrame><PageMeta /><div className="container py-16"><div className="mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm"><CircleAlert className="mx-auto size-10 text-orange-600" /><h1 className="mt-4 text-2xl font-semibold text-slate-900">Certificate unavailable</h1><p className="mt-2 text-sm leading-6 text-slate-500">Just Finds could not find a published business certificate for this verification link.</p><Link href="/search"><Button className="mt-6 rounded-xl">Explore businesses</Button></Link></div></div></PageFrame>;
  }

  const business = data.business;
  const certificate = data.certificate;
  const verified = data.valid;

  return <PageFrame className="bg-[#fbfaf7]"><PageMeta business={{ name: business.name, address: business.address }} /><section className="container py-10 sm:py-16"><div className="mx-auto max-w-2xl overflow-hidden rounded-[30px] border border-[#eadfca] bg-[#fffcf5] shadow-[0_18px_50px_rgba(19,43,91,.08)]"><div className="bg-[#102a6b] px-6 py-8 text-center text-white sm:px-10"><FileCheck2 className="mx-auto size-10 text-[#e4c889]" /><p className="mt-4 text-xs font-semibold uppercase tracking-[.22em] text-blue-100">Just Finds verification</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Business certificate</h1><p className="mt-3 text-sm leading-6 text-blue-100/80">This page checks the listing status recorded by Just Finds.</p></div><div className="p-6 sm:p-10"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Published listing</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">{business.name}</h2><p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-500"><MapPin className="mt-1 size-4 shrink-0 text-[#d76546]" />{business.address}</p></div><span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${verified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{verified ? <BadgeCheck className="size-6" /> : <ShieldCheck className="size-6" />}</span></div><div className={`mt-8 rounded-2xl border p-4 ${verified ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><p className={`text-sm font-semibold ${verified ? "text-emerald-800" : "text-slate-700"}`}>{verified ? "Verified Just Finds listing" : "Listed on Just Finds"}</p><p className="mt-1 text-xs leading-5 text-slate-600">{verified ? "The certificate matches a published business profile and a verified Just Finds status." : "The profile is published, but Just Finds has not marked its verification status as verified."}</p></div>{certificate.certificateId && <p className="mt-6 text-xs text-slate-400">Certificate ID: <span className="font-mono text-slate-600">{certificate.certificateId}</span></p>}<p className="mt-6 text-xs leading-5 text-slate-400">This verification does not endorse third-party claims, ratings, reviews, or guarantees. It confirms only the Just Finds listing record shown above.</p><Link href={`/${business.slug}`}><Button variant="outline" className="mt-6 rounded-xl bg-white">View business profile</Button></Link></div></div></section></PageFrame>;
}
