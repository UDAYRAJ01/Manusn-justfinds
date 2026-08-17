import { trpc } from "@/lib/trpc";
import { appointmentDecisionGuidance } from "@/lib/crmPresentation";
import { CalendarCheck2, CalendarClock, Loader2, Save, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type WindowDraft = { dayOfWeek: number; startsAt: string; endsAt: string };
type DecisionDraft = { ownerNote: string; proposedStartsAt: string };
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const defaultWindows: WindowDraft[] = [1, 2, 3, 4, 5].map(dayOfWeek => ({ dayOfWeek, startsAt: "09:00", endsAt: "17:00" }));
const formatTime = (value: Date | string, timeZone: string) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone });
const errorMessage = (error: unknown) => error instanceof Error ? error.message : undefined;

export function AppointmentCalendarManager({ businessId }: { businessId: number }) {
  const utils = trpc.useUtils();
  const query = trpc.business.appointmentSettings.useQuery({ businessId });
  const availability = trpc.business.ownerAppointmentAvailability.useQuery({ businessId }, { enabled: Boolean(query.data?.settings.isEnabled) });
  const [enabled, setEnabled] = useState(false);
  const [timeZone, setTimeZone] = useState("Asia/Kolkata");
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30);
  const [minimumNoticeMinutes, setMinimumNoticeMinutes] = useState(120);
  const [maximumAdvanceDays, setMaximumAdvanceDays] = useState(30);
  const [windows, setWindows] = useState<WindowDraft[]>(defaultWindows);
  const [blackoutDate, setBlackoutDate] = useState("");
  const [blackoutReason, setBlackoutReason] = useState("");
  const [decisions, setDecisions] = useState<Record<number, DecisionDraft>>({});
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    setEnabled(query.data.settings.isEnabled);
    setTimeZone(query.data.settings.timeZone);
    setSlotDurationMinutes(query.data.settings.slotDurationMinutes);
    setMinimumNoticeMinutes(query.data.settings.minimumNoticeMinutes);
    setMaximumAdvanceDays(query.data.settings.maximumAdvanceDays);
    setWindows(query.data.windows.length ? query.data.windows.map(row => ({ dayOfWeek: row.dayOfWeek, startsAt: row.startsAt, endsAt: row.endsAt })) : defaultWindows);
  }, [query.data]);

  useEffect(() => {
    if (!saveNotice) return;
    const timeout = window.setTimeout(() => setSaveNotice(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [saveNotice]);

  const invalidate = () => {
    void utils.business.appointmentSettings.invalidate({ businessId });
    void utils.business.ownerAppointmentAvailability.invalidate({ businessId });
  };
  const save = trpc.business.saveAppointmentSettings.useMutation({ onSuccess: () => { setSaveNotice("Availability settings saved."); invalidate(); } });
  const addBlackout = trpc.business.addAppointmentBlackout.useMutation({ onSuccess: () => { setBlackoutDate(""); setBlackoutReason(""); setSaveNotice("Blackout date saved."); invalidate(); } });
  const removeBlackout = trpc.business.removeAppointmentBlackout.useMutation({ onSuccess: () => { setSaveNotice("Blackout date removed."); invalidate(); } });
  const decide = trpc.business.decideAppointmentRequest.useMutation({ onSuccess: () => { setSaveNotice("Appointment decision saved."); invalidate(); } });
  const error = errorMessage(save.error) || errorMessage(addBlackout.error) || errorMessage(removeBlackout.error) || errorMessage(decide.error);
  const slots = availability.data?.slots ?? [];
  const openSlotCount = slots.filter(slot => new Date(slot.startAt).getTime() > Date.now()).length;
  const draftFor = (requestId: number) => decisions[requestId] ?? { ownerNote: "", proposedStartsAt: slots[0] ? new Date(slots[0].startAt).toISOString() : "" };
  const patchDraft = (requestId: number, patch: Partial<DecisionDraft>) => setDecisions(current => ({ ...current, [requestId]: { ...draftFor(requestId), ...patch } }));
  const toggleDay = (dayOfWeek: number) => setWindows(current => current.some(value => value.dayOfWeek === dayOfWeek) ? current.filter(value => value.dayOfWeek !== dayOfWeek) : [...current, { dayOfWeek, startsAt: "09:00", endsAt: "17:00" }].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
  const changeWindow = (dayOfWeek: number, patch: Partial<WindowDraft>) => setWindows(current => current.map(value => value.dayOfWeek === dayOfWeek ? { ...value, ...patch } : value));

  if (query.isLoading) return <div className="mt-8 grid min-h-40 place-items-center text-slate-500"><Loader2 className="size-5 animate-spin" /></div>;
  if (query.error) return <p className="mt-8 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">{query.error.message}</p>;

  return <div className="mt-8 space-y-5">
    {saveNotice && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900" role="status">{saveNotice}</p>}
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><CalendarClock className="size-5 text-[#173d9c]" /><h2 className="font-semibold">Appointment availability</h2></div><p className="mt-2 max-w-2xl text-sm leading-6 text-blue-950">Visitors request a time, then you decide whether to approve, reject, or offer a different available time. Requests never auto-confirm.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#173d9c]">{enabled ? `${windows.length} weekly window${windows.length === 1 ? "" : "s"}` : "Booking requests are off"}</span></div>
      <label className="mt-5 flex items-center gap-3 rounded-xl bg-white p-3 text-sm font-semibold text-slate-800"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />Accept appointment requests</label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><label className="text-sm font-medium text-slate-700">Time zone<select className="field mt-1" value={timeZone} onChange={event => setTimeZone(event.target.value)}><option value="Asia/Kolkata">India (Asia/Kolkata)</option><option value="Asia/Dubai">Dubai (Asia/Dubai)</option><option value="Europe/London">London (Europe/London)</option><option value="America/New_York">New York (America/New_York)</option><option value="UTC">UTC</option></select></label><label className="text-sm font-medium text-slate-700">Slot duration (min)<input className="field mt-1" min={10} max={240} step={5} type="number" value={slotDurationMinutes} onChange={event => setSlotDurationMinutes(Number(event.target.value))} /></label><label className="text-sm font-medium text-slate-700">Minimum notice (min)<input className="field mt-1" min={0} max={10080} step={30} type="number" value={minimumNoticeMinutes} onChange={event => setMinimumNoticeMinutes(Number(event.target.value))} /></label><label className="text-sm font-medium text-slate-700">Advance window (days)<input className="field mt-1" min={1} max={180} type="number" value={maximumAdvanceDays} onChange={event => setMaximumAdvanceDays(Number(event.target.value))} /></label></div>
    </section>

    <section className="rounded-2xl border border-slate-200 p-5"><h2 className="font-semibold">Weekly available times</h2><p className="mt-1 text-sm text-slate-500">Select the days and one operating window per day for this appointment calendar.</p><div className="mt-4 grid gap-3 lg:grid-cols-2">{days.map((day, dayOfWeek) => { const window = windows.find(value => value.dayOfWeek === dayOfWeek); return <div key={day} className={`grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border p-3 ${window ? "border-blue-200 bg-blue-50/40" : "border-slate-200 bg-slate-50"}`}><input aria-label={`Offer appointments on ${day}`} type="checkbox" checked={Boolean(window)} onChange={() => toggleDay(dayOfWeek)} /><span className="text-sm font-semibold text-slate-800">{day}</span>{window && <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-start-2"><label className="text-xs font-medium text-slate-600">From<input className="field mt-1" type="time" value={window.startsAt} onChange={event => changeWindow(dayOfWeek, { startsAt: event.target.value })} /></label><label className="text-xs font-medium text-slate-600">Until<input className="field mt-1" type="time" value={window.endsAt} onChange={event => changeWindow(dayOfWeek, { endsAt: event.target.value })} /></label></div>}</div>; })}</div><button disabled={save.isPending} onClick={() => save.mutate({ businessId, isEnabled: enabled, timeZone, slotDurationMinutes, minimumNoticeMinutes, maximumAdvanceDays, windows })} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#173d9c] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Save className="size-4" />{save.isPending ? "Saving…" : "Save availability"}</button></section>

    <section className="rounded-2xl border border-slate-200 p-5"><h2 className="font-semibold">Blackout dates</h2><p className="mt-1 text-sm text-slate-500">Use blackouts for holidays, closures, or exceptional unavailability.</p><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]"><input className="field" type="date" value={blackoutDate} onChange={event => setBlackoutDate(event.target.value)} /><input className="field" maxLength={240} placeholder="Reason (optional)" value={blackoutReason} onChange={event => setBlackoutReason(event.target.value)} /><button disabled={!blackoutDate || addBlackout.isPending} onClick={() => addBlackout.mutate({ businessId, localDate: blackoutDate, reason: blackoutReason || undefined })} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-[#173d9c] disabled:opacity-50">Block date</button></div><div className="mt-4 flex flex-wrap gap-2">{query.data?.blackouts.length ? query.data.blackouts.map(blackout => <button key={blackout.id} disabled={removeBlackout.isPending} onClick={() => removeBlackout.mutate({ businessId, blackoutId: blackout.id })} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700">{blackout.localDate}{blackout.reason ? ` · ${blackout.reason}` : ""} ×</button>) : <p className="text-sm text-slate-500">No blackout dates.</p>}</div></section>

    <section className="rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2"><ShieldCheck className="size-5 text-[#173d9c]" /><h2 className="font-semibold">Booking decisions</h2></div>
      <p className="mt-1 text-sm text-slate-500">Every decision updates the related Lead CRM status and creates a private appointment history event.</p>
      <div className="mt-4 space-y-3">{query.data?.requests.length ? query.data.requests.map(({ request, lead }) => {
        const draft = draftFor(request.id);
        const actionable = ["requested", "reschedule_requested", "proposed"].includes(request.status);
        return <article className="rounded-xl bg-slate-50 p-4" key={request.id}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{lead.name}</p><p className="mt-1 text-sm text-slate-600">{formatTime(request.startsAt, request.timeZone)} · {request.timeZone}</p><p className="mt-1 text-xs text-slate-500">{lead.email || lead.phone || "No contact details"} · <span className="font-semibold capitalize">{request.status.replaceAll("_", " ")}</span></p></div>{request.proposedStartsAt && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">Proposed: {formatTime(request.proposedStartsAt, request.timeZone)}</p>}</div>
          {lead.message && <p className="mt-3 text-sm leading-6 text-slate-600">{lead.message}</p>}
          <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">{appointmentDecisionGuidance(request.status, openSlotCount)}</p>
          <textarea className="field mt-3 min-h-20" placeholder="Private decision note" value={draft.ownerNote} onChange={event => patchDraft(request.id, { ownerNote: event.target.value })} />
          {actionable && <div className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3"><div className="flex flex-wrap gap-2"><button disabled={decide.isPending || request.status === "proposed"} onClick={() => decide.mutate({ businessId, requestId: request.id, action: "approve", ownerNote: draft.ownerNote || undefined })} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><CalendarCheck2 className="size-4" />Approve</button><button disabled={decide.isPending} onClick={() => decide.mutate({ businessId, requestId: request.id, action: "reject", ownerNote: draft.ownerNote || undefined })} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"><XCircle className="size-4" />Reject</button></div>{request.status !== "proposed" && <div className="flex flex-col gap-2 sm:flex-row"><select aria-label={`Propose a new time for ${lead.name}`} className="field flex-1" value={draft.proposedStartsAt} onChange={event => patchDraft(request.id, { proposedStartsAt: event.target.value })}>{slots.length ? slots.map(slot => <option key={new Date(slot.startAt).toISOString()} value={new Date(slot.startAt).toISOString()}>{formatTime(slot.startAt, request.timeZone)}</option>) : <option value="">No alternative slots available</option>}</select><button disabled={decide.isPending || !draft.proposedStartsAt} onClick={() => decide.mutate({ businessId, requestId: request.id, action: "propose_time", startsAt: draft.proposedStartsAt, ownerNote: draft.ownerNote || undefined })} className="min-h-11 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-[#173d9c] disabled:opacity-50">Propose time</button></div>}</div>}
        </article>;
      }) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No booking requests yet. New requests will appear here and in Lead CRM.</p>}</div>
    </section>
    {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error} Check the current request status and availability, then try again.</p>}
  </div>;
}
