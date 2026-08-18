import { AIChatBox, Message } from "@/components/AIChatBox";
import { LocationPill, PageFrame } from "@/components/PageFrame";
import { PageMeta } from "@/components/PageMeta";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { getBusinessDetailSections, hasBookableAppointment } from "@/lib/businessDetailSections";
import { parseBusinessCoordinates } from "@/lib/businessLocation";
import { useUserLocation } from "@/hooks/useUserLocation";
import { BusinessHoursDay, BusinessSpecialHours, formatBusinessHours, getBusinessHoursDayName, getBusinessHoursStatus } from "@/lib/businessHours";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { QRCodeSVG } from "qrcode.react";
import { BadgeCheck, Bookmark, Bot, CalendarDays, Check, ChevronDown, ChevronLeft, CircleAlert, Clock3, Compass, Copy, ExternalLink, FileCheck2, Flag, Headphones, Image as ImageIcon, MapPin, MessageCircle, Phone, Play, Printer, Save, Send, Share2, ShieldCheck, Sparkles, Star, Tag, Volume2, X } from "lucide-react";
import { useState, type ElementType, type ReactNode } from "react";
import { Link, useRoute } from "wouter";

const FALLBACK_DESCRIPTION = "This listing is awaiting owner-approved descriptive content. Just Finds only publishes AI-assisted content after it has been checked against the business's own information.";

function formatDistanceFromUser(
  user: { latitude: number; longitude: number } | null,
  business: { lat: number; lng: number } | null,
) {
  if (!user || !business) return null;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latDelta = toRadians(business.lat - user.latitude);
  const lonDelta = toRadians(business.lng - user.longitude);
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(toRadians(user.latitude)) * Math.cos(toRadians(business.lat)) * Math.sin(lonDelta / 2) ** 2;
  const kilometres = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (!Number.isFinite(kilometres)) return null;
  return kilometres < 1 ? `${Math.max(50, Math.round((kilometres * 1000) / 50) * 50)} m` : `${kilometres.toFixed(kilometres < 10 ? 1 : 0)} km`;
}

type ProfileBusiness = {
  id: number;
  name: string;
  shortDescription?: string | null;
  approvedDescription?: string | null;
  voiceIntroductionUrl?: string | null;
  address: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  timezone?: string | null;
  isVerified?: boolean;
  reputationScore?: number;
};

type ProfileImage = { id: number; url: string; alt?: string | null; imageType?: string | null };
type ProfileFaq = { question: string; answer: string };

