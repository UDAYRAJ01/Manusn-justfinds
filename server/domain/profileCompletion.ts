export type ProfileCompletionInput = {
  name?: string | null;
  shortDescription?: string | null;
  aboutDescription?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  hoursCount: number;
  servicesCount: number;
  facilitiesCount: number;
  coverImageCount: number;
};

export type ProfileCompletionKey = "basics" | "contact" | "location" | "hours" | "services" | "facilities" | "photos";

export type ProfileCompletionSection = {
  key: ProfileCompletionKey;
  label: string;
  done: boolean;
  hint: string;
  priority: number;
};

export type NextBestAction = {
  key: ProfileCompletionKey;
  label: string;
  hint: string;
  priority: number;
};

export function calculateProfileCompletion(input: ProfileCompletionInput) {
  const sections: ProfileCompletionSection[] = [
    {
      key: "basics",
      label: "Business basics",
      done: Boolean(input.name?.trim() && (input.shortDescription?.trim() || input.aboutDescription?.trim())),
      hint: "Add a clear, factual description.",
      priority: 1,
    },
    {
      key: "contact",
      label: "Contact details",
      done: Boolean(input.phone?.trim() || input.email?.trim() || input.website?.trim()),
      hint: "Add at least one customer contact method.",
      priority: 2,
    },
    {
      key: "location",
      label: "Location pin",
      done: Boolean(input.address?.trim() && input.latitude?.trim() && input.longitude?.trim()),
      hint: "Add verified coordinates for maps and nearby search.",
      priority: 3,
    },
    {
      key: "hours",
      label: "Opening hours",
      done: input.hoursCount > 0,
      hint: "Tell customers when you are open.",
      priority: 4,
    },
    {
      key: "services",
      label: "Services or items",
      done: input.servicesCount > 0,
      hint: "Add the services, products, or menu items you actually offer.",
      priority: 5,
    },
    {
      key: "facilities",
      label: "Facilities",
      done: input.facilitiesCount > 0,
      hint: "Add verified accessibility or facility details.",
      priority: 7,
    },
    {
      key: "photos",
      label: "Cover photo",
      done: input.coverImageCount > 0,
      hint: "Add a truthful cover image from the Photos tool.",
      priority: 6,
    },
  ];
  const completed = sections.filter(section => section.done).length;
  const percentage = Math.round((completed / sections.length) * 100);
  const nextBestAction = sections
    .filter(section => !section.done)
    .sort((left, right) => left.priority - right.priority)
    .map(({ key, label, hint, priority }) => ({ key, label, hint, priority } satisfies NextBestAction))[0] ?? null;
  return { percentage, completed, total: sections.length, sections, nextBestAction };
}
