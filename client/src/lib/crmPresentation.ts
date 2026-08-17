export const leadStages = ["new", "contacted", "qualified", "converted", "closed"] as const;

export type LeadStage = (typeof leadStages)[number];

export function leadStageTone(stage: LeadStage) {
  if (stage === "converted") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (stage === "closed") return "bg-slate-100 text-slate-600 ring-slate-200";
  if (stage === "qualified") return "bg-blue-50 text-blue-800 ring-blue-200";
  if (stage === "contacted") return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

export function appointmentDecisionGuidance(status: string, availableSlotCount: number) {
  if (status === "proposed") return "Waiting for the customer to respond to the proposed time.";
  if (status !== "requested" && status !== "reschedule_requested") return "This appointment request no longer needs an owner decision.";
  if (availableSlotCount === 0) return "No alternative availability is currently open. You can still approve the requested time if it remains valid, or reject the request.";
  return "Approve the requested time, reject it, or offer one of the currently available times.";
}
