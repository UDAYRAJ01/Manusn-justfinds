export type AppointmentWindow = { dayOfWeek: number; startsAt: string; endsAt: string };

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function isValidTime(value: string) { return timePattern.test(value); }
export function isValidIsoDate(value: string) { return isoDatePattern.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)); }

export function assertTimeZone(timeZone: string) {
  try { new Intl.DateTimeFormat("en-US", { timeZone }).format(); return timeZone; }
  catch { throw new Error("Choose a valid IANA time zone."); }
}

export function localDateInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type: string) => parts.find(part => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function timeZoneOffsetMinutes(date: Date, timeZone: string) {
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" }).formatToParts(date).find(value => value.type === "timeZoneName")?.value ?? "GMT";
  if (part === "GMT") return 0;
  const match = part.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === "+" ? minutes : -minutes;
}

export function zonedDateTimeToUtc(localDate: string, localTime: string, timeZone: string) {
  const [year, month, day] = localDate.split("-").map(Number);
  const [hour, minute] = localTime.split(":").map(Number);
  const wallClockMs = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = new Date(wallClockMs - timeZoneOffsetMinutes(new Date(wallClockMs), timeZone) * 60_000);
  candidate = new Date(wallClockMs - timeZoneOffsetMinutes(candidate, timeZone) * 60_000);
  return candidate;
}

function localWeekday(localDate: string) { return new Date(`${localDate}T12:00:00.000Z`).getUTCDay(); }

export function slotsForAvailability(input: {
  now: Date;
  timeZone: string;
  windows: AppointmentWindow[];
  slotDurationMinutes: number;
  minimumNoticeMinutes: number;
  maximumAdvanceDays: number;
  blackoutDates: string[];
  unavailableStartsAt: Date[];
}) {
  const startDate = localDateInTimeZone(input.now, input.timeZone);
  const result: Array<{ startAt: Date; endAt: Date; localDate: string }> = [];
  const busy = new Set(input.unavailableStartsAt.map(value => value.getTime()));
  for (let dayOffset = 0; dayOffset <= input.maximumAdvanceDays; dayOffset += 1) {
    const localDate = new Date(`${startDate}T12:00:00.000Z`);
    localDate.setUTCDate(localDate.getUTCDate() + dayOffset);
    const dateKey = localDate.toISOString().slice(0, 10);
    if (input.blackoutDates.includes(dateKey)) continue;
    for (const window of input.windows.filter(value => value.dayOfWeek === localWeekday(dateKey))) {
      const windowStart = zonedDateTimeToUtc(dateKey, window.startsAt, input.timeZone);
      const windowEnd = zonedDateTimeToUtc(dateKey, window.endsAt, input.timeZone);
      for (let startsAt = windowStart; startsAt.getTime() + input.slotDurationMinutes * 60_000 <= windowEnd.getTime(); startsAt = new Date(startsAt.getTime() + input.slotDurationMinutes * 60_000)) {
        const endAt = new Date(startsAt.getTime() + input.slotDurationMinutes * 60_000);
        if (startsAt.getTime() < input.now.getTime() + input.minimumNoticeMinutes * 60_000 || busy.has(startsAt.getTime())) continue;
        result.push({ startAt: startsAt, endAt, localDate: dateKey });
      }
    }
  }
  return result;
}
