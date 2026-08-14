export type DuplicateCandidateInput = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string;
  cityId: number;
  latitude: string | null;
  longitude: string | null;
};

export type DuplicateCheckInput = Omit<DuplicateCandidateInput, "id">;

export type DuplicateMatch = {
  score: number;
  classification: "likely" | "possible";
  reasons: string[];
};

export function normalizeDuplicateText(value?: string | null) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function normalizePhone(value?: string | null) {
  return (value ?? "").replace(/\D/g, "").replace(/^0+/, "");
}

function coordinateDistanceKm(a: DuplicateCheckInput, b: DuplicateCandidateInput) {
  const latA = Number(a.latitude);
  const lonA = Number(a.longitude);
  const latB = Number(b.latitude);
  const lonB = Number(b.longitude);
  if (![latA, lonA, latB, lonB].every(Number.isFinite)) return null;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(latB - latA);
  const longitudeDelta = toRadians(lonB - lonA);
  const x = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function scoreDuplicateCandidate(input: DuplicateCheckInput, candidate: DuplicateCandidateInput): DuplicateMatch | null {
  const reasons: string[] = [];
  let score = 0;
  const inputName = normalizeDuplicateText(input.name);
  const candidateName = normalizeDuplicateText(candidate.name);
  if (inputName && inputName === candidateName) { score += 55; reasons.push("Same business name"); }
  else if (inputName.length > 5 && candidateName.length > 5 && (inputName.includes(candidateName) || candidateName.includes(inputName))) { score += 30; reasons.push("Very similar business name"); }

  const inputPhone = normalizePhone(input.phone);
  const candidatePhone = normalizePhone(candidate.phone);
  if (inputPhone.length >= 7 && inputPhone === candidatePhone) { score += 55; reasons.push("Same phone number"); }

  const inputEmail = (input.email ?? "").trim().toLowerCase();
  const candidateEmail = (candidate.email ?? "").trim().toLowerCase();
  if (inputEmail && inputEmail === candidateEmail) { score += 45; reasons.push("Same email address"); }

  const inputAddress = normalizeDuplicateText(input.address);
  const candidateAddress = normalizeDuplicateText(candidate.address);
  if (inputAddress.length > 8 && inputAddress === candidateAddress) { score += 35; reasons.push("Same address"); }
  else if (inputAddress.length > 12 && candidateAddress.length > 12 && (inputAddress.includes(candidateAddress) || candidateAddress.includes(inputAddress))) { score += 20; reasons.push("Similar address"); }

  if (input.cityId === candidate.cityId) score += 5;
  const distance = coordinateDistanceKm(input, candidate);
  if (distance !== null && distance <= 0.1) { score += 25; reasons.push("Same map location"); }
  else if (distance !== null && distance <= 0.5) { score += 10; reasons.push("Nearby map location"); }

  if (score < 35) return null;
  return { score: Math.min(score, 100), classification: score >= 70 ? "likely" : "possible", reasons };
}
