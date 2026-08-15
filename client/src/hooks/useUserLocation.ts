import { useCallback, useEffect, useState } from "react";

export type UserCoordinates = { latitude: number; longitude: number; accuracyMeters: number | null; capturedAt: number };
export type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

const storageKey = "just-finds-user-coordinates";
const maxAgeMs = 30 * 60 * 1000;

export function readStoredCoordinates(): UserCoordinates | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserCoordinates>;
    if (typeof parsed.latitude !== "number" || typeof parsed.longitude !== "number" || typeof parsed.capturedAt !== "number") return null;
    if (Date.now() - parsed.capturedAt > maxAgeMs) return null;
    return { latitude: parsed.latitude, longitude: parsed.longitude, accuracyMeters: typeof parsed.accuracyMeters === "number" ? parsed.accuracyMeters : null, capturedAt: parsed.capturedAt };
  } catch {
    return null;
  }
}

function writeStoredCoordinates(value: UserCoordinates) {
  try { window.sessionStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

/**
 * Shared browser-location hook. Coordinates persist for the session so every
 * discovery surface (search hero, results, business detail) can measure real
 * distance without asking for permission again on each page.
 */
export function useUserLocation() {
  const [coordinates, setCoordinates] = useState<UserCoordinates | null>(readStoredCoordinates);
  const [status, setStatus] = useState<LocationStatus>(() => (readStoredCoordinates() ? "granted" : "idle"));
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.geolocation) setStatus("unsupported");
  }, []);

  const request = useCallback(() => {
    return new Promise<UserCoordinates | null>(resolve => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setStatus("unsupported");
        setMessage("This browser cannot share your location. Choose a city instead.");
        resolve(null);
        return;
      }
      setStatus("requesting");
      setMessage("");
      navigator.geolocation.getCurrentPosition(
        position => {
          const next: UserCoordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyMeters: Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null, capturedAt: Date.now() };
          writeStoredCoordinates(next);
          setCoordinates(next);
          setStatus("granted");
          resolve(next);
        },
        error => {
          setStatus("denied");
          setMessage(error.code === error.PERMISSION_DENIED ? "Location permission was declined. You can still search by city or locality." : "We could not read your location just now. Please try again or choose a city.");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 120_000 },
      );
    });
  }, []);

  const clear = useCallback(() => {
    try { window.sessionStorage.removeItem(storageKey); } catch { /* storage unavailable */ }
    setCoordinates(null);
    setStatus("idle");
    setMessage("");
  }, []);

  return { coordinates, status, message, request, clear };
}

export function formatDistance(distanceKm: number | null | undefined) {
  if (distanceKm === null || distanceKm === undefined || !Number.isFinite(distanceKm)) return null;
  if (distanceKm < 1) return `${Math.max(50, Math.round(distanceKm * 1000 / 50) * 50)} m away`;
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km away`;
  return `${Math.round(distanceKm)} km away`;
}
