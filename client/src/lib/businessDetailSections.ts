export type BusinessDetailSection = {
  id: "overview" | "services" | "hours" | "location" | "photos" | "website" | "offers" | "details" | "reviews";
  label: string;
};

export type BusinessDetailSectionFacts = {
  hasOverview: boolean;
  hasServices: boolean;
  hasHours: boolean;
  hasLocation: boolean;
  hasPhotos: boolean;
  hasWebsite: boolean;
  hasOffers: boolean;
  hasFaqs: boolean;
  hasReviews: boolean;
};

export function getBusinessDetailSections(facts: BusinessDetailSectionFacts): BusinessDetailSection[] {
  const candidates: Array<BusinessDetailSection & { show: boolean }> = [
    { id: "overview", label: "Overview", show: facts.hasOverview },
    { id: "services", label: "Services", show: facts.hasServices },
    { id: "hours", label: "Hours", show: facts.hasHours },
    { id: "location", label: "Location", show: facts.hasLocation },
    { id: "photos", label: "Photos", show: facts.hasPhotos },
    { id: "website", label: "Website", show: facts.hasWebsite },
    { id: "offers", label: "Offers", show: facts.hasOffers },
    { id: "details", label: "Details", show: facts.hasFaqs },
    { id: "reviews", label: "Reviews", show: facts.hasReviews },
  ];

  return candidates.filter(({ show }) => show).map(({ show: _show, ...section }) => section);
}

export function hasBookableAppointment(availability: { enabled?: boolean; slots?: unknown[] } | undefined): boolean {
  return availability?.enabled === true && Array.isArray(availability.slots) && availability.slots.length > 0;
}
