export type AppointmentCalendarInput = {
  startsAt: Date | string;
  endsAt: Date | string;
  businessName: string;
  address?: string | null;
  uid?: string;
};

function icsDate(value: Date | string) {
  return new Date(value).toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

function icsText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(";", "\\;").replaceAll("\n", "\\n");
}

export function buildAppointmentCalendarLinks(input: AppointmentCalendarInput) {
  const title = `Appointment with ${input.businessName}`;
  const description = "Appointment approved through Just Finds.";
  const dates = `${icsDate(input.startsAt)}/${icsDate(input.endsAt)}`;
  const params = new URLSearchParams({ action: "TEMPLATE", text: title, dates, details: description, location: input.address ?? "" });
  const uid = input.uid ?? crypto.randomUUID();
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Just Finds//Appointments//EN", "BEGIN:VEVENT", `UID:${uid}@justfinds`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(input.startsAt)}`, `DTEND:${icsDate(input.endsAt)}`, `SUMMARY:${icsText(title)}`, `DESCRIPTION:${icsText(description)}`, `LOCATION:${icsText(input.address ?? "")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return {
    google: `https://calendar.google.com/calendar/render?${params.toString()}`,
    ical: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`,
  };
}
