import { trpc } from "@/lib/trpc";
import { buildAppointmentCalendarLinks } from "@/lib/appointmentCalendar";
import { customerAppointmentPermissions, customerAppointmentTimeline, type CustomerAppointmentStatus } from "@/lib/customerAppointment";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarDays, CalendarPlus, CheckCircle2, ChevronLeft, Clock3, Loader2, MapPin, RefreshCw, XCircle } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState } from "react";

type CustomerAction = "accept_proposal" | "request_reschedule" | "cancel";
function formatTime(value: Date | string, timeZone: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short", timeZone });
}

function statusLabel(status: CustomerAppointmentStatus) {
  return status.replaceAll("_", " ");
}

export default function CustomerAppointment({ token }: { token: string }) {
  const utils = trpc.useUtils();
  const appointment = trpc.business.customerAppointment.useQuery({ customerAccessToken: token }, { retry: false });
  const availability = trpc.business.publicAppointmentAvailability.useQuery(
    { businessId: appointment.data?.business.id ?? 0 },
    { enabled: Boolean(appointment.data?.business.id) },
  );
  const [note, setNote] = useState("");
  const [preferredStartsAt, setPreferredStartsAt] = useState("");
  const action = trpc.business.customerAppointmentAction.useMutation({
    onSuccess: () => {
      setNote("");
      setPreferredStartsAt("");
      void utils.business.customerAppointment.invalidate({ customerAccessToken: token });
      void utils.business.publicAppointmentAvailability.invalidate();
    },
  });

  const data = appointment.data;
  const status = data?.request.status as CustomerAppointmentStatus | undefined;
  const slots = availability.data?.slots ?? [];
  const links = useMemo(
    () => data && status === "confirmed"
      ? buildAppointmentCalendarLinks({ startsAt: data.request.startsAt, endsAt: data.request.endsAt, businessName: data.business.name, address: data.business.address })
      : null,
    [data, status],
  );
  const permissions = status ? customerAppointmentPermissions(status, slots.length) : null;
  const canAccept = Boolean(permissions?.canAcceptProposal && data?.request.proposedStartsAt && data.request.proposedEndsAt);
  const canReschedule = permissions?.canRequestReschedule ?? false;
  const timeline = status ? customerAppointmentTimeline(status) : [];

  const submitAction = (nextAction: CustomerAction) => {
    action.mutate({
      customerAccessToken: token,
      action: nextAction,
      preferredStartsAt: nextAction === "request_reschedule" ? preferredStartsAt : undefined,
      customerNote: nextAction === "request_reschedule" ? note || undefined : undefined,
    });
  };

  if (appointment.isLoading) {
    return <main className="grid min-h-screen place-items-center bg-[var(--jf-canvas)] p-5"><section className="jf-card w-full max-w-md rounded-[24px] p-7"><Loader2 className="size-6 animate-spin text-[var(--jf-primary)]" /><div className="mt-5 h-6 w-2/3 rounded bg-slate-100" /><div className="mt-3 h-4 w-full rounded bg-slate-100" /></section></main>;
  }

  if (appointment.error || !data || !status) {
    return <main className="grid min-h-screen place-items-center bg-[var(--jf-canvas)] p-5"><section className="jf-card max-w-md rounded-[24px] p-7 text-center"><XCircle className="mx-auto size-10 text-rose-600" /><h1 className="mt-4 text-xl font-semibold text-[var(--jf-text)]">Appointment link unavailable</h1><p className="mt-2 text-sm leading-6 text-[var(--jf-muted)]">This secure appointment link is invalid or no longer available. Please contact the business directly.</p><Link href="/" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--jf-primary)]"><ChevronLeft className="size-4" />Back to discovery</Link></section></main>;
  }

  return <main className="min-h-screen bg-[var(--jf-canvas)] px-4 py-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10"><section className="mx-auto max-w-3xl"><Link href={`/business/${data.business.slug}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--jf-primary)]"><ChevronLeft className="size-4" />View business listing</Link>
    <header className="mt-3 rounded-[24px] bg-[var(--jf-ink)] p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-200">Just Finds appointment</p><div className="mt-3 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-[-.035em] sm:text-3xl">{data.business.name}</h1><p className="mt-2 text-sm text-slate-300">A private page for this appointment request only.</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${status === "confirmed" ? "bg-emerald-400/15 text-emerald-100" : status === "declined" || status === "cancelled" ? "bg-white/10 text-slate-200" : "bg-amber-300/15 text-amber-100"}`}>{statusLabel(status)}</span></div></header>

    <section className="jf-card mt-5 rounded-[24px] p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--jf-primary)]">Requested time</p><h2 className="mt-2 text-xl font-semibold text-[var(--jf-text)]">{formatTime(data.request.startsAt, data.request.timeZone)}</h2><p className="mt-2 text-sm text-[var(--jf-muted)]">{data.request.timeZone}</p>{data.business.address && <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-[var(--jf-muted)]"><MapPin className="mt-0.5 size-4 shrink-0 text-[var(--jf-primary)]" />{data.business.address}</p>}</div></div>

      <ol className="mt-6 grid gap-3 border-t border-[var(--jf-border)] pt-5 sm:grid-cols-3" aria-label="Appointment status timeline">{timeline.map((step, index) => <li key={`${step.label}-${index}`} className="flex items-center gap-3 sm:flex-col sm:items-start"><span className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold ${step.state === "complete" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : step.state === "current" ? "border-blue-200 bg-blue-50 text-[var(--jf-primary)]" : "border-[var(--jf-border)] bg-white text-[var(--jf-muted)]"}`}>{step.state === "complete" ? <CheckCircle2 className="size-4" /> : index + 1}</span><span className="text-sm font-medium text-[var(--jf-text)]" {...(step.state === "current" ? { "aria-current": "step" as const } : {})}>{step.label}</span></li>)}</ol>

      {canAccept && data.request.proposedStartsAt && <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">The business proposed a new time</p><p className="mt-1">{formatTime(data.request.proposedStartsAt, data.request.timeZone)}</p><button disabled={action.isPending} onClick={() => submitAction("accept_proposal")} className="jf-action-primary mt-4 inline-flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"><CheckCircle2 className="size-4" />Accept proposed time</button></section>}

      {status === "confirmed" && links && <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><p className="font-semibold">Your appointment is confirmed</p><p className="mt-1">Save the confirmed time to your calendar.</p><div className="mt-4 flex flex-wrap gap-2"><a href={links.google} target="_blank" rel="noreferrer" className="jf-action-primary inline-flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm font-semibold"><CalendarPlus className="size-4" />Add to Google Calendar</a><a href={links.ical} download="just-finds-appointment.ics" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"><CalendarDays className="size-4" />Download iCalendar</a></div></section>}

      {canReschedule && <section className="mt-6 border-t border-[var(--jf-border)] pt-6"><div className="flex items-center gap-2"><RefreshCw className="size-4 text-[var(--jf-primary)]" /><h3 className="font-semibold text-[var(--jf-text)]">Request a different time</h3></div><p className="mt-1 text-sm leading-6 text-[var(--jf-muted)]">Choose a currently available time. The business will review your request.</p><label className="mt-4 block text-sm font-medium text-[var(--jf-text)]" htmlFor="preferred-time">Preferred time</label><select id="preferred-time" className="field mt-2" value={preferredStartsAt} onChange={event => setPreferredStartsAt(event.target.value)}><option value="">Choose an available time</option>{slots.map(slot => <option key={new Date(slot.startAt).toISOString()} value={new Date(slot.startAt).toISOString()}>{formatTime(slot.startAt, data.request.timeZone)}</option>)}</select><label className="mt-4 block text-sm font-medium text-[var(--jf-text)]" htmlFor="reschedule-note">Message to the business <span className="font-normal text-[var(--jf-muted)]">(optional)</span></label><textarea id="reschedule-note" className="field mt-2 min-h-20" placeholder="Add context for your request" value={note} onChange={event => setNote(event.target.value)} /><button disabled={!preferredStartsAt || action.isPending} onClick={() => submitAction("request_reschedule")} className="jf-action-primary mt-4 inline-flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"><Clock3 className="size-4" />Request new time</button></section>}

      {permissions?.canCancel && <section className="mt-6 border-t border-[var(--jf-border)] pt-6"><h3 className="font-semibold text-[var(--jf-text)]">Need to cancel?</h3><p className="mt-1 text-sm leading-6 text-[var(--jf-muted)]">Cancellation closes this request and cannot be undone from this link.</p><AlertDialog><AlertDialogTrigger asChild><button disabled={action.isPending} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"><XCircle className="size-4" />Cancel request</button></AlertDialogTrigger><AlertDialogContent className="rounded-2xl border-[var(--jf-border)] bg-white"><AlertDialogHeader><AlertDialogTitle className="text-[var(--jf-text)]">Cancel this appointment request?</AlertDialogTitle><AlertDialogDescription className="leading-6">This will close the request. You will need to contact {data.business.name} directly if you want to make another appointment.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={action.isPending}>Keep request</AlertDialogCancel><AlertDialogAction disabled={action.isPending} onClick={() => submitAction("cancel")} className="bg-rose-600 text-white hover:bg-rose-700">{action.isPending ? "Cancelling…" : "Yes, cancel request"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></section>}

      {(status === "declined" || status === "cancelled") && <section className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">This appointment request is closed. Contact {data.business.name} directly if you need further help.</section>}
      {action.error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{action.error.message}</p>}
      <footer className="mt-6 border-t border-[var(--jf-border)] pt-5"><p className="text-xs leading-5 text-[var(--jf-muted)]">For your privacy, keep this secure link private. It can access only this appointment request.</p></footer>
    </section>
  </section></main>;
}
