import { useState } from "react";
import { Globe, MapPin, MessageCircle, Phone } from "lucide-react";
import { trpc } from "@/lib/trpc";

type WebsiteData = {
  page: { id: number; slug: string };
  business: { id: number; name: string; phone?: string | null; whatsapp?: string | null; website?: string | null; address: string; shortDescription?: string | null; aboutDescription?: string | null };
  sections: Array<{ id: number; sectionType: string; enabled?: boolean }>;
  services: Array<{ id: number; name: string; description?: string | null }>;
  images: Array<{ id: number; url: string; alt?: string | null; imageType: string }>;
  reviews: Array<{ id: number; content: string | null }>;
  category?: string | null;
  city?: string | null;
};

type TrackingEvent = "page_view" | "cta_click" | "lead_start" | "lead_submit" | "call_click" | "whatsapp_click";

export default function WebsiteRenderer({ data, preview = false, onTrack }: { data: WebsiteData; preview?: boolean; onTrack?: (eventType: TrackingEvent) => void }) {
  const [lead, setLead] = useState({ name: "", email: "", phone: "", message: "", consentGiven: false });
  const [appointment, setAppointment] = useState({ slot: "", name: "", email: "", phone: "", message: "", consentGiven: false });
  const createLead = trpc.ai.createLead.useMutation();
  const availability = trpc.business.publicAppointmentAvailability.useQuery({ businessId: data.business.id }, { enabled: !preview });
  const requestAppointment = trpc.business.requestAppointment.useMutation();
  const cover = data.images.find(image => image.imageType === "cover") ?? data.images[0];

  const submitLead = () => {
    if (preview || !lead.name.trim() || !lead.consentGiven) return;
    createLead.mutate({ businessId: data.business.id, name: lead.name.trim(), email: lead.email.trim() || undefined, phone: lead.phone.trim() || undefined, message: lead.message.trim() || undefined, page: data.page.slug, consentGiven: true }, {
      onSuccess: () => { onTrack?.("lead_submit"); setLead({ name: "", email: "", phone: "", message: "", consentGiven: false }); },
    });
  };

  const submitAppointment = () => {
    if (preview || !appointment.slot || !appointment.name.trim() || !appointment.consentGiven) return;
    requestAppointment.mutate({ businessId: data.business.id, startsAt: appointment.slot, name: appointment.name.trim(), phone: appointment.phone.trim() || undefined, email: appointment.email.trim() || undefined, message: appointment.message.trim() || undefined, consentGiven: true }, {
      onSuccess: () => { onTrack?.("lead_submit"); setAppointment({ slot: "", name: "", email: "", phone: "", message: "", consentGiven: false }); },
    });
  };

  const renderContact = () => <>
    <h2 className="text-2xl font-semibold">Contact</h2>
    <div className="mt-4 grid gap-3 text-sm text-slate-600">
      <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 text-blue-700" />{data.business.address}</p>
      {data.business.website && <a href={data.business.website} target="_blank" rel="noreferrer" className="flex items-center gap-2"><Globe className="size-4 text-blue-700" />Official website</a>}
    </div>
    {preview ? <p className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">Lead form preview is disabled until this website is public.</p> : <form className="mt-6 grid gap-3" onFocus={() => onTrack?.("lead_start")} onSubmit={event => { event.preventDefault(); submitLead(); }}>
      <h3 className="font-semibold text-slate-900">Send an enquiry</h3>
      <input required className="field" placeholder="Your name" value={lead.name} onChange={event => setLead({ ...lead, name: event.target.value })} />
      <input className="field" type="email" placeholder="Email" value={lead.email} onChange={event => setLead({ ...lead, email: event.target.value })} />
      <textarea className="field min-h-24" placeholder="How can the business help?" value={lead.message} onChange={event => setLead({ ...lead, message: event.target.value })} />
      <label className="flex items-start gap-2 text-xs text-slate-500"><input type="checkbox" checked={lead.consentGiven} onChange={event => setLead({ ...lead, consentGiven: event.target.checked })} />I agree to share these details with this business for responding to my enquiry.</label>
      <button disabled={!lead.consentGiven || createLead.isPending} className="rounded-xl bg-[#173d9c] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{createLead.isPending ? "Sending…" : "Send enquiry"}</button>
      {createLead.isSuccess && <p className="text-sm text-emerald-700">Your enquiry was sent.</p>}
    </form>}
  </>;

  return <main className="min-h-full bg-slate-50 text-slate-900">
    <header className="relative overflow-hidden bg-[#102a6b] text-white">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        {cover && <img src={cover.url} alt={cover.alt || `${data.business.name} cover`} className="absolute inset-0 size-full object-cover opacity-25" />}
        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">{data.category ?? "Local business"} · {data.city ?? ""}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-.04em] sm:text-6xl">{data.business.name}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100">{data.business.shortDescription || "A local business on Just Finds."}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {data.business.phone && <a href={`tel:${data.business.phone}`} onClick={() => onTrack?.("call_click")} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#102a6b]"><Phone className="size-4" />Call business</a>}
            {availability.data?.enabled && <a href="#book-appointment" className="inline-flex items-center gap-2 rounded-xl bg-[#2c64dc] px-4 py-3 text-sm font-semibold text-white">Book appointment</a>}
            {data.business.whatsapp && <a href={`https://wa.me/${data.business.whatsapp.replace(/\D/g, "")}`} onClick={() => onTrack?.("whatsapp_click")} className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-3 text-sm font-semibold text-white"><MessageCircle className="size-4" />WhatsApp</a>}
          </div>
        </div>
      </div>
    </header>
    <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 sm:px-8 sm:py-12">
      {availability.data?.enabled && <section id="book-appointment" className="rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">Request an appointment</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Choose a currently available time in {availability.data.timeZone}. The business will confirm or decline the request after contacting you.</p>
        {availability.data.slots.length ? <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); submitAppointment(); }}>
          <label className="sm:col-span-2 text-sm font-medium text-slate-700">Available time<select required className="field mt-1" value={appointment.slot} onChange={event => setAppointment({ ...appointment, slot: event.target.value })}><option value="">Select an available time</option>{availability.data.slots.map(slot => <option key={slot.startAt.toISOString()} value={slot.startAt.toISOString()}>{new Date(slot.startAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short", timeZone: availability.data.timeZone ?? undefined })}</option>)}</select></label>
          <input required className="field" placeholder="Your name" value={appointment.name} onChange={event => setAppointment({ ...appointment, name: event.target.value })} />
          <input className="field" type="tel" placeholder="Phone" value={appointment.phone} onChange={event => setAppointment({ ...appointment, phone: event.target.value })} />
          <input className="field" type="email" placeholder="Email (optional)" value={appointment.email} onChange={event => setAppointment({ ...appointment, email: event.target.value })} />
          <textarea className="field min-h-24 sm:col-span-2" placeholder="Reason for appointment (optional)" value={appointment.message} onChange={event => setAppointment({ ...appointment, message: event.target.value })} />
          <label className="sm:col-span-2 flex items-start gap-2 text-xs text-slate-500"><input type="checkbox" checked={appointment.consentGiven} onChange={event => setAppointment({ ...appointment, consentGiven: event.target.checked })} />I agree to share these details with this business to arrange this appointment.</label>
          <button disabled={!appointment.slot || !appointment.consentGiven || requestAppointment.isPending} className="rounded-xl bg-[#173d9c] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{requestAppointment.isPending ? "Sending request…" : "Request appointment"}</button>
          {requestAppointment.isSuccess && <p className="self-center text-sm text-emerald-700">Request sent. The business will confirm the appointment.</p>}
          {requestAppointment.error && <p className="sm:col-span-2 text-sm text-rose-700">{requestAppointment.error.message}</p>}
        </form> : <p className="mt-5 rounded-xl bg-white p-4 text-sm text-slate-600">No appointment times are currently available. Please call or send an enquiry instead.</p>}
      </section>}
      {data.sections.filter(section => section.enabled !== false).map(section => <section key={section.id} id={section.sectionType} className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        {section.sectionType === "hero" ? <><p className="text-sm font-semibold text-blue-700">Official business information</p><h2 className="mt-2 text-2xl font-semibold">Welcome to {data.business.name}</h2></>
          : section.sectionType === "about" ? <><h2 className="text-2xl font-semibold">About</h2><p className="mt-3 max-w-3xl leading-7 text-slate-600">{data.business.aboutDescription || data.business.shortDescription || "Business information is being prepared."}</p></>
          : ["services", "menu", "rooms", "doctors", "facilities", "offers"].includes(section.sectionType) ? <><h2 className="text-2xl font-semibold capitalize">{section.sectionType}</h2>{data.services.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{data.services.map(service => <div key={service.id} className="rounded-2xl border border-slate-200 p-4"><h3 className="font-semibold">{service.name}</h3>{service.description && <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>}</div>)}</div> : <p className="mt-3 text-slate-500">No current offerings have been added.</p>}</>
          : section.sectionType === "gallery" ? <><h2 className="text-2xl font-semibold">Gallery</h2>{data.images.length ? <div className="mt-5 grid gap-3 sm:grid-cols-3">{data.images.map(image => <img key={image.id} src={image.url} alt={image.alt || `${data.business.name} photo`} className="aspect-[4/3] w-full rounded-2xl object-cover" />)}</div> : <p className="mt-3 text-slate-500">No photos have been added.</p>}</>
          : section.sectionType === "reviews" ? <><h2 className="text-2xl font-semibold">Reviews</h2>{data.reviews.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{data.reviews.map(review => <article key={review.id} className="rounded-2xl border border-slate-200 p-4"><p className="text-sm leading-6 text-slate-600">{review.content || "Published review content is unavailable."}</p></article>)}</div> : <p className="mt-3 text-slate-500">No published reviews are available.</p>}</>
          : ["contact", "map", "cta"].includes(section.sectionType) ? renderContact()
          : <><h2 className="text-2xl font-semibold capitalize">{section.sectionType}</h2><p className="mt-3 text-slate-600">Current business information is available from the listing owner.</p></>}
      </section>)}
      <footer className="pb-8 text-center text-xs text-slate-500">Published on Just Finds · Business-provided information</footer>
    </div>
  </main>;
}
