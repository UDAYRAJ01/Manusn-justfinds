export type CustomerAppointmentStatus = "requested" | "proposed" | "reschedule_requested" | "confirmed" | "declined" | "cancelled";

export function customerAppointmentPermissions(status: CustomerAppointmentStatus, availableSlotCount: number) {
  const canChange = ["requested", "proposed", "reschedule_requested", "confirmed"].includes(status);
  return {
    canAcceptProposal: status === "proposed",
    canRequestReschedule: canChange && availableSlotCount > 0,
    canCancel: canChange,
    canAddToCalendar: status === "confirmed",
  };
}

export function customerAppointmentTimeline(status: CustomerAppointmentStatus) {
  const middleLabel = status === "proposed" ? "Time proposed" : status === "reschedule_requested" ? "Reschedule requested" : status === "declined" ? "Not approved" : "Approved";
  const middleState = status === "requested" ? "upcoming" : status === "confirmed" ? "complete" : "current";
  const finalLabel = status === "cancelled" ? "Cancelled" : status === "declined" ? "Closed" : "Confirmed";
  const finalState = status === "confirmed" || status === "cancelled" || status === "declined" ? "current" : "upcoming";
  return [
    { label: "Requested", state: "complete" },
    { label: middleLabel, state: middleState },
    { label: finalLabel, state: finalState },
  ] as const;
}
