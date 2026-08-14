import { describe, expect, it } from "vitest";
import { buildAppointmentCalendarLinks } from "./appointmentCalendar";

describe("approved appointment calendar exports", () => {
  it("builds a Google Calendar template and escaped iCalendar event from approved UTC times", () => {
    const links = buildAppointmentCalendarLinks({
      startsAt: "2026-08-20T08:30:00.000Z",
      endsAt: "2026-08-20T09:00:00.000Z",
      businessName: "Vishnoi, Face Clinic",
      address: "12; Main Street\nKanpur",
      uid: "test-appointment",
    });

    const google = new URL(links.google);
    expect(google.origin).toBe("https://calendar.google.com");
    expect(google.searchParams.get("action")).toBe("TEMPLATE");
    expect(google.searchParams.get("dates")).toBe("20260820T083000Z/20260820T090000Z");
    expect(google.searchParams.get("text")).toBe("Appointment with Vishnoi, Face Clinic");

    const ical = decodeURIComponent(links.ical.replace("data:text/calendar;charset=utf-8,", ""));
    expect(ical).toContain("UID:test-appointment@justfinds");
    expect(ical).toContain("DTSTART:20260820T083000Z");
    expect(ical).toContain("DTEND:20260820T090000Z");
    expect(ical).toContain("SUMMARY:Appointment with Vishnoi\\, Face Clinic");
    expect(ical).toContain("LOCATION:12\\; Main Street\\nKanpur");
  });
});
