const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.slice(0, 240).replace(/-+$/g, "");
}

export function isValidSlug(value: string): boolean {
  return value.length >= 2 && value.length <= 240 && VALID_SLUG.test(value);
}

export function preferredBusinessSlug(name: string, requested?: string | null): string {
  const manual = requested?.trim().toLowerCase() ?? "";
  if (isValidSlug(manual)) return manual;
  const generated = slugify(name);
  return generated.length >= 2 ? generated : "business";
}

export function numberedSlug(base: string, suffix: number): string {
  const tail = `-${suffix}`;
  return `${base.slice(0, Math.max(2, 240 - tail.length)).replace(/-+$/g, "")}${tail}`;
}

export const slugPattern = VALID_SLUG;
