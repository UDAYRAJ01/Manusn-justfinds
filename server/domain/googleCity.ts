export type ExistingCity = { id: number; name: string };

const preferredGoogleCityTypes = ["locality", "postal_town", "administrative_area_level_3", "administrative_area_level_2"];

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function googleCityCandidates(addressComponents: unknown): string[] {
  const components = Array.isArray(addressComponents) ? addressComponents : [];
  const candidates: string[] = [];
  for (const type of preferredGoogleCityTypes) {
    for (const component of components) {
      const record = component as { longText?: unknown; shortText?: unknown; types?: unknown };
      const types = Array.isArray(record.types) ? record.types.filter((value): value is string => typeof value === "string") : [];
      if (!types.includes(type)) continue;
      for (const value of [record.longText, record.shortText]) {
        if (typeof value === "string" && value.trim() && !candidates.some(candidate => normalized(candidate) === normalized(value))) candidates.push(value.trim());
      }
    }
  }
  return candidates;
}

export function resolveGoogleCity(addressComponents: unknown, cities: ExistingCity[]) {
  const cityByName = new Map(cities.map(city => [normalized(city.name), city]));
  for (const candidate of googleCityCandidates(addressComponents)) {
    const city = cityByName.get(normalized(candidate));
    if (city) return { ...city, googleLocality: candidate };
  }
  return null;
}
