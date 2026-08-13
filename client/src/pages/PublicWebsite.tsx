import { useEffect } from "react";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import WebsiteRenderer from "@/components/WebsiteRenderer";

export default function PublicWebsite() {
  const { businessSlug = "" } = useParams<{ businessSlug: string }>();
  const page = trpc.website.publicPage.useQuery({ slug: businessSlug });
  const track = trpc.website.track.useMutation();
  useEffect(() => { if (page.data) track.mutate({ pageId: page.data.page.id, businessId: page.data.business.id, eventType: "page_view" }); }, [page.data?.page.id, page.data?.business.id]);
  if (page.isLoading) return <div className="grid min-h-screen place-items-center text-slate-500"><Loader2 className="size-5 animate-spin" /></div>;
  if (page.error || !page.data) return <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center"><div><h1 className="text-2xl font-semibold text-slate-900">Website not found</h1><p className="mt-2 text-slate-500">This business website is not published.</p></div></div>;
  return <WebsiteRenderer data={page.data} onTrack={eventType => { void track.mutateAsync({ pageId: page.data.page.id, businessId: page.data.business.id, eventType }); }} />;
}
