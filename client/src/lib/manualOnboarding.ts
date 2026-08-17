export const MANUAL_ONBOARDING_STEPS = [
  { id: 1, key: "identity", title: "Business identity", guidance: "Use the name customers recognise and choose the best matching category." },
  { id: 2, key: "location", title: "Approved city & location", guidance: "Choose an approved Indian city and add the address customers can use." },
  { id: 3, key: "contact", title: "Contact details", guidance: "Add the real ways customers may contact this business." },
  { id: 4, key: "hours", title: "Opening hours", guidance: "Add hours only when they are current; you can leave this for later." },
  { id: 5, key: "services", title: "Services", guidance: "Describe an actual service or product customers can ask about." },
  { id: 6, key: "facilities", title: "Facilities & offers", guidance: "List real facilities; add time-bound offers later only when they exist." },
  { id: 7, key: "media", title: "Owner media", guidance: "Add an owner-provided image only when you have permission to publish it." },
  { id: 8, key: "content", title: "AI content", guidance: "Review and edit any content before it becomes part of the listing." },
  { id: 9, key: "seo", title: "SEO & preview", guidance: "Write a concise search title and description that match your actual business." },
  { id: 10, key: "review", title: "Review & submission", guidance: "Check every fact, address remaining warnings, then submit for review." },
] as const;

export type ManualOnboardingKey = (typeof MANUAL_ONBOARDING_STEPS)[number]["key"];

export type ManualOnboardingDraft = {
  name: string;
  categoryId: string;
  cityId: string;
  address: string;
  description: string;
  phone: string;
  email: string;
};

export function getManualOnboardingErrors(draft: ManualOnboardingDraft) {
  return {
    name: draft.name.trim().length >= 2 ? "" : "Enter a business name with at least 2 characters.",
    categoryId: draft.categoryId ? "" : "Choose a category.",
    cityId: draft.cityId ? "" : "Choose an approved Indian city.",
    address: draft.address.trim().length >= 6 ? "" : "Enter an address with at least 6 characters.",
    description: draft.description.trim().length >= 20 ? "" : "Describe the business in at least 20 factual characters.",
    email: !draft.email.trim() || /^\S+@\S+\.\S+$/.test(draft.email.trim()) ? "" : "Enter a valid email address or leave it blank.",
  };
}

export function isManualOnboardingIdentityReady(draft: ManualOnboardingDraft) {
  const errors = getManualOnboardingErrors(draft);
  return !errors.name && !errors.categoryId;
}

export function isManualOnboardingLocationReady(draft: ManualOnboardingDraft) {
  const errors = getManualOnboardingErrors(draft);
  return !errors.cityId && !errors.address && !errors.description && !errors.email;
}