export default function BusinessDetail() {
  const [, params] = useRoute("/:category/:city/:slug");
  const auth = useAuth();
  const trpcUtils = trpc.useUtils();
  const { data, isLoading } = trpc.discovery.business.useQuery({ slug: params?.slug ?? "" }, { enabled: Boolean(params?.slug) });
  const businessId = data?.business?.id ?? 0;
  const appointmentAvailability = trpc.business.publicAppointmentAvailability.useQuery({ businessId }, { enabled: businessId > 0, retry: false });
  const savedQuery = trpc.discovery.saved.useQuery({ businessId }, { enabled: auth.isAuthenticated && businessId > 0, retry: false });
  const saveMutation = trpc.discovery.toggleSave.useMutation({ onSuccess: () => trpcUtils.discovery.saved.invalidate({ businessId }) });
  const [activeSection, setActiveSection] = useState("overview");
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProfileImage | null>(null);
  const { coordinates: userCoordinates } = useUserLocation();

  if (isLoading) return <PageFrame><div className="container py-10"><div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200" /><div className="mt-7 h-[360px] animate-pulse rounded-[28px] bg-slate-100" /></div></PageFrame>;
  if (!data) return <PageFrame><div className="container py-16 text-center"><CircleAlert className="mx-auto size-9 text-orange-600" /><h1 className="mt-4 text-2xl font-semibold">This business profile is unavailable.</h1><p className="mt-2 text-sm text-slate-500">It may be pending approval or no longer published.</p><Link href="/search"><Button className="mt-6 rounded-xl">Explore businesses</Button></Link></div></PageFrame>;

  const business = data.business as ProfileBusiness;
  const category = data.category.name;
  const city = data.city.name;
  const verified = data.verification?.status === "verified" || business.isVerified === true;
  const coordinates = parseBusinessCoordinates(business.latitude, business.longitude);
  const distanceLabel = formatDistanceFromUser(userCoordinates, coordinates);
  const images = ((data.images ?? []) as ProfileImage[]);
  const heroImage = images.find(image => image.imageType === "cover") ?? images[0];
  const galleryImages = heroImage ? images.filter(image => image.id !== heroImage.id).slice(0, 2) : [];
  const weeklyHours = ((data.hours ?? []) as BusinessHoursDay[]);
  const specialHours = ((data.specialHours ?? []) as BusinessSpecialHours[]);
  const hoursStatus = getBusinessHoursStatus(weeklyHours, specialHours, business.timezone);
  const aboutVersion = ((data.approvedAiContent ?? []) as Array<{ contentType: string; content: string; structured?: unknown }>).find(item => item.contentType === "about_business");
  const aboutText = aboutVersion?.content || business.approvedDescription || business.shortDescription || "";
  const faqs = extractFaqs(((data.approvedAiContent ?? []) as Array<{ contentType: string; content: string; structured?: unknown }>).find(item => item.contentType === "faq_generation"));
  const services = ((data.services ?? []) as Array<{ id: number; name: string; description?: string | null; price?: string | null; duration?: string | null }>);
  const facilities = ((data.facilities ?? []) as Array<{ id: number; name: string; details?: string | null }>);
  const offers = ((data.offers ?? []) as Array<{ id: number; title?: string | null; description?: string | null; terms?: string | null; endsAt?: Date | string | null }>);
  const reviews = ((data.reviews ?? []) as Array<{ id: number; rating: number; content?: string | null; authorName?: string | null; createdAt?: Date | string; businessResponse?: string | null }>);
  const canBook = hasBookableAppointment(appointmentAvailability.data);
  const track = (action: "click" | "call" | "whatsapp" | "directions" | "website" | "save" | "inquiry" | "share") => {
    void trpcUtilsInteraction(action, business.id);
  };
  const handleSave = () => {
    if (!auth.isAuthenticated) {
      startLogin();
      return;
    }
    track("save");
    saveMutation.mutate({ businessId: business.id });
  };
  const copyAddress = async () => {
    try { await navigator.clipboard.writeText(business.address); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  };
  const shareProfile = async () => {
    track("share");
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: business.name, text: `Find ${business.name} on Just Finds`, url });
    else { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  };
  const sectionItems = getBusinessDetailSections({
    hasOverview: Boolean(aboutText.trim()),
    hasServices: services.length > 0,
    hasFacilities: facilities.length > 0,
    hasHours: weeklyHours.length > 0 || specialHours.length > 0,
    hasLocation: Boolean(business.address.trim()),
    hasPhotos: images.length > 0,
    hasWebsite: Boolean(business.website),
    hasOffers: offers.length > 0,
    hasFaqs: faqs.length > 0,
    hasReviews: reviews.length > 0,
    hasAppointments: canBook,
  });

  return <PageFrame className="bg-white">
    <PageMeta business={{ name: business.name, category, address: business.address, phone: business.phone, website: business.website, latitude: business.latitude ?? undefined, longitude: business.longitude ?? undefined }} />
    <section className="container py-5"><Link href="/search" className="inline-flex items-center gap-1.5 rounded-full border border-[#dce4f1] bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:border-[#b8c8f3] hover:text-[#2559d6]"><ChevronLeft className="size-4" />Back to search</Link></section>
    <section className="container pb-8"><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"><div className="min-w-0"><div className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-[0_12px_30px_rgba(15,23,42,.05)]"><div className="grid min-h-[260px] grid-cols-[minmax(0,1.65fr)_minmax(0,.85fr)] gap-1 bg-slate-100 sm:min-h-[390px]">{heroImage ? <button type="button" onClick={() => setSelectedImage(heroImage)} className={`block min-h-[260px] overflow-hidden text-left sm:min-h-[390px] ${galleryImages.length === 0 ? "col-span-2" : ""}`}><SafeImage src={heroImage.url} alt={heroImage.alt || `${business.name} cover`} className="h-full w-full object-cover transition duration-200 hover:scale-[1.01]" /></button> : <div className="col-span-2 grid min-h-[260px] place-items-center bg-slate-50 p-8 text-center sm:min-h-[390px]"><div><ImageIcon className="mx-auto size-7 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">No owner-provided photos yet</p><p className="mt-1 text-xs leading-5 text-slate-400">This listing shows photos only after the business publishes them.</p></div></div>}{galleryImages.length > 0 && <div className="grid grid-rows-2 gap-1">{galleryImages.map((image, index) => <button key={image.id} type="button" onClick={() => setSelectedImage(image)} className="relative min-h-0 overflow-hidden text-left"><SafeImage src={image.url} alt={image.alt || `${business.name} photo ${index + 2}`} className="h-full w-full object-cover transition duration-200 hover:scale-[1.02]" />{index === 1 && images.length > 3 && <span className="absolute inset-0 grid place-items-center bg-[#0F172A]/55 text-sm font-bold text-white">+{images.length - 3} photos</span>}</button>)}</div>}</div><div className="p-5 sm:p-7"><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#2563EB]">{category}</span>{verified && <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#16803A]"><BadgeCheck className="size-3.5" />Owner verified</span>}{hoursStatus.state !== "unknown" && <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${hoursStatus.state === "open" ? "bg-emerald-50 text-[#16803A]" : "bg-slate-100 text-slate-600"}`}><Clock3 className="size-3.5" />{hoursStatus.label}</span>}</div><h1 className="mt-3 text-3xl font-bold tracking-[-.05em] text-[#0F172A] sm:text-4xl">{business.name}</h1><div className="mt-2 flex flex-wrap items-center gap-3"><p className="flex items-start gap-2 text-sm leading-6 text-slate-600"><MapPin className="mt-0.5 size-4 shrink-0 text-[#F97316]" />{business.address}</p>{distanceLabel && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700"><Compass className="size-3.5 text-[#2563EB]" />{distanceLabel} away</span>}</div>{aboutText && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{business.shortDescription || aboutText}</p>}<div className="mt-5 flex flex-wrap gap-2"><button onClick={shareProfile} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"><Share2 className="size-3.5" />Share</button><button onClick={handleSave} disabled={saveMutation.isPending} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"><Bookmark className={`size-3.5 ${savedQuery.data ? "fill-current text-[#2563EB]" : ""}`} />{saveMutation.isPending ? "Saving…" : savedQuery.data ? "Saved" : "Save"}</button><button onClick={copyAddress} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50">{copied ? <Check className="size-3.5 text-[#16A34A]" /> : <Copy className="size-3.5" />}{copied ? "Copied" : "Copy address"}</button></div></div></div></div><aside id="appointments" className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,.05)] lg:sticky lg:top-24"><h2 className="text-lg font-bold tracking-[-.03em] text-[#0F172A]">Contact & booking</h2><p className="mt-1 text-xs leading-5 text-slate-500">Choose an available way to reach this business.</p><div className="mt-5 grid gap-2">{canBook && <AppointmentDialog businessId={business.id} slots={appointmentAvailability.data?.slots ?? []} timeZone={appointmentAvailability.data?.timeZone} triggerClassName="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-xs font-semibold text-white hover:bg-[#1D4ED8]" />}{business.phone && <Action href={`tel:${business.phone}`} icon={Phone} label="Call now" primary={!canBook} onClick={() => track("call")} />}{business.whatsapp && <Action href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`} icon={MessageCircle} label="WhatsApp" external onClick={() => track("whatsapp")} />}{business.website && <Action href={business.website} icon={ExternalLink} label="Visit website" external onClick={() => track("website")} />}{business.address && <Action href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`} icon={MapPin} label="Get directions" external onClick={() => track("directions")} />}<LeadDialog businessId={business.id} onOpen={() => track("inquiry")} /></div><div className="mt-5 border-t border-[#E2E8F0] pt-4"><p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><MapPin className="mt-0.5 size-3.5 shrink-0 text-[#2563EB]" />{city}{business.timezone ? ` · Hours shown in ${business.timezone}` : ""}</p></div></aside></div></section>
    {sectionItems.length > 0 && <nav aria-label="Business profile sections" className="sticky top-0 z-20 border-y border-[#E2E8F0] bg-white/95 shadow-[0_1px_0_rgba(15,23,42,.03)] backdrop-blur"><div className="container flex min-h-12 gap-5 overflow-x-auto">{sectionItems.map(section => <a key={section.id} href={`#${section.id}`} onClick={() => setActiveSection(section.id)} className={`inline-flex min-h-12 shrink-0 items-center border-b-2 px-1 text-sm font-semibold transition-colors ${activeSection === section.id ? "border-[#2563EB] text-[#1748B8]" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-[#0F172A]"}`}>{section.label}</a>)}</div></nav>}
    <section className="container grid gap-8 py-10 pb-24 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="min-w-0 space-y-10">
      {images.length > 0 && <section id="photos" aria-label="Business photos" className="scroll-mt-24"><div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900"><span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-[#2563EB]"><ImageIcon className="size-4" /></span>Photos</h2><span className="text-xs text-slate-400">Owner-provided media · {images.length} {images.length === 1 ? "photo" : "photos"}</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{images.slice(0, 6).map((image, index) => <button key={image.id} type="button" onClick={() => setSelectedImage(image)} className={`${index === 0 ? "col-span-2 row-span-2" : ""} overflow-hidden rounded-2xl bg-slate-100 text-left`}><SafeImage src={image.url} alt={image.alt || `${business.name} photo ${index + 1}`} className="h-full min-h-32 w-full object-cover transition duration-200 hover:scale-[1.02]" /></button>)}</div><Dialog open={Boolean(selectedImage)} onOpenChange={open => { if (!open) setSelectedImage(null); }}><DialogContent className="max-w-4xl rounded-2xl bg-black/95 p-2"><DialogHeader className="sr-only"><DialogTitle>{business.name} photo gallery</DialogTitle><DialogDescription>Owner-provided photos for this business.</DialogDescription></DialogHeader>{selectedImage && <SafeImage src={selectedImage.url} alt={selectedImage.alt || `${business.name} selected photo`} className="max-h-[78vh] w-full object-contain" />}</DialogContent></Dialog></section>}
      {aboutText && <section id="overview" className="scroll-mt-24"><ContentSection title="Overview" icon={Sparkles}><p className="whitespace-pre-line">{aboutText}</p></ContentSection></section>}
      {services.length > 0 && <section id="services" className="scroll-mt-24"><ContentSection title="Services" icon={CalendarDays}><div className="grid gap-3 sm:grid-cols-2">{services.map(service => <div key={service.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-4"><p className="font-semibold text-slate-800">{service.name}</p>{service.description && <p className="mt-1 text-sm leading-6 text-slate-500">{service.description}</p>}{(service.price || service.duration) && <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">{service.price && <span className="rounded-lg bg-slate-100 px-2.5 py-1">{service.price}</span>}{service.duration && <span className="rounded-lg bg-slate-100 px-2.5 py-1">{service.duration}</span>}</div>}</div>)}</div></ContentSection></section>}
      {((data.facilities ?? []) as Array<{ id: number; name: string; details?: string | null }>).length > 0 && <ContentSection title="Facilities & amenities" icon={Check}><div className="grid gap-2 sm:grid-cols-2">{((data.facilities ?? []) as Array<{ id: number; name: string; details?: string | null }>).map(facility => <div key={facility.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-sm font-semibold text-slate-800">{facility.name}</p>{facility.details && <p className="mt-1 text-xs leading-5 text-slate-500">{facility.details}</p>}</div>)}</div></ContentSection>}
      {(weeklyHours.length > 0 || specialHours.length > 0) && <section id="hours" className="scroll-mt-24"><ContentSection title="Hours" icon={Clock3}><p className="mb-3 text-xs font-medium text-slate-400">Hours provided by business</p><div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center justify-between"><span className={`inline-flex items-center gap-2 text-sm font-semibold ${hoursStatus.state === "open" ? "text-emerald-700" : hoursStatus.state === "closed" ? "text-slate-700" : "text-orange-700"}`}><span className="size-2 rounded-full bg-current" />{hoursStatus.label}</span>{business.timezone && <span className="text-[11px] text-slate-400">{business.timezone}</span>}</div>{weeklyHours.length > 0 && <div className="divide-y divide-slate-100">{weeklyHours.map(day => <div key={day.dayOfWeek} className="flex justify-between gap-4 py-2.5 text-sm"><span className="font-medium text-slate-700">{getBusinessHoursDayName(day.dayOfWeek)}</span><span className="text-right text-slate-500">{formatBusinessHours(day)}</span></div>)}</div>}{specialHours.length > 0 && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><p className="font-semibold">Special hours</p>{specialHours.map(special => <p key={special.date} className="mt-1">{special.date}{special.label ? ` · ${special.label}` : ""}: {special.isClosed ? "Closed" : formatIntervals(special.intervals)}</p>)}</div>}</div></ContentSection></section>}
      {business.address && <section id="location" className="scroll-mt-24"><ContentSection title="Location" icon={MapPin}><BusinessMap address={business.address} latitude={coordinates?.lat} longitude={coordinates?.lng} /></ContentSection></section>}
      {business.website && <section id="website" className="scroll-mt-24"><ContentSection title="Website" icon={ExternalLink}><a href={business.website} target="_blank" rel="noreferrer" onClick={() => track("website")} className="flex min-h-12 items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#2563EB] hover:border-blue-200 hover:bg-blue-50"><span className="truncate">{business.website}</span><ExternalLink className="ml-3 size-4 shrink-0" /></a></ContentSection></section>}
      {((data.offers ?? []) as Array<{ id: number; title?: string | null; description?: string | null; terms?: string | null; endsAt?: Date | string | null }>).length > 0 && <section id="offers" className="scroll-mt-24"><ContentSection title="Current offers" icon={Tag}><div className="grid gap-3">{((data.offers ?? []) as Array<{ id: number; title?: string | null; description?: string | null; terms?: string | null; endsAt?: Date | string | null }>).map(offer => <div key={offer.id} className="rounded-2xl border border-[#ead7b1] bg-[#fffaf0] p-4"><p className="font-semibold text-slate-800">{offer.title || "Special offer"}</p>{offer.description && <p className="mt-1 text-sm leading-6 text-slate-600">{offer.description}</p>}{offer.endsAt && <p className="mt-3 text-xs font-semibold text-[#9c6b1e]">Valid until {new Date(offer.endsAt).toLocaleDateString()}</p>}{offer.terms && <p className="mt-2 text-xs text-slate-500">Terms: {offer.terms}</p>}</div>)}</div></ContentSection></section>}
      {faqs.length > 0 && <ContentSection title="Frequently asked questions" icon={Bot}><div className="space-y-2">{faqs.map((faq, index) => <details key={`${faq.question}-${index}`} className="group rounded-2xl border border-slate-200 bg-white p-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-800">{faq.question}<ChevronDown className="size-4 transition group-open:rotate-180" /></summary><p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p></details>)}</div></ContentSection>}
      {reviews.length > 0 && <section id="reviews" className="scroll-mt-24"><ContentSection title="Just Finds reviews" icon={Star}>{reviews.map(review => <article key={review.id} className="mb-3 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-1 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`size-4 ${index < review.rating ? "fill-current" : "text-slate-200"}`} />)}</div><span className="text-xs text-slate-400">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}</span></div>{review.content && <p className="mt-3 text-sm leading-6 text-slate-600">{review.content}</p>}{review.authorName && <p className="mt-3 text-xs font-semibold text-slate-500">{review.authorName}</p>}{review.businessResponse && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><strong>Business response:</strong> {review.businessResponse}</div>}<ReportReviewDialog reviewId={review.id} /></article>)}<ReviewDialog businessId={business.id} /></ContentSection></section>}
    </div><aside className="space-y-5"><section className="rounded-2xl border border-[#E2E8F0] bg-white p-5"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600"><FileCheck2 className="size-4" /></span><div><h2 className="text-sm font-bold text-[#0F172A]">Listing information</h2><p className="text-xs text-slate-500">Business-supplied profile details</p></div></div><div className="mt-4 space-y-2 text-xs leading-5 text-slate-600">{verified && <p className="flex items-center gap-2 font-semibold text-[#16803A]"><BadgeCheck className="size-4" />Owner verification is complete.</p>}{(weeklyHours.length > 0 || specialHours.length > 0) && <p className="flex items-center gap-2"><Clock3 className="size-4 text-[#2563EB]" />Hours are provided by this business.</p>}<p>Photos and descriptions appear only when this listing has published them.</p></div></section>{business.voiceIntroductionUrl && <VoicePanel url={business.voiceIntroductionUrl} />}{!data.isFixture && <BusinessAssistant businessId={business.id} name={business.name} />}</aside></section>
    {(business.phone || business.whatsapp || business.address || canBook) && <div className="fixed inset-x-3 bottom-3 z-30 flex gap-2 overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white/95 p-2 shadow-xl backdrop-blur md:hidden">{business.phone && <Action href={`tel:${business.phone}`} icon={Phone} label="Call" onClick={() => track("call")} compact primary={!canBook} />}{canBook && <AppointmentDialog businessId={business.id} slots={appointmentAvailability.data?.slots ?? []} timeZone={appointmentAvailability.data?.timeZone} compact />}{business.whatsapp && <Action href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`} icon={MessageCircle} label="WhatsApp" external onClick={() => track("whatsapp")} compact />}{business.address && <Action href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`} icon={MapPin} label="Directions" external onClick={() => track("directions")} compact />}</div>}
  </PageFrame>;
}

function trpcUtilsInteraction(action: "click" | "call" | "whatsapp" | "directions" | "website" | "save" | "inquiry" | "share", businessId: number) {
  void fetch("/api/trpc/discovery.interaction", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ json: { action, businessId } }) }).catch(() => undefined);
}

function extractFaqs(version?: { content: string; structured?: unknown }): ProfileFaq[] {
  if (!version) return [];
  const candidate = version.structured ?? safeJson(version.content);
  if (!Array.isArray(candidate)) return [];
  return candidate.flatMap(item => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    return typeof record.question === "string" && typeof record.answer === "string" ? [{ question: record.question, answer: record.answer }] : [];
  });
}

function safeJson(value: string): unknown { try { return JSON.parse(value); } catch { return null; } }
function formatIntervals(value: unknown): string { if (!Array.isArray(value)) return "Hours unavailable"; return value.map(item => typeof item === "object" && item && typeof (item as Record<string, unknown>).opensAt === "string" && typeof (item as Record<string, unknown>).closesAt === "string" ? `${(item as Record<string, string>).opensAt}–${(item as Record<string, string>).closesAt}` : null).filter(Boolean).join(", ") || "Hours unavailable"; }

function SafeImage({ src, alt, className }: { src: string; alt: string; className?: string }) { const [failed, setFailed] = useState(false); if (failed) return <span className={`grid place-items-center bg-slate-100 text-xs text-slate-400 ${className || "min-h-32"}`}>Image unavailable</span>; return <img src={src} alt={alt} onError={() => setFailed(true)} className={className} />; }

function ContentSection({ title, icon: Icon, children }: { title: string; icon: ElementType; children: ReactNode }) { const sectionId = title === "Facilities & amenities" ? "facilities" : title === "Frequently asked questions" ? "details" : title === "Appointments" ? "appointments" : undefined; return <section id={sectionId}><h2 className="flex items-center gap-2 text-xl font-semibold tracking-[-.035em] text-slate-900"><span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-[#1f51c8]"><Icon className="size-4" /></span>{title}</h2><div className="mt-4 text-sm leading-7 text-slate-600">{children}</div></section>; }
function EmptyState({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center"><p className="text-sm font-semibold text-slate-800">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{body}</p></div>; }
function Action({ href, icon: Icon, label, external = false, onClick, compact = false, primary = false }: { href?: string; icon: ElementType; label: string; external?: boolean; onClick?: () => void; compact?: boolean; primary?: boolean }) { const base = compact ? `flex h-10 min-w-[68px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[10px] font-semibold ${primary ? "bg-[#2563EB] text-white" : "text-slate-700"}` : `flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition-colors ${primary ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]" : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-[#1f51c8]"}`; return href ? <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} onClick={onClick} className={base}><Icon className="size-4" />{label}</a> : <span className={`${base} cursor-not-allowed opacity-45`}><Icon className="size-4" />{label}</span>; }

function AppointmentDialog({ businessId, slots, timeZone, compact = false, triggerClassName }: { businessId: number; slots: Array<{ startAt: Date | string; endAt: Date | string }>; timeZone?: string | null; compact?: boolean; triggerClassName?: string }) {
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const request = trpc.business.requestAppointment.useMutation({ onSuccess: result => setCustomerToken(result.customerAccessToken) });
  const buttonClass = triggerClassName || (compact ? "flex h-10 min-w-[68px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl bg-[#2563EB] px-2 text-[10px] font-semibold text-white" : "flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-xs font-semibold text-white hover:bg-[#1D4ED8]");
  return <Dialog><DialogTrigger asChild><button type="button" className={buttonClass}><CalendarDays className="size-4" />{compact ? "Book" : "Book appointment"}</button></DialogTrigger><DialogContent className="max-w-lg rounded-2xl"><DialogHeader><DialogTitle>Request an appointment</DialogTitle><DialogDescription>Choose one of the business’s currently available appointment times{timeZone ? ` (${timeZone})` : ""}.</DialogDescription></DialogHeader>{customerToken ? <p className="rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">Your request was sent. <a className="font-semibold underline" href={`/appointment/${customerToken}`}>View or manage your appointment</a>.</p> : <div className="grid gap-3"><label className="grid gap-1.5 text-xs font-semibold text-slate-700">Available time<select value={slot} onChange={event => setSlot(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800"><option value="">Select an available time</option>{slots.map(item => { const start = new Date(item.startAt); return Number.isNaN(start.getTime()) ? null : <option key={start.toISOString()} value={start.toISOString()}>{start.toLocaleString()}</option>; })}</select></label><input value={name} onChange={event => setName(event.target.value)} placeholder="Your name *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /><input value={phone} onChange={event => setPhone(event.target.value)} placeholder="Phone number (optional)" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /><input value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address (optional)" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /><textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="Reason for appointment (optional)" className="min-h-20 rounded-xl border border-slate-200 p-3 text-sm" /><label className="flex items-start gap-2.5 text-xs leading-5 text-slate-600"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-0.5" /><span>I agree to share these details with this business to arrange this appointment.</span></label><Button disabled={!slot || !name.trim() || !consent || request.isPending} onClick={() => request.mutate({ businessId, startsAt: slot, name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined, message: message.trim() || undefined, consentGiven: true })} className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8]">{request.isPending ? "Sending request…" : "Request appointment"}</Button>{request.error && <p className="text-xs text-rose-600">{request.error.message}</p>}</div>}</DialogContent></Dialog>;
}

function LeadDialog({ businessId, onOpen }: { businessId: number; onOpen: () => void }) { const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [consent, setConsent] = useState(false); const lead = trpc.ai.createLead.useMutation(); return <Dialog><DialogTrigger asChild><button onClick={onOpen} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-[#1f51c8]"><Send className="size-4" />Enquire</button></DialogTrigger><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Send an enquiry</DialogTitle><DialogDescription>Your message and contact details are stored privately for this business owner.</DialogDescription></DialogHeader><div className="grid gap-3"><input value={name} onChange={event => setName(event.target.value)} placeholder="Your name *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /><input value={phone} onChange={event => setPhone(event.target.value)} placeholder="Phone number (optional)" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /><input value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address (optional)" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /><textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="How can this business help?" className="min-h-20 rounded-xl border border-slate-200 p-3 text-sm" /><label className="flex items-start gap-2.5 text-xs text-slate-600"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-0.5 rounded border-slate-300 text-blue-600" /><span>I consent to sharing my contact details with this business so they can respond to my enquiry.</span></label><Button disabled={!name || !consent || lead.isPending} onClick={() => lead.mutate({ businessId, name, phone: phone || undefined, email: email || undefined, message, page: window.location.pathname, consentGiven: true })} className="rounded-xl">{lead.isSuccess ? "Enquiry sent" : lead.isPending ? "Sending…" : "Send enquiry"}</Button>{lead.error && <p className="text-xs text-rose-600">{lead.error.message}</p>}</div></DialogContent></Dialog>; }

function ReviewDialog({ businessId }: { businessId: number }) {
  const auth = useAuth();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const review = trpc.discovery.submitReview.useMutation();
  const submit = () => {
    if (!auth.isAuthenticated) {
      startLogin();
      return;
    }
    review.mutate({ businessId, rating, content: content.trim() || undefined });
  };
  return <Dialog><DialogTrigger asChild><Button variant="outline" className="mt-4 rounded-xl bg-white text-xs"><Star className="mr-2 size-4" />Write a review</Button></DialogTrigger><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Share your experience</DialogTitle><DialogDescription>Reviews are published only after Just Finds moderation. Please share firsthand information.</DialogDescription></DialogHeader><div className="grid gap-4"><div><p className="text-xs font-semibold text-slate-700">Rating</p><div className="mt-2 flex gap-1" aria-label="Choose a rating">{Array.from({ length: 5 }).map((_, index) => <button key={index} type="button" aria-label={`${index + 1} star${index === 0 ? "" : "s"}`} onClick={() => setRating(index + 1)} className="rounded-md p-1 text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><Star className={`size-6 ${index < rating ? "fill-current" : "text-slate-200"}`} /></button>)}</div></div><textarea value={content} onChange={event => setContent(event.target.value)} placeholder="What should another customer know? (optional)" className="min-h-28 rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" maxLength={2000} /><Button onClick={submit} disabled={review.isPending || review.isSuccess} className="rounded-xl">{review.isPending ? "Submitting…" : review.isSuccess ? "Submitted for review" : "Submit review"}</Button>{review.isSuccess && <p className="text-xs text-emerald-700">Thanks. Your review is pending moderation and is not public yet.</p>}{review.error && <p className="text-xs text-rose-600">{review.error.message}</p>}</div></DialogContent></Dialog>;
}

function ReportReviewDialog({ reviewId }: { reviewId: number }) {
  const auth = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const report = trpc.discovery.reportReview.useMutation();
  const submit = () => {
    if (!auth.isAuthenticated) {
      startLogin();
      return;
    }
    report.mutate({ reviewId, reason, details: details.trim() || undefined });
  };
  return <Dialog><DialogTrigger asChild><button type="button" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600"><Flag className="size-3.5" />Report review</button></DialogTrigger><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Report this review</DialogTitle><DialogDescription>Tell Just Finds what needs attention. Reports are reviewed by administrators.</DialogDescription></DialogHeader><div className="grid gap-3"><input value={reason} onChange={event => setReason(event.target.value)} placeholder="Reason, for example: inaccurate or abusive" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" maxLength={240} /><textarea value={details} onChange={event => setDetails(event.target.value)} placeholder="Additional details (optional)" className="min-h-24 rounded-xl border border-slate-200 p-3 text-sm" maxLength={1000} /><Button onClick={submit} disabled={!reason.trim() || report.isPending || report.isSuccess} className="rounded-xl">{report.isPending ? "Sending…" : report.isSuccess ? "Report sent" : "Send report"}</Button>{report.error && <p className="text-xs text-rose-600">{report.error.message}</p>}</div></DialogContent></Dialog>;
}

function BusinessAssistant({ businessId, name }: { businessId: number; name: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [sessionId] = useState(() => {
    const key = `just-finds-business-assistant-${businessId}`;
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const next = window.crypto?.randomUUID?.() ?? `business-${businessId}-${Date.now()}`;
    window.sessionStorage.setItem(key, next);
    return next;
  });
  const chat = trpc.ai.businessChat.useMutation({
    onSuccess: response => {
      setNotice(null);
      setMessages(previous => [...previous, { role: "assistant", content: response.answer }]);
    },
    onError: () => {
      setNotice("The approved business information could not be reached just now. Please try again.");
      setMessages(previous => [...previous, { role: "assistant", content: "I don't have that information for this business." }]);
    },
  });
  const send = (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || chat.isPending) return;
    setNotice(null);
    setMessages(previous => [...previous, { role: "user", content: trimmedQuestion }]);
    chat.mutate({ businessId, question: trimmedQuestion, sessionId });
  };
  return <Dialog><DialogTrigger asChild><button className="w-full overflow-hidden rounded-[22px] bg-[#102a6b] p-5 text-left text-white shadow-[0_12px_26px_rgba(16,42,107,.18)]"><span className="grid size-9 place-items-center rounded-xl bg-white/10"><Bot className="size-5" /></span><p className="mt-4 font-semibold">Ask about this business</p><p className="mt-1 text-xs leading-5 text-blue-100/75">Answers are limited to {name}’s approved information.</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-100">Open assistant <ChevronLeft className="size-3.5 rotate-180" /></span></button></DialogTrigger><DialogContent className="max-w-xl rounded-2xl"><DialogHeader><DialogTitle>Business assistant</DialogTitle><DialogDescription>Only approved information from this business is used.</DialogDescription></DialogHeader>{notice && <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">{notice}</p>}<AIChatBox messages={messages} onSendMessage={send} isLoading={chat.isPending} height="390px" placeholder="Ask about services, hours, or contact details" suggestedPrompts={["What services are available?", "What are the opening hours?", "How do I get there?"]} /></DialogContent></Dialog>;
}

function TrustPanel({ score, explanation, verified, certificate, businessName, category, city, slug }: { score: number; explanation: unknown[]; verified: boolean; certificate?: { certificateId?: string; verificationUrl?: string | null } | null; businessName: string; category: string; city: string; slug: string }) { return <div className="rounded-[22px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Just Finds Reputation Score</p><p className="mt-2 text-3xl font-semibold tracking-[-.05em] text-[#102a6b]">{score > 0 ? score : "New"}</p></div><span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldCheck className="size-5" /></span></div><p className="mt-2 text-xs leading-5 text-slate-500">{score > 0 ? "A native Just Finds signal, not a third-party rating." : "New on Just Finds — more history will appear as the profile earns it."}</p>{verified && <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700"><BadgeCheck className="size-4" />Verified profile status</p>}{explanation.length > 0 && <ul className="mt-3 space-y-1 text-xs text-slate-500">{explanation.slice(0, 3).map((item, index) => <li key={index}>• {typeof item === "string" ? item : JSON.stringify(item)}</li>)}</ul>}<div className="mt-4"><CertificatePanel name={businessName} category={category} city={city} slug={slug} verified={verified} verificationUrl={certificate?.verificationUrl} certificateId={certificate?.certificateId} /></div></div>; }

function CertificatePanel({ name, category, city, slug, verified, verificationUrl, certificateId }: { name: string; category: string; city: string; slug: string; verified: boolean; verificationUrl?: string | null; certificateId?: string }) { const certificateUrl = verificationUrl || (typeof window === "undefined" ? "https://justfinds.local" : `${window.location.origin}/verify/${slug}`); return <Dialog><DialogTrigger asChild><button className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-[#fcfbf8] p-3 text-left hover:border-[#d9bb87]"><span className="flex items-center gap-2 text-xs font-semibold text-slate-700"><FileCheck2 className="size-4 text-[#9c6b1e]" />Just Finds Business Certificate</span><Printer className="size-4 text-slate-400" /></button></DialogTrigger><DialogContent className="max-w-2xl rounded-2xl"><DialogHeader><DialogTitle>Just Finds Business Certificate</DialogTitle><DialogDescription>This confirms Just Finds listing status only.</DialogDescription></DialogHeader><div id="business-certificate" className="border-[10px] border-[#ede0c5] bg-[#fffcf5] p-6 text-center sm:p-10"><p className="text-xs font-semibold uppercase tracking-[.24em] text-[#9c6b1e]">Just Finds</p><h2 className="mt-3 font-serif text-3xl text-slate-900">Business Certificate</h2><div className="mx-auto my-5 h-px max-w-xs bg-[#dbc59a]" /><p className="text-sm text-slate-500">This document recognises the listing profile of</p><p className="mt-2 text-2xl font-semibold text-slate-900">{name}</p><p className="mt-3 text-sm text-slate-600">{category} · {city}</p><p className="mt-5 text-xs leading-5 text-slate-500">Verification status: {verified ? "Verified Just Finds listing" : "Listed on Just Finds"}</p><div className="mx-auto mt-6 w-fit rounded-xl bg-white p-2"><QRCodeSVG value={certificateUrl} size={108} bgColor="#ffffff" fgColor="#102a6b" /></div><p className="mt-3 text-[10px] text-slate-400">{certificateId ? `Certificate ID: ${certificateId}` : `Certificate ID: JF-${slug.toUpperCase().slice(0, 12)}`} · Verify via QR code</p></div><Button onClick={() => window.print()} variant="outline" className="rounded-xl"><Printer className="mr-2 size-4" />Print or save as PDF</Button></DialogContent></Dialog>; }

function VoicePanel({ url }: { url: string }) { return <div className="rounded-[22px] border border-blue-100 bg-blue-50/60 p-5"><div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Headphones className="size-4 text-[#1f51c8]" />Listen to this business</div><p className="mt-1 text-xs leading-5 text-slate-500">Approved voice introduction generated from this profile's own information.</p><audio className="mt-4 w-full" controls preload="metadata" src={url}>Your browser does not support audio playback.</audio><p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400"><Play className="size-3" />Playback is stored audio; no AI call runs during page view.</p></div>; }

function BusinessMap({ address, latitude, longitude }: { address: string; latitude?: number; longitude?: number }) { const hasCoordinates = latitude !== undefined && longitude !== undefined; const [mapState, setMapState] = useState<"loading" | "ready" | "fallback">(hasCoordinates ? "loading" : "fallback"); const position = hasCoordinates ? { lat: latitude, lng: longitude } : null; return <div className="overflow-hidden rounded-[22px] border border-[#E2E8F0] bg-white p-3"><div className="relative h-[240px] overflow-hidden rounded-[15px] bg-[linear-gradient(135deg,#e8edf4_0%,#e8edf4_46%,#dfeaf6_46%,#dfeaf6_100%)]"><MapPin className="absolute left-[45%] top-[40%] z-[1] size-10 fill-[#F97316] text-[#F97316] drop-shadow-md" />{position && mapState !== "fallback" && <MapView className="absolute inset-0 z-10 h-full" initialCenter={position} initialZoom={15} onLoadError={() => setMapState("fallback")} onMapReady={map => { try { new google.maps.marker.AdvancedMarkerElement({ map, position, title: address }); setMapState("ready"); } catch { setMapState("fallback"); } }} />}{mapState !== "ready" && <div aria-live="polite" className="absolute inset-x-3 bottom-3 z-20 rounded-xl bg-white/95 p-3 shadow-sm backdrop-blur"><p className="text-xs font-semibold text-[#0F172A]">{mapState === "loading" ? "Loading business location" : "Map preview is unavailable"}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{mapState === "fallback" ? "Use directions to navigate from the business address." : address}</p></div>}</div><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer" className="mt-3 flex min-h-11 items-center justify-between rounded-xl bg-slate-50 px-3.5 text-sm font-semibold text-slate-700">Open directions in Maps <ExternalLink className="size-4" /></a></div>; }
function BusinessLocationUnavailable({ address }: { address: string }) { return <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white p-3"><div className="relative flex h-[240px] items-end overflow-hidden rounded-[15px] bg-[linear-gradient(135deg,#ece5dc,#d9e6f5)] p-4"><MapPin className="absolute left-[45%] top-[34%] size-10 fill-[#d76546] text-[#d76546] drop-shadow-md" /><div className="relative rounded-xl bg-white/90 p-3 shadow-sm backdrop-blur"><p className="text-xs font-semibold text-slate-800">Map location is being verified</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Just Finds will show a map when this business provides verified coordinates.</p></div></div><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-700">Open directions in Maps <ExternalLink className="size-4" /></a></div>; }
