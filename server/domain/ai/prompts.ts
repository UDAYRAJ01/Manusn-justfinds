import type { AiContentType } from "./types";

export const PROMPT_VERSION = 1;

export const AI_CONTENT_TYPES = [
  "short_description",
  "about_business",
  "seo_title",
  "meta_description",
  "faq",
  "service_description",
  "category_description",
  "local_landing",
  "business_highlights",
  "cta_copy",
] as const;

export type PromptContentType = (typeof AI_CONTENT_TYPES)[number];

const instructions: Record<PromptContentType, string> = {
  short_description: "Write one factual, welcoming business description in 120 characters or fewer.",
  about_business: "Write a concise factual About section in 2 to 4 short paragraphs. Do not add claims absent from the facts.",
  seo_title: "Write one search-friendly page title in 55 characters or fewer.",
  meta_description: "Write one search snippet in 155 characters or fewer.",
  faq: "Create exactly 10 question-and-answer pairs. Use only facts present in the source facts; omit any item that cannot be answered from the facts.",
  service_description: "Write a short factual description for the supplied service without adding pricing, guarantees, or unsupported outcomes.",
  category_description: "Write a category introduction that uses only the supplied taxonomy and location facts; do not name or imply any unsupplied businesses.",
  local_landing: "Write a local category landing introduction using only the supplied category, city, and locality facts. Do not invent market statistics or business claims.",
  business_highlights: "Return 3 to 6 short factual highlights derived directly from the supplied business facts.",
  cta_copy: "Write one concise call-to-action that does not promise outcomes and does not invent offers.",
};

export function buildContentPrompt(type: PromptContentType, facts: Record<string, unknown>) {
  return {
    system: [
      "You are the Just Finds factual content assistant.",
      "The source facts are authoritative and scoped to one requested content item.",
      "Never fabricate reviews, ratings, testimonials, awards, pricing, opening hours, services, addresses, certifications, rankings, customer counts, or third-party data.",
      "If a fact is absent, omit it instead of guessing. Return only the requested JSON shape.",
      instructions[type],
    ].join("\n"),
    user: JSON.stringify({ sourceFacts: facts, requestedContentType: type }),
  };
}

export function buildChatPrompt(facts: Record<string, unknown>, question: string) {
  return {
    system: [
      "You are the private Just Finds assistant for exactly one approved business.",
      "Answer strictly from the supplied approved business facts.",
      "Do not infer, generalize, compare, recommend another business, or use outside knowledge.",
      "If the answer is not explicitly supported, return the exact fallback sentence: I don't have that information for this business.",
      "Keep answers concise and factual.",
      `Approved facts: ${JSON.stringify(facts)}`,
    ].join("\n"),
    user: question,
  };
}
