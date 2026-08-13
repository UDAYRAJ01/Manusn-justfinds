export type SearchIntent = {
  rawQuery: string;
  searchTerm: string;
  locationTerm?: string;
  mode: "standard" | "nearby" | "recommended";
};

const compactWhitespace = (value: string) => value.trim().replace(/\s+/g, " ");

/**
 * Parses the small, deterministic subset of natural-language search phrases
 * supported by the public discovery API. Taxonomy resolution stays in the
 * data layer, so an AI parser can replace this function later without
 * changing the public search contract.
 */
export function parseSearchIntent(query: string): SearchIntent {
  const rawQuery = compactWhitespace(query);
  if (!rawQuery) return { rawQuery, searchTerm: "", mode: "standard" };

  let working = rawQuery;
  let mode: SearchIntent["mode"] = "standard";
  let locationTerm: string | undefined;

  if (/\b(best|recommended|top)\b/i.test(working)) {
    mode = "recommended";
    working = working.replace(/\b(best|recommended|top)\b/gi, " ");
  }

  if (/\bnear me\b/i.test(working)) {
    mode = "nearby";
    working = working.replace(/\bnear me\b/gi, " ");
  } else {
    const locationMatch = working.match(/\b(?:in|near)\s+(.+)$/i);
    if (locationMatch?.[1]) {
      locationTerm = compactWhitespace(locationMatch[1]);
      working = working.slice(0, locationMatch.index).trim();
    }
  }

  return { rawQuery, searchTerm: compactWhitespace(working), locationTerm, mode };
}
