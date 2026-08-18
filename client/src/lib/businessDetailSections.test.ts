import { describe, expect, it } from "vitest";
import { getBusinessDetailSections, hasBookableAppointment } from "./businessDetailSections";

describe("business detail section rules", () => {
  it("shows only content sections backed by genuine published facts", () => {
    const sections = getBusinessDetailSections({
      hasOverview: true,
      hasServices: false,
      hasFacilities: false,
      hasHours: true,
      hasLocation: true,
      hasPhotos: false,
      hasWebsite: true,
      hasOffers: false,
      hasFaqs: false,
      hasReviews: false,
      hasAppointments: false,
    });

    expect(sections).toEqual([
      { id: "overview", label: "Overview" },
      { id: "hours", label: "Hours" },
      { id: "location", label: "Location" },
      { id: "website", label: "Website" },
    ]);
  });

  it("includes facilities and appointments only when the profile publishes those real capabilities", () => {
    const sections = getBusinessDetailSections({
      hasOverview: false,
      hasServices: true,
      hasFacilities: true,
      hasHours: false,
      hasLocation: false,
      hasPhotos: false,
      hasWebsite: false,
      hasOffers: false,
      hasFaqs: false,
      hasReviews: false,
      hasAppointments: true,
    });

    expect(sections).toEqual([
      { id: "services", label: "Services" },
      { id: "facilities", label: "Facilities" },
      { id: "appointments", label: "Appointments" },
    ]);
  });

  it("only enables booking actions when the business has enabled availability and real slots", () => {
    expect(hasBookableAppointment(undefined)).toBe(false);
    expect(hasBookableAppointment({ enabled: false, slots: [{}] })).toBe(false);
    expect(hasBookableAppointment({ enabled: true, slots: [] })).toBe(false);
    expect(hasBookableAppointment({ enabled: true, slots: [{}] })).toBe(true);
  });
});
