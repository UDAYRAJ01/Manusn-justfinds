export type AvailabilityWindowDraft = { dayOfWeek: number; startsAt: string; endsAt: string };

export function weeklyWindowConflicts(windows: AvailabilityWindowDraft[]) {
  const conflicts: string[] = [];
  const repeatedDay = windows.find((window, index) => windows.findIndex(other => other.dayOfWeek === window.dayOfWeek) !== index);
  if (repeatedDay) conflicts.push("Each weekday can have one availability window. Remove the duplicate day before saving.");
  if (windows.some(window => !window.startsAt || !window.endsAt || window.startsAt >= window.endsAt)) {
    conflicts.push("Each availability window must end after it starts.");
  }
  return conflicts;
}

export function bookingOperationalState(input: { isEnabled: boolean; listingStatus: string; weeklyWindowCount: number; openSlotCount: number }) {
  const listingIsPublished = input.listingStatus === "published";
  const listingLabel = listingIsPublished ? "Listing published" : input.listingStatus === "under_review" || input.listingStatus === "submitted" ? "Listing under review" : "Listing not published";
  if (!input.isEnabled) return { listingLabel, requestLabel: "Booking requests disabled", description: "The configuration can be prepared and saved, but customers cannot request an appointment while requests are disabled.", tone: "slate" as const };
  if (!listingIsPublished) return { listingLabel, requestLabel: "Booking requests configured", description: "Requests remain unavailable publicly until this listing is published. Keep the schedule ready for review or publication.", tone: "amber" as const };
  if (!input.weeklyWindowCount) return { listingLabel, requestLabel: "Schedule incomplete", description: "Add at least one weekly window before enabling customer booking requests.", tone: "amber" as const };
  if (!input.openSlotCount) return { listingLabel, requestLabel: "No current open slots", description: "Review the saved weekly windows, notice period, booking window, blackout dates, and existing requests.", tone: "amber" as const };
  return { listingLabel, requestLabel: "Booking requests enabled", description: "Customers can submit a request for an available time. Every request remains pending until you decide it.", tone: "emerald" as const };
}
