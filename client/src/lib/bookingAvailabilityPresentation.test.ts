import { describe, expect, it } from "vitest";
import { bookingOperationalState, weeklyWindowConflicts } from "./bookingAvailabilityPresentation";

describe("booking availability presentation", () => {
  it("states when a published listing is ready for real customer booking requests", () => {
    expect(bookingOperationalState({ isEnabled: true, listingStatus: "published", weeklyWindowCount: 2, openSlotCount: 6 })).toMatchObject({ listingLabel: "Listing published", requestLabel: "Booking requests enabled", tone: "emerald" });
  });

  it("keeps unpublished and disabled configurations distinct without inventing availability", () => {
    expect(bookingOperationalState({ isEnabled: true, listingStatus: "draft", weeklyWindowCount: 2, openSlotCount: 6 })).toMatchObject({ listingLabel: "Listing not published", requestLabel: "Booking requests configured", tone: "amber" });
    expect(bookingOperationalState({ isEnabled: false, listingStatus: "published", weeklyWindowCount: 0, openSlotCount: 0 })).toMatchObject({ requestLabel: "Booking requests disabled", tone: "slate" });
  });

  it("flags malformed or duplicated weekday configuration before save", () => {
    expect(weeklyWindowConflicts([{ dayOfWeek: 1, startsAt: "17:00", endsAt: "09:00" }])).toContain("Each availability window must end after it starts.");
    expect(weeklyWindowConflicts([{ dayOfWeek: 1, startsAt: "09:00", endsAt: "12:00" }, { dayOfWeek: 1, startsAt: "13:00", endsAt: "17:00" }])).toContain("Each weekday can have one availability window. Remove the duplicate day before saving.");
  });
});
