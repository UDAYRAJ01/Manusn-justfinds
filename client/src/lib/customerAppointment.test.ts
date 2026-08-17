import { describe, expect, it } from "vitest";
import { customerAppointmentPermissions, customerAppointmentTimeline } from "./customerAppointment";

describe("customer appointment presentation", () => {
  it("limits customer actions to the request status and real availability", () => {
    expect(customerAppointmentPermissions("requested", 0)).toEqual({ canAcceptProposal: false, canRequestReschedule: false, canCancel: true, canAddToCalendar: false });
    expect(customerAppointmentPermissions("proposed", 2)).toEqual({ canAcceptProposal: true, canRequestReschedule: true, canCancel: true, canAddToCalendar: false });
    expect(customerAppointmentPermissions("confirmed", 1)).toEqual({ canAcceptProposal: false, canRequestReschedule: true, canCancel: true, canAddToCalendar: true });
    expect(customerAppointmentPermissions("cancelled", 4)).toEqual({ canAcceptProposal: false, canRequestReschedule: false, canCancel: false, canAddToCalendar: false });
  });

  it("uses a concise three-step status timeline without internal event details", () => {
    expect(customerAppointmentTimeline("proposed").map(step => step.label)).toEqual(["Requested", "Time proposed", "Confirmed"]);
    expect(customerAppointmentTimeline("cancelled").at(-1)).toEqual({ label: "Cancelled", state: "current" });
  });
});
