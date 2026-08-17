import { describe, expect, it } from "vitest";
import { customerAppointmentRequestView } from "./customerAppointmentPresentation";

describe("customerAppointmentRequestView", () => {
  it("returns only customer-safe request timing and status fields", () => {
    const view = customerAppointmentRequestView({
      startsAt: new Date("2026-08-18T09:00:00.000Z"),
      endsAt: new Date("2026-08-18T09:30:00.000Z"),
      timeZone: "Asia/Kolkata",
      status: "proposed",
      proposedStartsAt: new Date("2026-08-19T09:00:00.000Z"),
      proposedEndsAt: new Date("2026-08-19T09:30:00.000Z"),
      decidedAt: null,
      cancelledAt: null,
      ownerNote: "Internal owner-only note",
      customerNote: "Private customer message",
      customerAccessToken: "private-token",
    } as Parameters<typeof customerAppointmentRequestView>[0]);

    expect(view).toEqual(expect.objectContaining({ status: "proposed", timeZone: "Asia/Kolkata" }));
    expect(view).not.toHaveProperty("ownerNote");
    expect(view).not.toHaveProperty("customerNote");
    expect(view).not.toHaveProperty("customerAccessToken");
    expect(view).not.toHaveProperty("id");
  });
});
