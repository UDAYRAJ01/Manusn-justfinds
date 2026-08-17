import React, { useEffect } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, LayoutDashboard, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import WebsiteRenderer from "@/components/WebsiteRenderer";
import { useAuth } from "@/_core/hooks/useAuth";

type WorkspaceRole = "user" | "business_owner" | "admin" | "super_admin" | undefined;

export function getUnavailableWebsiteAction(role: WorkspaceRole) {
  if (role === "admin" || role === "super_admin") return { href: "/admin", label: "Open admin workspace" };
  if (role === "business_owner") return { href: "/business", label: "Open My listings" };
  return null;
}

export default function PublicWebsite({ slug }: { slug?: string }) {
  const { businessSlug = "" } = useParams<{ businessSlug: string }>();
  const resolvedSlug = slug ?? businessSlug;
  const { user } = useAuth();
  const page = trpc.website.publicPage.useQuery({ slug: resolvedSlug }, { retry: false });
  const track = trpc.website.track.useMutation();
  const unavailableAction = getUnavailableWebsiteAction(user?.role as WorkspaceRole);

  useEffect(() => {
    if (page.data) track.mutate({ pageId: page.data.page.id, businessId: page.data.business.id, eventType: "page_view" });
  }, [page.data?.page.id, page.data?.business.id]);

  if (page.isLoading) {
    return <div className="grid min-h-screen place-items-center bg-[#f8fafc] text-slate-500"><div className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" />Loading business website…</div></div>;
  }

  if (page.error || !page.data) {
    return <main className="grid min-h-screen place-items-center bg-[#f8fafc] p-6 text-center text-slate-900">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Just Finds business website</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Website not published</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">This business has not published a public website at this address.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/search" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700"><ArrowLeft className="size-4" />Explore Just Finds</Link>
          {unavailableAction && <Link href={unavailableAction.href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"><LayoutDashboard className="size-4" />{unavailableAction.label}</Link>}
        </div>
      </section>
    </main>;
  }

  return <WebsiteRenderer data={page.data} onTrack={eventType => { void track.mutateAsync({ pageId: page.data.page.id, businessId: page.data.business.id, eventType }); }} />;
}
