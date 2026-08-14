export function getSelectedBusinessId(location: string): number | null {
  const query = location.includes("?") ? location.slice(location.indexOf("?") + 1) : "";
  const raw = new URLSearchParams(query).get("businessId");
  const id = raw ? Number(raw) : 0;
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function getOwnerListingPath(businessId?: number | null): string {
  return Number.isInteger(businessId) && Number(businessId) > 0
    ? `/business?businessId=${Number(businessId)}`
    : "/business";
}
