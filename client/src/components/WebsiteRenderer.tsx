import React, { useState, type CSSProperties } from "react";
import { ArrowUpRight, CalendarDays, ChevronRight, Clock3, Globe2, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";

type WebsiteHour = { id: number; dayOfWeek: number; opensAt?: string | null; closesAt?: string | null; intervals?: unknown; isClosed?: boolean; isTwentyFourHours?: boolean };
type WebsiteSection = { id: number; sectionType: string; enabled?: boolean; config?: unknown };
type WebsiteService = { id: number; name: string; description?: string | null };
type WebsiteImage = { id: number; url: string; alt?: string | null; imageType: string };

type WebsiteData = {
  page: { id: number; slug: string };
  business: { id: number; slug?: string; name: string; phone?: string | null; whatsapp?: string | null; website?: string | null; address: string; shortDescription?: string | null; aboutDescription?: string | null };
  sections: WebsiteSection[];
  services: WebsiteService[];
  images: WebsiteImage[];
  reviews: Array<{ id: number; content: string | null }>;
  hours?: WebsiteHour[];
  category?: string | null;
  categorySlug?: string | null;
  city?: string | null;
  citySlug?: string | null;
  designConfig?: unknown;
};

type TrackingEvent = "page_view" | "cta_click" | "lead_start" | "lead_submit" | "call_click" | "whatsapp_click";

type SiteDesign = {
  theme: "modern" | "editorial" | "minimal";
  typography: "clean" | "serif" | "compact";
  buttonStyle: "rounded" | "square" | "pill";
  cardStyle: "soft" | "outlined" | "flat";
  radius: "sm" | "lg" | "xl";
  spacing: "compact" | "comfortable" | "airy";
  sectionWidth: "contained" | "wide" | "full";
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
};

const defaultDesign: SiteDesign = {
  theme: "modern", typography: "clean", buttonStyle: "rounded", cardStyle: "soft", radius: "lg", spacing: "comfortable", sectionWidth: "wide",
  primary: "#2456c8", secondary: "#173d9c", background: "#f8fafc", surface: "#ffffff", text: "#0f172a", muted: "#64748b", accent: "#f59e0b",
};

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const serviceSectionTypes = new Set(["services", "menu", "rooms", "doctors", "facilities", "offers"]);

function isHex(value: unknown): value is string { return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value); }

function resolveDesign(config: unknown): SiteDesign {
  const candidate = config && typeof config === "object" && !Array.isArray(config) ? config as Record<string, unknown> : {};
  const choice = <T extends string>(key: keyof SiteDesign, values: readonly T[], fallback: T) => values.includes(candidate[key] as T) ? candidate[key] as T : fallback;
  return {
    theme: choice("theme", ["modern", "editorial", "minimal"], defaultDesign.theme),
    typography: choice("typography", ["clean", "serif", "compact"], defaultDesign.typography),
    buttonStyle: choice("buttonStyle", ["rounded", "square", "pill"], defaultDesign.buttonStyle),
    cardStyle: choice("cardStyle", ["soft", "outlined", "flat"], defaultDesign.cardStyle),
    radius: choice("radius", ["sm", "lg", "xl"], defaultDesign.radius),
    spacing: choice("spacing", ["compact", "comfortable", "airy"], defaultDesign.spacing),
    sectionWidth: choice("sectionWidth", ["contained", "wide", "full"], defaultDesign.sectionWidth),
    primary: isHex(candidate.primary) ? candidate.primary : defaultDesign.primary,
    secondary: isHex(candidate.secondary) ? candidate.secondary : defaultDesign.secondary,
    background: isHex(candidate.background) ? candidate.background : defaultDesign.background,
    surface: isHex(candidate.surface) ? candidate.surface : defaultDesign.surface,
    text: isHex(candidate.text) ? candidate.text : defaultDesign.text,
    muted: isHex(candidate.muted) ? candidate.muted : defaultDesign.muted,
    accent: isHex(candidate.accent) ? candidate.accent : defaultDesign.accent,
  };
}

