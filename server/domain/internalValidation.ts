export const internalValidationCategorySlug = "just-finds-internal-validation";

export function isInternalValidationBusiness(record: { name: string; categorySlug: string }) {
  return record.categorySlug === internalValidationCategorySlug
    && record.name.startsWith("Just Finds Internal ")
    && record.name.endsWith("TEST ONLY");
}
