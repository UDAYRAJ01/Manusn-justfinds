import { trpc } from "@/lib/trpc";
import { buildAppointmentCalendarLinks } from "@/lib/appointmentCalendar";
import { CalendarDays, CalendarPlus, CheckCircle2, Clock3, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

type CustomerAction = "accept_proposal" | "request_reschedule" | "cancel";

function formatTime(value: Date | string, timeZone: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short", timeZone });
}

export default function CustomerAppointment({ token }: { token: string }) {
  const utils = trpc.useUtils();
  const appointment = trpc.business.customerAppointment.useQuery({ customerAccessToken: token }, { retry: false });
  const availability = trpc.business.publicAppointmentAvailability.useQuery({ businessId: appointment.data?.business.id ?? 0 }, { enabled: Boolean(appointment.data?.business.id) });
  const [note, setNote] = useState("");
  const [preferredStartsAt, setPreferredStartsAt] = useState("");
  const action = trpc.business.customerAppointmentAction.useMutation({ onSuccess: () => { setNote(""); setPreferredStartsAt(""); void utils.business.customerAppointment.invalidate({ customerAccessToken: token }); void utils.business.publicAppointmentAvailability.invalidate(); } });
  const data = appointment.data;
  const status = data?.request.status;
  const slots = availability.data?.slots ?? [];
  const links = useMemo(() => data && status === "confirmed" ? buildAppointmentCalendarLinks({ startsAt: data.request.startsAt, endsAt: data.request.endsAt, businessName: data.business.name, address: data.business.address }) : null, [data, status]);
  const canReschedule = status === "requested" || status === "reschedule_requested" || status === "proposed";
  const submitAction = (nextAction: CustomerAction) => {
    if (nextAction === "cancel" && !window.confirm("Cancel this appointment request?")) return;
    action.mutate({ customerAccessToken: token, action: nextAction, preferredStartsAt: nextAction === "request_reschedule" ? preferredStartsAt : undefined, customerNote: note || undefined });
  };

  if (appointment.isLoading) return <div className="grid min-h-screen place-items-center bg-[#f6f8fc] text-slate-500"><Loader2 className="size-6 animate-spin" /></div>;
  if (appointment.error || !data) return <main className="grid min-h-screen place-items-center bg-[#f6f8fc] p-5"><section className="max-w-md rounded-3xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-200"><XCircle className="mx-auto size-10 text-rose-600" /><h1 className="mt-4 text-xl font-semibold">Appointment link unavailable</h1><p className="mt-2 text-sm leading-6 text-slate-600">This secure appointment link is invalid or no longer available. Please contact the business directly.</p></section></main>;

  return <main className="min-h-screen bg-[#f6f8fc] px-4 py-8 sm:px-6"><section className="mx-auto max-w-2xl"><div className="rounded-3xl bg-[#102a6b] p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-200">Just Finds appointment</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.04em]">{data.business.name}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">Hello {data.lead.name}. This private page lets you review and manage your appointment request.</p></div><section className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#2456c8]">Current appointment</p><h2 className="mt-2 text-xl font-semibold text-slate-950">{formatTime(data.request.startsAt, data.request.timeZone)}</h2><p className="mt-2 text-sm text-slate-500">{data.request.timeZone}{data.business.address ? ` · ${data.business.address}` : ""}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${status === "confirmed" ? "bg-emerald-100 text-emerald-800" : status === "declined" || status === "cancelled" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-900"}`}>{status?.replaceAll("_", " ")}</span></div>

  {status === "proposed" && data.request.proposedStartsAt && <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">The business proposed a new time</p><p className="mt-1">{formatTime(data.request.proposedStartsAt, data.request.timeZone)}</p><button disabled={action.isPending} onClick={() => submitAction("accept_proposal")} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#173d9c] px-4 py-2.5 font-semibold text-white disabled:opacity-50"><CheckCircle2 className="size-4" />Accept proposed time</button></div>}

  {status === "confirmed" && links && <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950"><p className="font-semibold">Your appointment is approved</p><p className="mt-1">Save it to your calendar. The business may contact you if anything changes.</p><div className="mt-3 flex flex-wrap gap-2"><a href={links.google} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#173d9c] px-4 py-2.5 font-semibold text-white"><CalendarPlus className="size-4" />Add to Google Calendar</a><a href={links.ical} download="just-finds-appointment.ics" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 font-semibold text-emerald-800"><CalendarDays className="size-4" />Download iCalendar</a></div></div>}

  {canReschedule && <div className="mt-5 rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-2"><RefreshCw className="size-4 text-[#173d9c]" /><h3 className="font-semibold">Request a different time</h3></div><p className="mt-1 text-sm text-slate-500">Choose a currently available time. The business must still approve the request.</p><select className="field mt-3" aria-label="Preferred new appointment time" value={preferredStartsAt} onChange={event => setPreferredStartsAt(event.target.value)}><option value="">Choose an available time</option>{slots.map(slot => <option key={new Date(slot.startAt).toISOString()} value={new Date(slot.startAt).toISOString()}>{formatTime(slot.startAt, data.request.timeZone)}</option>)}</select><textarea className="field mt-3 min-h-20" placeholder="Optional message for the business" value={note} onChange={event => setNote(event.target.value)} /><div className="mt-3 flex flex-wrap gap-2"><button disabled={!preferredStartsAt || action.isPending} onClick={() => submitAction("request_reschedule")} className="inline-flex items-center gap-2 rounded-xl bg-[#173d9c] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Clock3 className="size-4" />Request new time</button><button disabled={action.isPending} onClick={() => submitAction("cancel")} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 disabled:opacity-50"><XCircle className="size-4" />Cancel request</button></div></div>}
  {(status === "declined" || status === "cancelled") && <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">This appointment request is closed. Contact {data.business.name} directly if you need further help.</div>}
  {action.error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{action.error.message}</p>}
  <div className="mt-6 border-t border-slate-100 pt-5"><p className="text-xs leading-5 text-slate-500">For your privacy, keep this secure appointment link private. It gives access only to this appointment request.</p></div>
  </section></section></main>;
}
