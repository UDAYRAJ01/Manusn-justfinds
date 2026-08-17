export const verificationEvidenceGuidance = [
  { title: "Business registration", detail: "Use a current registration or licence that identifies the business." },
  { title: "Address or ownership proof", detail: "Use a current document that supports the business location or ownership." },
  { title: "Private review", detail: "Evidence is uploaded from the owner workspace and reviewed privately by Just Finds." },
] as const;

export const notFoundRecoveryLinks = [
  { href: "/search", label: "Search businesses" },
  { href: "/", label: "Go home" },
  { href: "/categories", label: "Browse categories" },
] as const;

export function publicVerificationStatus(isVerified: boolean) {
  return isVerified
    ? { title: "Verified Just Finds listing", detail: "This certificate matches a published business profile with a verified Just Finds status.", tone: "verified" as const }
    : { title: "Verification not complete", detail: "This profile is published, but Just Finds has not marked its verification status as verified.", tone: "pending" as const };
}