function sectionCopy(config: unknown) {
  if (!config || typeof config !== "object" || Array.isArray(config)) return {} as { label?: string; eyebrow?: string; headline?: string; body?: string; bullets?: string[]; featuredImageId?: number };
  const raw = config as Record<string, unknown>;
  return {
    label: typeof raw.label === "string" ? raw.label : undefined,
    eyebrow: typeof raw.eyebrow === "string" ? raw.eyebrow : undefined,
    headline: typeof raw.headline === "string" ? raw.headline : undefined,
    body: typeof raw.body === "string" ? raw.body : undefined,
    bullets: Array.isArray(raw.bullets) ? raw.bullets.filter((item): item is string => typeof item === "string") : undefined,
    featuredImageId: typeof raw.featuredImageId === "number" ? raw.featuredImageId : undefined,
  };
}

function formatHour(hour: WebsiteHour) {
  if (hour.isClosed) return "Closed";
  if (hour.isTwentyFourHours) return "Open 24 hours";
  if (hour.opensAt && hour.closesAt) return `${hour.opensAt}–${hour.closesAt}`;
  return "Hours provided by business";
}

export default function WebsiteRenderer({ data, preview = false, onTrack }: { data: WebsiteData; preview?: boolean; onTrack?: (eventType: TrackingEvent) => void }) {
  const [lead, setLead] = useState({ name: "", email: "", phone: "", message: "", consentGiven: false });
  const [appointment, setAppointment] = useState({ slot: "", name: "", email: "", phone: "", message: "", consentGiven: false });
  const [customerAppointmentToken, setCustomerAppointmentToken] = useState<string | null>(null);
  const createLead = trpc.ai.createLead.useMutation();
  const availability = trpc.business.publicAppointmentAvailability.useQuery({ businessId: data.business.id }, { enabled: !preview });
  const requestAppointment = trpc.business.requestAppointment.useMutation();
  const design = resolveDesign(data.designConfig);
  const visibleSections = data.sections.filter(section => section.enabled !== false);
  const hasSection = (...types: string[]) => visibleSections.some(section => types.includes(section.sectionType));
  const cover = data.images.find(image => image.imageType === "cover") ?? data.images[0];
  const about = data.business.aboutDescription || data.business.shortDescription;
  const showAbout = hasSection("about") && Boolean(about);
  const showServices = visibleSections.some(section => serviceSectionTypes.has(section.sectionType)) && data.services.length > 0;
  const showGallery = hasSection("gallery") && data.images.length > 0;
  const showHours = hasSection("hours") && Boolean(data.hours?.length);
  const allowContact = hasSection("contact", "map", "cta") && Boolean(data.business.address || data.business.phone || data.business.whatsapp || data.business.website);
  const bookable = Boolean(availability.data?.enabled && availability.data.slots.length);
  const listingHref = data.categorySlug && data.citySlug && data.business.slug ? `/${data.categorySlug}/${data.citySlug}/${data.business.slug}` : "/search";
  const siteStyle = {
    "--site-primary": design.primary,
    "--site-secondary": design.secondary,
    "--site-background": design.background,
    "--site-surface": design.surface,
    "--site-text": design.text,
    "--site-muted": design.muted,
    "--site-accent": design.accent,
  } as CSSProperties;
  const maxWidth = design.sectionWidth === "full" ? "max-w-none" : design.sectionWidth === "contained" ? "max-w-4xl" : "max-w-6xl";
  const radius = design.radius === "sm" ? "rounded-xl" : design.radius === "xl" ? "rounded-[28px]" : "rounded-2xl";
  const buttonRadius = design.buttonStyle === "square" ? "rounded-md" : design.buttonStyle === "pill" ? "rounded-full" : "rounded-xl";
  const surface = design.cardStyle === "flat" ? "border border-transparent" : design.cardStyle === "outlined" ? "border border-slate-200 shadow-none" : "border border-slate-200 shadow-sm";
  const verticalSpace = design.spacing === "compact" ? "space-y-6 py-7 sm:py-10" : design.spacing === "airy" ? "space-y-12 py-10 sm:py-16" : "space-y-8 py-8 sm:py-12";
  const bodyFont = design.typography === "serif" ? "font-serif" : design.typography === "compact" ? "tracking-[-0.02em]" : "";

  const submitLead = () => {
    if (preview || !lead.name.trim() || !lead.consentGiven) return;
    createLead.mutate({ businessId: data.business.id, name: lead.name.trim(), email: lead.email.trim() || undefined, phone: lead.phone.trim() || undefined, message: lead.message.trim() || undefined, page: data.page.slug, consentGiven: true }, {
      onSuccess: () => { onTrack?.("lead_submit"); setLead({ name: "", email: "", phone: "", message: "", consentGiven: false }); },
    });
  };

  const submitAppointment = () => {
    if (preview || !appointment.slot || !appointment.name.trim() || !appointment.consentGiven) return;
    requestAppointment.mutate({ businessId: data.business.id, startsAt: appointment.slot, name: appointment.name.trim(), phone: appointment.phone.trim() || undefined, email: appointment.email.trim() || undefined, message: appointment.message.trim() || undefined, consentGiven: true }, {
      onSuccess: result => { onTrack?.("lead_submit"); setCustomerAppointmentToken(result.customerAccessToken); setAppointment({ slot: "", name: "", email: "", phone: "", message: "", consentGiven: false }); },
    });
  };

  return <main style={siteStyle} className={`min-h-full bg-[var(--site-background)] text-[var(--site-text)] ${bodyFont}`}>
    <header className={`relative overflow-hidden border-b border-slate-200 ${design.theme === "editorial" ? "bg-[var(--site-secondary)] text-white" : "bg-[var(--site-surface)]"}`}>
      {cover && <img src={cover.url} alt="" className={`absolute inset-0 size-full object-cover ${design.theme === "editorial" ? "opacity-20" : "opacity-[0.08]"}`} />}
      <div className={`relative mx-auto ${maxWidth} px-5 sm:px-8`}>
        <nav className="flex min-h-16 items-center justify-between gap-4 border-b border-current/10" aria-label="Business website navigation">
          <a href={listingHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-75"><span className="grid size-7 place-items-center rounded-lg bg-[var(--site-primary)] text-xs text-white">JF</span>Just Finds</a>
          <a href={listingHref} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold opacity-80 transition-opacity hover:opacity-100">View listing <ArrowUpRight className="size-4" /></a>
        </nav>
        <div className={`grid gap-8 py-12 sm:py-16 ${cover && design.theme !== "minimal" ? "lg:grid-cols-[1fr_220px] lg:items-end" : ""}`}>
          <div className="max-w-3xl">
            {(data.category || data.city) && <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{[data.category, data.city].filter(Boolean).join(" · ")}</p>}
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">{data.business.name}</h1>
            {data.business.shortDescription && <p className="mt-5 max-w-2xl text-base leading-7 opacity-80 sm:text-lg">{data.business.shortDescription}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              {bookable && <a href="#booking" onClick={() => onTrack?.("cta_click")} className={`inline-flex min-h-11 items-center gap-2 ${buttonRadius} bg-[var(--site-primary)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90`}><CalendarDays className="size-4" />Book appointment</a>}
              {data.business.phone && <a href={`tel:${data.business.phone}`} onClick={() => onTrack?.("call_click")} className={`inline-flex min-h-11 items-center gap-2 ${buttonRadius} ${bookable ? "border border-current/25 px-4" : "bg-[var(--site-primary)] px-4 text-white"} text-sm font-semibold transition-opacity hover:opacity-80`}><Phone className="size-4" />Call business</a>}
              {!bookable && allowContact && <a href="#contact" onClick={() => onTrack?.("cta_click")} className={`inline-flex min-h-11 items-center gap-2 ${buttonRadius} border border-current/25 px-4 text-sm font-semibold transition-opacity hover:opacity-80`}>Contact <ChevronRight className="size-4" /></a>}
            </div>
          </div>
          {cover && design.theme !== "minimal" && <img src={cover.url} alt={cover.alt || `${data.business.name} owner-provided photo`} className="hidden aspect-[4/3] w-full rounded-2xl object-cover shadow-xl lg:block" />}
        </div>
      </div>
    </header>

    <div className={`mx-auto ${maxWidth} ${verticalSpace} px-5 sm:px-8`}>
      {showAbout && <section id="about" className={`${radius} ${surface} bg-[var(--site-surface)] p-6 sm:p-8`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]">About</p>
        <div className="mt-3 max-w-3xl"><h2 className="text-2xl font-semibold tracking-[-0.03em]">{data.business.name}</h2><p className="mt-3 leading-7 text-[var(--site-muted)]">{about}</p></div>
      </section>}

      {showServices && <section id="services" className={`${radius} ${surface} bg-[var(--site-surface)] p-6 sm:p-8`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]">Services</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Available from this business</h2></div>{allowContact && <a href="#contact" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--site-primary)]">Ask about a service <ChevronRight className="size-4" /></a>}</div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">{data.services.map(service => <article key={service.id} className="rounded-xl border border-slate-200 p-4"><h3 className="font-semibold">{service.name}</h3>{service.description && <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">{service.description}</p>}</article>)}</div>
      </section>}

      {showGallery && <section id="photos" className={`${radius} ${surface} bg-[var(--site-surface)] p-6 sm:p-8`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]">Owner-provided photos</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Inside and around {data.business.name}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.images.map(image => <img key={image.id} src={image.url} alt={image.alt || `${data.business.name} photo`} className="aspect-[4/3] w-full rounded-xl object-cover" />)}</div>
      </section>}

      {showHours && <section id="hours" className={`${radius} ${surface} bg-[var(--site-surface)] p-6 sm:p-8`}>
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-[var(--site-primary)]"><Clock3 className="size-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]">Hours</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Hours provided by business</h2></div></div>
        <dl className="mt-6 grid max-w-xl gap-x-8 gap-y-3 text-sm sm:grid-cols-2">{data.hours!.map(hour => <div key={hour.id} className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="font-medium">{dayNames[hour.dayOfWeek] ?? "Day"}</dt><dd className="text-right text-[var(--site-muted)]">{formatHour(hour)}</dd></div>)}</dl>
      </section>}

      {bookable && <section id="booking" className={`${radius} border border-blue-200 bg-blue-50 p-6 sm:p-8`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]">Appointment request</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Choose an available time</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--site-muted)]">The business will confirm or decline your request after reviewing it.</p>
        <form className="mt-6 grid gap-3 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); submitAppointment(); }}>
          <label className="sm:col-span-2 text-sm font-medium">Available time<select required className="field mt-1" value={appointment.slot} onChange={event => setAppointment({ ...appointment, slot: event.target.value })}><option value="">Select an available time</option>{availability.data!.slots.map(slot => <option key={slot.startAt.toISOString()} value={slot.startAt.toISOString()}>{new Date(slot.startAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short", timeZone: availability.data!.timeZone ?? undefined })}</option>)}</select></label>
          <input required className="field" placeholder="Your name" value={appointment.name} onChange={event => setAppointment({ ...appointment, name: event.target.value })} />
          <input className="field" type="tel" placeholder="Phone" value={appointment.phone} onChange={event => setAppointment({ ...appointment, phone: event.target.value })} />
          <input className="field" type="email" placeholder="Email (optional)" value={appointment.email} onChange={event => setAppointment({ ...appointment, email: event.target.value })} />
          <textarea className="field min-h-24 sm:col-span-2" placeholder="Reason for appointment (optional)" value={appointment.message} onChange={event => setAppointment({ ...appointment, message: event.target.value })} />
          <label className="sm:col-span-2 flex items-start gap-2 text-xs text-[var(--site-muted)]"><input type="checkbox" checked={appointment.consentGiven} onChange={event => setAppointment({ ...appointment, consentGiven: event.target.checked })} />I agree to share these details with this business to arrange this appointment.</label>
          <button disabled={!appointment.slot || !appointment.consentGiven || requestAppointment.isPending} className={`min-h-11 ${buttonRadius} bg-[var(--site-primary)] px-4 text-sm font-semibold text-white disabled:opacity-50`}>{requestAppointment.isPending ? "Sending request…" : "Request appointment"}</button>
          {requestAppointment.isSuccess && customerAppointmentToken && <p className="self-center text-sm text-emerald-700">Request sent. <a href={`/appointment/${customerAppointmentToken}`} className="font-semibold underline">View or manage your appointment</a>.</p>}
          {requestAppointment.error && <p className="sm:col-span-2 text-sm text-rose-700">{requestAppointment.error.message}</p>}
        </form>
      </section>}

      {allowContact && <section id="contact" className={`${radius} ${surface} bg-[var(--site-surface)] p-6 sm:p-8`}>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]">Contact and location</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Connect with {data.business.name}</h2><div className="mt-5 grid gap-3 text-sm text-[var(--site-muted)]"><p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-[var(--site-primary)]" />{data.business.address}</p>{data.business.phone && <a href={`tel:${data.business.phone}`} onClick={() => onTrack?.("call_click")} className="flex items-center gap-2 font-medium text-[var(--site-text)]"><Phone className="size-4 text-[var(--site-primary)]" />{data.business.phone}</a>}{data.business.whatsapp && <a href={`https://wa.me/${data.business.whatsapp.replace(/\D/g, "")}`} onClick={() => onTrack?.("whatsapp_click")} className="flex items-center gap-2 font-medium text-[var(--site-text)]"><MessageCircle className="size-4 text-[var(--site-primary)]" />WhatsApp</a>}{data.business.website && <a href={data.business.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-medium text-[var(--site-text)]"><Globe2 className="size-4 text-[var(--site-primary)]" />Official website <ArrowUpRight className="size-3" /></a>}</div></div>
          {preview ? <div className="rounded-xl bg-slate-50 p-5 text-sm leading-6 text-[var(--site-muted)]">Enquiry form preview is disabled until this website is public.</div> : <form className="grid gap-3" onFocus={() => onTrack?.("lead_start")} onSubmit={event => { event.preventDefault(); submitLead(); }}><h3 className="text-lg font-semibold">Send an enquiry</h3><input required className="field" placeholder="Your name" value={lead.name} onChange={event => setLead({ ...lead, name: event.target.value })} /><input className="field" type="email" placeholder="Email (optional)" value={lead.email} onChange={event => setLead({ ...lead, email: event.target.value })} /><input className="field" type="tel" placeholder="Phone (optional)" value={lead.phone} onChange={event => setLead({ ...lead, phone: event.target.value })} /><textarea className="field min-h-24" placeholder="How can the business help?" value={lead.message} onChange={event => setLead({ ...lead, message: event.target.value })} /><label className="flex items-start gap-2 text-xs text-[var(--site-muted)]"><input type="checkbox" checked={lead.consentGiven} onChange={event => setLead({ ...lead, consentGiven: event.target.checked })} />I agree to share these details with this business for responding to my enquiry.</label><button disabled={!lead.consentGiven || createLead.isPending} className={`inline-flex min-h-11 items-center justify-center gap-2 ${buttonRadius} bg-[var(--site-primary)] px-4 text-sm font-semibold text-white disabled:opacity-50`}><Send className="size-4" />{createLead.isPending ? "Sending…" : "Send enquiry"}</button>{createLead.isSuccess && <p className="text-sm text-emerald-700">Your enquiry was sent.</p>}{createLead.error && <p className="text-sm text-rose-700">{createLead.error.message}</p>}</form>}
        </div>
      </section>}
    </div>

    <footer className="border-t border-slate-200 bg-[var(--site-surface)]"><div className={`mx-auto ${maxWidth} flex flex-col gap-3 px-5 py-6 text-sm text-[var(--site-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8`}><span>Business-provided information · Published on Just Finds</span><a href={listingHref} className="font-semibold text-[var(--site-primary)]">Back to Just Finds listing</a></div></footer>
  </main>;
}
