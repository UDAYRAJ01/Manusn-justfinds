export type BusinessHoursInterval = {
  opensAt: string;
  closesAt: string;
};

export type BusinessHoursDay = {
  dayOfWeek: number;
  opensAt?: string | null;
  closesAt?: string | null;
  intervals?: unknown;
  isClosed?: boolean | null;
  isTwentyFourHours?: boolean | null;
};

export type BusinessSpecialHours = {
  date: string;
  label?: string | null;
  isClosed?: boolean | null;
  intervals?: unknown;
};

export type BusinessHoursStatus = {
  state: "open" | "closed" | "unknown";
  label: "Open now" | "Closed now" | "Hours unavailable";
  localDate: string;
  localTime: string;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

function parseClock(value: string | null | undefined): number | null {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeIntervals(day: BusinessHoursDay | BusinessSpecialHours | null | undefined): BusinessHoursInterval[] {
  if (!day || day.isClosed) return [];
  if (day.intervals && Array.isArray(day.intervals)) {
    return day.intervals.flatMap((interval) => {
      if (!interval || typeof interval !== "object") return [];
      const item = interval as { opensAt?: unknown; closesAt?: unknown; open?: unknown; close?: unknown };
      const opensAt = typeof item.opensAt === "string" ? item.opensAt : typeof item.open === "string" ? item.open : null;
      const closesAt = typeof item.closesAt === "string" ? item.closesAt : typeof item.close === "string" ? item.close : null;
      return opensAt && closesAt && parseClock(opensAt) !== null && parseClock(closesAt) !== null ? [{ opensAt, closesAt }] : [];
    });
  }
  if ("isTwentyFourHours" in day && day.isTwentyFourHours) return [{ opensAt: "00:00", closesAt: "24:00" }];
  const opensAt = "opensAt" in day ? day.opensAt : null;
  const closesAt = "closesAt" in day ? day.closesAt : null;
  return opensAt && closesAt && parseClock(opensAt) !== null && parseClock(closesAt) !== null ? [{ opensAt, closesAt }] : [];
}

function localParts(now: Date, timeZone: string | null | undefined) {
  const zone = timeZone || "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now).reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    const weekday = DAY_NAMES.findIndex((name) => name.slice(0, 3) === parts.weekday);
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      dayOfWeek: weekday >= 0 ? weekday : 0,
      minute: Number(parts.hour) * 60 + Number(parts.minute),
      time: `${parts.hour}:${parts.minute}`,
    };
  } catch {
    return null;
  }
}

function intervalContains(interval: BusinessHoursInterval, minute: number): boolean {
  const start = parseClock(interval.opensAt);
  const end = interval.closesAt === "24:00" ? 1440 : parseClock(interval.closesAt);
  if (start === null || end === null) return false;
  if (start === end) return true;
  if (end > start) return minute >= start && minute < end;
  return minute >= start || minute < end;
}

function hasOvernightCarry(interval: BusinessHoursInterval, minute: number): boolean {
  const start = parseClock(interval.opensAt);
  const end = interval.closesAt === "24:00" ? 1440 : parseClock(interval.closesAt);
  return start !== null && end !== null && end < start && minute < end;
}

export function getBusinessHoursStatus(
  weeklyHours: BusinessHoursDay[],
  specialHours: BusinessSpecialHours[] = [],
  timeZone?: string | null,
  now = new Date(),
): BusinessHoursStatus {
  const parts = localParts(now, timeZone);
  if (!parts) return { state: "unknown", label: "Hours unavailable", localDate: "", localTime: "" };
  const special = specialHours.find((entry) => entry.date === parts.date);
  const today = special ?? weeklyHours.find((entry) => entry.dayOfWeek === parts.dayOfWeek);
  if (today?.isClosed) return { state: "closed", label: "Closed now", localDate: parts.date, localTime: parts.time };
  const todayIntervals = normalizeIntervals(today);
  if (todayIntervals.some((interval) => intervalContains(interval, parts.minute))) {
    return { state: "open", label: "Open now", localDate: parts.date, localTime: parts.time };
  }
  if (!special) {
    const previousDay = weeklyHours.find((entry) => entry.dayOfWeek === (parts.dayOfWeek + 6) % 7);
    if (normalizeIntervals(previousDay).some((interval) => hasOvernightCarry(interval, parts.minute))) {
      return { state: "open", label: "Open now", localDate: parts.date, localTime: parts.time };
    }
  }
  return { state: "closed", label: "Closed now", localDate: parts.date, localTime: parts.time };
}

export function formatBusinessHours(day: BusinessHoursDay | null | undefined): string {
  if (!day || day.isClosed) return "Closed";
  if (day.isTwentyFourHours) return "Open 24 hours";
  const intervals = normalizeIntervals(day);
  if (!intervals.length) return "Hours unavailable";
  return intervals.map(({ opensAt, closesAt }) => `${opensAt}–${closesAt}`).join(", ");
}

export function getBusinessHoursDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? "Day";
}

export function getBusinessLocalDate(now: Date, timeZone?: string | null): string | null {
  return localParts(now, timeZone)?.date ?? null;
}
