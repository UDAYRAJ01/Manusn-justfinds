import { describe, expect, it } from "vitest";
import { assertTimeZone, isValidIsoDate, isValidTime, slotsForAvailability, zonedDateTimeToUtc } from "./appointmentAvailability";

describe("appointment availability", () => {
  it("validates explicit local date, time, and IANA time-zone inputs", () => {
    expect(isValidTime("09:30")).toBe(true);
    expect(isValidTime("9:30")).toBe(false);
    expect(isValidIsoDate("2026-03-02")).toBe(true);
    expect(isValidIsoDate("2026/03/02")).toBe(false);
    expect(assertTimeZone("Asia/Kolkata")).toBe("Asia/Kolkata");
    expect(() => assertTimeZone("Not/A_Timezone")).toThrow("valid IANA");
  });

  it("creates only future slots and excludes both blackout dates and pending request conflicts", () => {
    const now = new Date("2026-03-02T03:00:00.000Z"); // 08:30 Monday in Asia/Kolkata
    const firstSlot = zonedDateTimeToUtc("2026-03-02", "09:00", "Asia/Kolkata");
    const available = slotsForAvailability({
      now,
      timeZone: "Asia/Kolkata",
      windows: [{ dayOfWeek: 1, startsAt: "09:00", endsAt: "10:00" }],
      slotDurationMinutes: 30,
      minimumNoticeMinutes: 0,
      maximumAdvanceDays: 0,
      blackoutDates: [],
      unavailableStartsAt: [firstSlot],
    });
    expect(available).toHaveLength(1);
    expect(available[0]?.startAt.toISOString()).toBe("2026-03-02T04:00:00.000Z");

    const blackedOut = slotsForAvailability({
      now,
      timeZone: "Asia/Kolkata",
      windows: [{ dayOfWeek: 1, startsAt: "09:00", endsAt: "10:00" }],
      slotDurationMinutes: 30,
      minimumNoticeMinutes: 0,
      maximumAdvanceDays: 0,
      blackoutDates: ["2026-03-02"],
      unavailableStartsAt: [],
    });
    expect(blackedOut).toEqual([]);
  });
});
