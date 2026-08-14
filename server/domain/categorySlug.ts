import { slugify } from "./slug";

export function normalizeCategorySlug(value: string): string {
  return slugify(value);
}

export function isUsableCategorySlug(value: string): boolean {
  return normalizeCategorySlug(value).length >= 2;
}

export const categorySlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidCategorySlug(value: string): boolean {
  return value.length >= 2 && value.length <= 120 && categorySlugPattern.test(value);
}

export function normalizeAndValidateCategorySlug(value: string): string {
  const normalized = normalizeCategorySlug(value);
  if (!isValidCategorySlug(normalized)) throw new Error("Category name must produce a valid URL slug.");
  return normalized;
}
