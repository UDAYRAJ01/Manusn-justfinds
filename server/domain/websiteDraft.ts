export const websiteDraftSectionTypes = [
  "hero",
  "about",
  "services",
  "facilities",
  "gallery",
  "hours",
  "reviews",
  "faq",
  "map",
  "contact",
  "cta",
  "footer",
  "menu",
  "rooms",
  "doctors",
  "offers",
] as const;

export type WebsiteDraftSectionType = (typeof websiteDraftSectionTypes)[number];

export type WebsiteDraftSectionConfig = {
  label?: string;
  eyebrow?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: "#contact" | "#services" | "#book-appointment";
  bullets?: string[];
};

export type GeneratedWebsiteDraft = {
  seoTitle: string;
  metaDescription: string;
  sections: Array<{
    sectionType: WebsiteDraftSectionType;
    config: WebsiteDraftSectionConfig;
  }>;
};

export const websiteDraftOutputSchema = {
  name: "grounded_website_draft",
  strict: true,
  schema: {
    type: "object",
    properties: {
      seoTitle: { type: "string", description: "A factual SEO title using only the provided business name, category, and city." },
      metaDescription: { type: "string", description: "A factual meta description using only supplied business facts; no superlatives or unsupported claims." },
      sections: {
        type: "array",
        minItems: 1,
        maxItems: 16,
        items: {
          type: "object",
          properties: {
            sectionType: { type: "string", enum: [...websiteDraftSectionTypes] },
            config: {
              type: "object",
              properties: {
                label: { type: "string" },
                eyebrow: { type: "string" },
                headline: { type: "string" },
                body: { type: "string" },
                ctaLabel: { type: "string" },
                ctaHref: { type: "string", enum: ["#contact", "#services", "#book-appointment"] },
                bullets: { type: "array", maxItems: 8, items: { type: "string" } },
              },
              additionalProperties: false,
            },
          },
          required: ["sectionType", "config"],
          additionalProperties: false,
        },
      },
    },
    required: ["seoTitle", "metaDescription", "sections"],
    additionalProperties: false,
  },
} as const;

const universalSectionTypes: WebsiteDraftSectionType[] = ["hero", "about", "services", "gallery", "hours", "reviews", "map", "contact", "footer"];

export function canonicalWebsiteSectionTypes(categoryName?: string | null): WebsiteDraftSectionType[] {
  const category = (categoryName ?? "").toLowerCase();
  if (category.includes("restaurant")) return ["hero", "about", "menu", "services", "gallery", "offers", "reviews", "faq", "map", "contact", "footer"];
  if (category.includes("hotel")) return ["hero", "about", "rooms", "gallery", "offers", "reviews", "map", "contact", "footer"];
  if (category.includes("doctor")) return ["hero", "about", "services", "facilities", "reviews", "faq", "contact", "map", "footer"];
  if (category.includes("hospital")) return ["hero", "about", "doctors", "facilities", "reviews", "faq", "map", "contact", "footer"];
  return universalSectionTypes;
}

function safeText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function safeConfig(value: unknown): WebsiteDraftSectionConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const config: WebsiteDraftSectionConfig = {};
  const label = safeText(source.label, 80);
  const eyebrow = safeText(source.eyebrow, 120);
  const headline = safeText(source.headline, 180);
  const body = safeText(source.body, 900);
  const ctaLabel = safeText(source.ctaLabel, 80);
  const bullets = Array.isArray(source.bullets)
    ? source.bullets.map(item => safeText(item, 180)).filter((item): item is string => Boolean(item)).slice(0, 8)
    : undefined;
  if (label) config.label = label;
  if (eyebrow) config.eyebrow = eyebrow;
  if (headline) config.headline = headline;
  if (body) config.body = body;
  if (ctaLabel) config.ctaLabel = ctaLabel;
  if (source.ctaHref === "#contact" || source.ctaHref === "#services" || source.ctaHref === "#book-appointment") config.ctaHref = source.ctaHref;
  if (bullets?.length) config.bullets = bullets;
  return config;
}

export function normalizeWebsiteDraft(raw: unknown, categoryName?: string | null): GeneratedWebsiteDraft {
  const input = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const seoTitle = safeText(input.seoTitle, 180) ?? "Just Finds business website";
  const metaDescription = safeText(input.metaDescription, 300) ?? "Business information from Just Finds.";
  const candidates = Array.isArray(input.sections) ? input.sections : [];
  const byType = new Map<WebsiteDraftSectionType, WebsiteDraftSectionConfig>();
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const item = candidate as Record<string, unknown>;
    if (typeof item.sectionType !== "string" || !websiteDraftSectionTypes.includes(item.sectionType as WebsiteDraftSectionType)) continue;
    byType.set(item.sectionType as WebsiteDraftSectionType, safeConfig(item.config));
  }
  const sections = canonicalWebsiteSectionTypes(categoryName).map(sectionType => ({ sectionType, config: byType.get(sectionType) ?? {} }));
  return { seoTitle, metaDescription, sections };
}

export function websiteDraftSystemPrompt(): string {
  return [
    "You create a factual, editable local-business website draft for Just Finds.",
    "Use only the approved business facts in the user payload. Never invent awards, ratings, reviews, testimonials, prices, guarantees, locations, staff, opening hours, services, or claims.",
    "Do not write superlatives such as best, number one, leading, trusted, or guaranteed unless the supplied facts explicitly contain that exact claim and it is marked approved.",
    "Return only JSON matching the supplied schema. Keep copy concise, clear, and owner-editable.",
    "A section config may contain presentation copy only. The renderer remains the source of truth for business name, address, contact details, services, photos, reviews, and hours.",
  ].join(" ");
}
