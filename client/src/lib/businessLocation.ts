export type BusinessCoordinates = { lat: number; lng: number };

function toFiniteCoordinate(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return null;
  const coordinate = typeof value === "number" ? value : Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

export function parseBusinessCoordinates(
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined,
): BusinessCoordinates | null {
  const lat = toFiniteCoordinate(latitude);
  const lng = toFiniteCoordinate(longitude);
  if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
