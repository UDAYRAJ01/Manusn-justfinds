export const aiContentTypes = [
  "short_description",
  "about_business",
  "business_seo_profile",
  "seo_title",
  "meta_description",
  "faq",
  "service_description",
  "category_description",
  "local_landing",
  "business_highlights",
  "cta_copy",
] as const;

export type AiContentType = (typeof aiContentTypes)[number];

export type FaqItem = { question: string; answer: string; sourceFields?: string[]; status?: "grounded" };

export type GeneratedContent = {
  text?: string;
  title?: string;
  description?: string;
  highlights?: string[];
  faqs?: FaqItem[];
};

export type ValidationResult = {
  accepted: boolean;
  flags: string[];
  normalized: GeneratedContent;
};

export type BusinessAiFacts = {
  business: {
    id: number;
    name: string;
    address: string;
    postcode: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    website: string | null;
    shortDescription: string | null;
    approvedDescription: string | null;
    latitude: string | null;
    longitude: string | null;
    isVerified: boolean;
    status: string;
    category: string;
    categorySlug: string;
    city: string;
    citySlug: string;
    locality: string | null;
  };
  services: Array<{ name: string; description: string | null }>;
  hours: Array<{ dayOfWeek: number; opensAt: string | null; closesAt: string | null; isClosed: boolean; isTwentyFourHours: boolean }>;
  facilities: Array<{ name: string; details: string | null }>;
  fields: Array<{ label: string; value: unknown }>;
};
